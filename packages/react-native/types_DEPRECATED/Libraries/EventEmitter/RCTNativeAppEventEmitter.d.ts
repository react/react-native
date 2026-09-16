/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {DeviceEventEmitterStatic} from './RCTDeviceEventEmitter';

export interface NativeEventSubscription {
  /**
   * Call this method to un-subscribe from a native-event
   */
  remove(): void;
}

/**
 * Receive events from native-code
 * Deprecated - subclass NativeEventEmitter to create granular event modules instead of
 * adding all event listeners directly to RCTNativeAppEventEmitter.
 * @see https://github.com/facebook/react-native/blob/0.34-stable\Libraries\EventEmitter\RCTNativeAppEventEmitter.js
 * @see https://reactnative.dev/docs/native-modules-ios#sending-events-to-javascript
 */
type RCTNativeAppEventEmitter = DeviceEventEmitterStatic;

/**
 * Deprecated - subclass NativeEventEmitter to create granular event modules instead of
 * adding all event listeners directly to RCTNativeAppEventEmitter.
 */
export const NativeAppEventEmitter: RCTNativeAppEventEmitter;
