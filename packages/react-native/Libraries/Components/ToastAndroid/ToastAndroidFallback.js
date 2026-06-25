/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const ToastAndroid = {
  // Dummy fallback toast duration constants
  SHORT: 0 as number,
  LONG: 0 as number,
  // Dummy fallback toast gravity constants
  TOP: 0 as number,
  BOTTOM: 0 as number,
  CENTER: 0 as number,

  show: function (message: string, duration: number): void {
    console.warn('ToastAndroid is not supported on this platform.');
  },

  showWithGravity: function (
    message: string,
    duration: number,
    gravity: number,
  ): void {
    console.warn('ToastAndroid is not supported on this platform.');
  },

  showWithGravityAndOffset: function (
    message: string,
    duration: number,
    gravity: number,
    xOffset: number,
    yOffset: number,
  ): void {
    console.warn('ToastAndroid is not supported on this platform.');
  },
};

export default ToastAndroid;
