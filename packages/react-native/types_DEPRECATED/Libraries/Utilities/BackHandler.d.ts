/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {NativeEventSubscription} from '../EventEmitter/RCTNativeAppEventEmitter';

export type BackPressEventName = 'hardwareBackPress';

/**
 * Event dispatched when the hardware back button is pressed.
 * The `timeStamp` property reflects the native timestamp captured
 * when the back press was emitted.
 */
export interface HardwareBackPressEvent {
  readonly type: string;
  readonly timeStamp: number;
}

/**
 * Detect hardware back button presses, and programmatically invoke the
 * default back button functionality to exit the app if there are no
 * listeners or if none of the listeners return true.
 * The event subscriptions are called in reverse order
 * (i.e. last registered subscription first), and if one subscription
 * returns true then subscriptions registered earlier
 * will not be called.
 *
 * @see https://reactnative.dev/docs/backhandler
 */
export interface BackHandlerStatic {
  exitApp(): void;
  addEventListener(
    eventName: BackPressEventName,
    handler: (event: HardwareBackPressEvent) => boolean | null | undefined,
  ): NativeEventSubscription;
}

export const BackHandler: BackHandlerStatic;
export type BackHandler = BackHandlerStatic;
