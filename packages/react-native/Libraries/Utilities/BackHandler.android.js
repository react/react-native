/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import NativeDeviceEventManager from '../../Libraries/NativeModules/specs/NativeDeviceEventManager';
import {setEventInitTimeStamp} from '../../src/private/webapis/dom/events/internals/EventInternals';
import RCTDeviceEventEmitter from '../EventEmitter/RCTDeviceEventEmitter';
import {HardwareBackPressEvent} from './HardwareBackPressEvent';

const DEVICE_BACK_EVENT = 'hardwareBackPress';

type BackPressEventName = 'backPress' | 'hardwareBackPress';
type BackPressHandler = (event: HardwareBackPressEvent) => ?boolean;

const _backPressSubscriptions: Array<BackPressHandler> = [];
let nativeNavigationEnabled = false;
const nativeNavigationFallbacks: Set<BackPressHandler> = new Set();

function updateNativeNavigation(): void {
  NativeDeviceEventManager?.setNativeNavigationEnabled(
    nativeNavigationEnabled,
    _backPressSubscriptions.some(
      handler => !nativeNavigationFallbacks.has(handler),
    ),
  );
}

RCTDeviceEventEmitter.addListener(DEVICE_BACK_EVENT, function (nativeEvent) {
  const options = {};
  const nativeTimestamp = nativeEvent?.timeStamp;
  if (nativeTimestamp != null) {
    setEventInitTimeStamp(options, nativeTimestamp);
  }
  const event = new HardwareBackPressEvent(options);
  for (let i = _backPressSubscriptions.length - 1; i >= 0; i--) {
    if (_backPressSubscriptions[i]?.(event)) {
      return;
    }
  }

  BackHandler.exitApp();
});

/**
 * Detects hardware button presses for back navigation and lets you register
 * event listeners for the system's back action. Event subscriptions are called
 * in reverse order (i.e. last registered subscription first). If one
 * subscription returns `true`, earlier subscriptions are not called.
 *
 * @see https://reactnative.dev/docs/backhandler
 * @platform android
 */
type TBackHandler = {
  readonly exitApp: () => void,
  readonly setNativeNavigationEnabled: (enabled: boolean) => void,
  readonly addEventListener: (
    eventName: BackPressEventName,
    handler: BackPressHandler,
    options?: {nativeNavigationFallback?: boolean, ...},
  ) => {
    remove: () => void,
    setNativeNavigationFallback: (enabled: boolean) => void,
    ...
  },
};
const BackHandler: TBackHandler = {
  /**
   * Opt into native predictive Back ownership on Android. With no registered
   * JavaScript handlers, native navigators or the system own Back. Any handler
   * conservatively restores JavaScript ownership, regardless of its return value.
   * Configure this once at the navigation root, not per screen.
   */
  setNativeNavigationEnabled(enabled: boolean): void {
    nativeNavigationEnabled = enabled;
    updateNativeNavigation();
  },
  /**
   * Programmatically exit the app.
   */
  exitApp: function (): void {
    if (!NativeDeviceEventManager) {
      return;
    }

    NativeDeviceEventManager.invokeDefaultBackPressHandler();
  },

  /**
   * Listen for the `hardwareBackPress` event. The handler should return `true`
   * to prevent the event from bubbling to earlier registered listeners.
   *
   * Navigation libraries may mark their fallback as nativeNavigationFallback
   * only while an equivalent native owner is ready. The fallback remains in the
   * JS chain, so an unhandled overlay event still navigates. Use the returned
   * setNativeNavigationFallback method to change ownership without changing
   * handler ordering. Ordinary application handlers must keep the default.
   */
  addEventListener: function (
    eventName: BackPressEventName,
    handler: BackPressHandler,
    options?: {nativeNavigationFallback?: boolean, ...},
  ): {
    remove: () => void,
    setNativeNavigationFallback: (enabled: boolean) => void,
    ...
  } {
    if (_backPressSubscriptions.indexOf(handler) === -1) {
      _backPressSubscriptions.push(handler);
      if (options?.nativeNavigationFallback === true) {
        nativeNavigationFallbacks.add(handler);
      }
      if (nativeNavigationEnabled) updateNativeNavigation();
    }
    return {
      setNativeNavigationFallback: (enabled: boolean): void => {
        if (_backPressSubscriptions.indexOf(handler) === -1) return;
        if (enabled) nativeNavigationFallbacks.add(handler);
        else nativeNavigationFallbacks.delete(handler);
        if (nativeNavigationEnabled) updateNativeNavigation();
      },
      remove: (): void => {
        const index = _backPressSubscriptions.indexOf(handler);
        if (index !== -1) {
          _backPressSubscriptions.splice(index, 1);
          nativeNavigationFallbacks.delete(handler);
          if (nativeNavigationEnabled) updateNativeNavigation();
        }
      },
    };
  },
};

export default BackHandler;
