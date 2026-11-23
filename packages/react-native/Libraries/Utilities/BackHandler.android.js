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
import * as ReactNativeFeatureFlags from '../../src/private/featureflags/ReactNativeFeatureFlags';
import {setEventInitTimeStamp} from '../../src/private/webapis/dom/events/internals/EventInternals';
import RCTDeviceEventEmitter from '../EventEmitter/RCTDeviceEventEmitter';
import {HardwareBackPressEvent} from './HardwareBackPressEvent';

const DEVICE_BACK_EVENT = 'hardwareBackPress';

type BackPressEventName = 'backPress' | 'hardwareBackPress';
type BackPressHandler = (event: HardwareBackPressEvent) => ?boolean | void;

type BackPressSubscription = {
  handler: BackPressHandler,
  intercept: boolean,
};

const _backPressSubscriptions: Array<BackPressSubscription> = [];

/**
 * Turns interception on while at least one listener asks for it, and off
 * when none does. Android reads this before the back gesture starts, so it
 * has to be up to date ahead of time.
 *
 * With the `enablePredictiveBackAndroid` feature flag on, it sends the value on
 * every change to the listeners, even when it is the same as before, so a
 * repeated request (for example when a screen gets focus) applies again if
 * native code or another activity changed it. With the flag off and no
 * listener asking for back, nothing is sent.
 */
function updateIntercept(): void {
  const interceptEnabled = _backPressSubscriptions.some(
    subscription => subscription.intercept,
  );
  if (
    !interceptEnabled &&
    !ReactNativeFeatureFlags.enablePredictiveBackAndroid()
  ) {
    return;
  }
  // Optional: native code built before this method existed doesn't have it.
  NativeDeviceEventManager?.setInterceptEnabled?.(interceptEnabled);
}

RCTDeviceEventEmitter.addListener(DEVICE_BACK_EVENT, function (nativeEvent) {
  const options = {};
  const nativeTimestamp = nativeEvent?.timeStamp;
  if (nativeTimestamp != null) {
    setEventInitTimeStamp(options, nativeTimestamp);
  }
  const event = new HardwareBackPressEvent(options);
  for (let i = _backPressSubscriptions.length - 1; i >= 0; i--) {
    if (_backPressSubscriptions[i]?.handler(event)) {
      return;
    }
  }

  BackHandler.exitApp();
});

type BackHandlerOptions = {
  /**
   * Android 16+ with targetSdk 36+ only. Ask Android to send back to React
   * Native while this listener exists, instead of handling back itself with
   * the predictive back animation. React Native intercepts back while at
   * least one listener asks for it. Set it ahead of time, for example to your
   * navigator's `canGoBack`. Defaults to `false`.
   *
   * It is a request, not a guarantee: native code that adds its own back
   * callback after React Native's still receives back first.
   */
  intercept?: boolean,
};

type BackHandlerSubscription = {
  remove: () => void,
  /**
   * Changes this listener's `intercept` request without removing it.
   */
  setInterceptEnabled: (enabled: boolean) => void,
  ...
};

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
  readonly addEventListener: (
    eventName: BackPressEventName,
    handler: BackPressHandler,
    options?: BackHandlerOptions,
  ) => BackHandlerSubscription,
};
const BackHandler: TBackHandler = {
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
   * Adding the same handler again reuses its listener: it keeps its place,
   * and its request changes only if `intercept` is passed.
   */
  addEventListener: function (
    eventName: BackPressEventName,
    handler: BackPressHandler,
    options?: BackHandlerOptions,
  ): BackHandlerSubscription {
    let subscription: ?BackPressSubscription = _backPressSubscriptions.find(
      existing => existing.handler === handler,
    );
    if (subscription == null) {
      const created: BackPressSubscription = {handler, intercept: false};
      _backPressSubscriptions.push(created);
      subscription = created;
    }
    if (options?.intercept !== undefined) {
      subscription.intercept = options.intercept === true;
    }
    updateIntercept();

    const registered = subscription;
    return {
      remove: (): void => {
        const index = _backPressSubscriptions.indexOf(registered);
        if (index !== -1) {
          _backPressSubscriptions.splice(index, 1);
          updateIntercept();
        }
      },
      setInterceptEnabled: (enabled: boolean): void => {
        registered.intercept = enabled;
        updateIntercept();
      },
    };
  },
};

export default BackHandler;
