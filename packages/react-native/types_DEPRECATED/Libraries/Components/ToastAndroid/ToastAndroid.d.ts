/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * This exposes the native ToastAndroid module as a JS module. This has a function 'show'
 * which takes the following parameters:
 *
 * 1. String message: A string with the text to toast
 * 2. int duration: The duration of the toast. May be ToastAndroid.SHORT or ToastAndroid.LONG
 *
 * There is also a function `showWithGravity` to specify the layout gravity. May be
 * ToastAndroid.TOP, ToastAndroid.BOTTOM, ToastAndroid.CENTER
 *
 * **Note**: Starting from Android API level 30 (Android R) or higher, for apps targeting
 * that API level, setting toast gravity is a no-op for text toasts.
 * This means that in many cases `TOP`, `BOTTOM`, `CENTER`, or offsets may not have
 * any visible effect on actual toast positioning.
 *
 * Reference: https://developer.android.com/reference/android/widget/Toast#setGravity(int,%20int,%20int)
 */
export interface ToastAndroidStatic {
  /**
   * Display a toast message for a specified duration.
   *
   * @param message A string with the text to toast.
   * @param duration The duration of the toast–either ToastAndroid.SHORT or ToastAndroid.LONG
   */
  show(message: string, duration: number): void;

  /**
   * Display a toast message for a specified duration with a given gravity.
   *
   * @param message A string with the text to display in the toast.
   * @param duration The duration of the toast.
   *                 May be `ToastAndroid.SHORT` or `ToastAndroid.LONG`.
   * @param gravity Positioning on the screen, e.g.,
   *                `ToastAndroid.TOP`, `ToastAndroid.BOTTOM`, or `ToastAndroid.CENTER`.
   *
   * **Note**: On Android R (API 30) or later (when targeting API 30+), this setting may
   * not have any effect on text toast placement due to `setGravity` becoming a no-op.
   */
  showWithGravity(message: string, duration: number, gravity: number): void;

  /**
   * Display a toast message for a specified duration with a given gravity and custom offsets.
   *
   * @param message A string with the text to display in the toast.
   * @param duration The duration of the toast.
   *                 May be `ToastAndroid.SHORT` or `ToastAndroid.LONG`.
   * @param gravity Positioning on the screen, e.g.,
   *                `ToastAndroid.TOP`, `ToastAndroid.BOTTOM`, or `ToastAndroid.CENTER`.
   * @param xOffset Horizontal offset from the given gravity.
   * @param yOffset Vertical offset from the given gravity.
   *
   * **Note**: On Android R (API 30) or later (when targeting API 30+), setting gravity
   * and offsets may not visibly affect the placement of text toasts.
   */
  showWithGravityAndOffset(
    message: string,
    duration: number,
    gravity: number,
    xOffset: number,
    yOffset: number,
  ): void;

  /**
   * Indicates a short duration on the screen.
   *
   * Value: 2000 milliseconds (2 seconds).
   */
  SHORT: number;

  /**
   * Indicates a long duration on the screen.
   *
   * Value: 3500 milliseconds (3.5 seconds).
   */
  LONG: number;

  /**
   * Indicates that the toast message should appear at the top of the screen.
   *
   * **Note**: On Android R or later, this may not have any visible effect.
   */
  TOP: number;

  /**
   * Indicates that the toast message should appear at the bottom of the screen.
   *
   * **Note**: On Android R or later, this may not have any visible effect.
   */
  BOTTOM: number;

  /**
   * Indicates that the toast message should appear at the center of the screen.
   *
   * **Note**: On Android R or later, this may not have any visible effect.
   */
  CENTER: number;
}

export const ToastAndroid: ToastAndroidStatic;
export type ToastAndroid = ToastAndroidStatic;
