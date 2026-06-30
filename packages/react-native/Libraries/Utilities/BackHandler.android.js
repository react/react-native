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
  readonly addEventListener: (
    eventName: BackPressEventName,
    handler: BackPressHandler,
  ) => {remove: () => void, ...},
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
   */
  addEventListener: function (
    eventName: BackPressEventName,
    handler: BackPressHandler,
  ): {remove: () => void, ...} {
    if (_backPressSubscriptions.indexOf(handler) === -1) {
      _backPressSubscriptions.push(handler);
    }
    return {
      remove: (): void => {
        const index = _backPressSubscriptions.indexOf(handler);
        if (index !== -1) {
          _backPressSubscriptions.splice(index, 1);
        }
      },
    };
  },
};

export default BackHandler;
