/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import NativeToastAndroid from './NativeToastAndroid';

/**
 * Displays Android toast messages.
 *
 * @see https://reactnative.dev/docs/toastandroid
 * @platform android
 */

const ToastAndroidConstants = NativeToastAndroid.getConstants();

const ToastAndroid = {
  /** Toast duration constant for a short display time. */
  SHORT: ToastAndroidConstants.SHORT as number,

  /** Toast duration constant for a long display time. */
  LONG: ToastAndroidConstants.LONG as number,

  /** Toast gravity constant for top positioning. */
  TOP: ToastAndroidConstants.TOP as number,

  /** Toast gravity constant for bottom positioning. */
  BOTTOM: ToastAndroidConstants.BOTTOM as number,

  /** Toast gravity constant for center positioning. */
  CENTER: ToastAndroidConstants.CENTER as number,

  /**
   * Show a toast with the given message and duration (`ToastAndroid.SHORT` or
   * `ToastAndroid.LONG`).
   */
  show: function (message: string, duration: number): void {
    NativeToastAndroid.show(message, duration);
  },

  /**
   * Show a toast at a specified gravity position (`ToastAndroid.TOP`,
   * `ToastAndroid.BOTTOM`, or `ToastAndroid.CENTER`). Only works on API 29
   * and below.
   */
  showWithGravity: function (
    message: string,
    duration: number,
    gravity: number,
  ): void {
    NativeToastAndroid.showWithGravity(message, duration, gravity);
  },

  /**
   * Show a toast at a specified gravity position with additional pixel
   * offsets. Only works on API 29 and below.
   */
  showWithGravityAndOffset: function (
    message: string,
    duration: number,
    gravity: number,
    xOffset: number,
    yOffset: number,
  ): void {
    NativeToastAndroid.showWithGravityAndOffset(
      message,
      duration,
      gravity,
      xOffset,
      yOffset,
    );
  },
};

export default ToastAndroid;
