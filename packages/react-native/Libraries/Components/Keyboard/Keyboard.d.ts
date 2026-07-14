/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {NativeEventEmitter} from '../../EventEmitter/NativeEventEmitter';
import {EmitterSubscription} from '../../vendor/emitter/EventEmitter';

export type KeyboardEventName =
  | 'keyboardWillShow'
  | 'keyboardDidShow'
  | 'keyboardWillHide'
  | 'keyboardDidHide'
  | 'keyboardWillChangeFrame'
  | 'keyboardDidChangeFrame';

export type KeyboardEventEasing =
  'easeIn' | 'easeInEaseOut' | 'easeOut' | 'linear' | 'keyboard';

type KeyboardMetrics = {
  screenX: number;
  screenY: number;
  width: number;
  height: number;
};

interface KeyboardEventIOS {
  /**
   * @platform ios
   */
  startCoordinates: KeyboardMetrics;
  /**
   * @platform ios
   */
  isEventFromThisApp: boolean;
}

export interface KeyboardEvent extends Partial<KeyboardEventIOS> {
  /**
   * Always set to 0 on Android.
   */
  duration: number;
  /**
   * Always set to "keyboard" on Android.
   */
  easing: KeyboardEventEasing;
  endCoordinates: KeyboardMetrics;
}

type KeyboardEventListener = (event: KeyboardEvent) => void;

export interface KeyboardStatic extends NativeEventEmitter {
  /**
   * Dismisses the active keyboard and removes focus.
   */
  dismiss: () => void;
  /**
   * The `addListener` function connects a JavaScript function to an identified native
   * keyboard notification event.
   *
   * This function then returns the reference to the listener.
   *
   * {string} eventName The `nativeEvent` is the string that identifies the event you're listening for.  This
   *can be any of the following:
   *
   * - `keyboardWillShow`
   * - `keyboardDidShow`
   * - `keyboardWillHide`
   * - `keyboardDidHide`
   * - `keyboardWillChangeFrame`
   * - `keyboardDidChangeFrame`
   *
   * Note that if you set `android:windowSoftInputMode` to `adjustResize`  or `adjustNothing`,
   * only `keyboardDidShow` and `keyboardDidHide` events will be available on Android.
   * `keyboardWillShow` as well as `keyboardWillHide` are generally not available on Android
   * since there is no native corresponding event.
   *
   * {function} callback function to be called when the event fires.
   */
  addListener: (
    eventType: KeyboardEventName,
    listener: KeyboardEventListener,
  ) => EmitterSubscription;
  /**
   * Useful for syncing TextInput (or other keyboard accessory view) size of
   * position changes with keyboard movements.
   */
  scheduleLayoutAnimation: (event: KeyboardEvent) => void;

  /**
   * Whether the keyboard is last known to be visible.
   */
  isVisible(): boolean;

  /**
   * Return the metrics of the soft-keyboard if visible.
   */
  metrics(): KeyboardMetrics | undefined;
}

export const Keyboard: KeyboardStatic;
