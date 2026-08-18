/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * The Vibration API is exposed at `Vibration.vibrate()`.
 * The vibration is asynchronous so this method will return immediately.
 *
 * There will be no effect on devices that do not support Vibration, eg. the simulator.
 *
 * **Note for android**
 * add `<uses-permission android:name="android.permission.VIBRATE"/>` to `AndroidManifest.xml`
 *
 * **Android Usage:**
 *
 * [0, 500, 200, 500]
 * V(0.5s) --wait(0.2s)--> V(0.5s)
 *
 * [300, 500, 200, 500]
 * --wait(0.3s)--> V(0.5s) --wait(0.2s)--> V(0.5s)
 *
 * **iOS Usage:**
 * if first argument is 0, it will not be included in pattern array.
 *
 * [0, 1000, 2000, 3000]
 * V(fixed) --wait(1s)--> V(fixed) --wait(2s)--> V(fixed) --wait(3s)--> V(fixed)
 */
export interface VibrationStatic {
  vibrate(pattern?: number | number[], repeat?: boolean): void;

  /**
   * Stop vibration
   */
  cancel(): void;
}

export const Vibration: VibrationStatic;
export type Vibration = VibrationStatic;
