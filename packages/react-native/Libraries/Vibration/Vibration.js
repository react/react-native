/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import NativeVibration from './NativeVibration';

const Platform = require('../Utilities/Platform').default;

let _vibrating: boolean = false;
let _id: number = 0; // _id is necessary to prevent race condition.
const _default_vibration_length = 400;

function vibrateByPattern(pattern: Array<number>, repeat: boolean = false) {
  if (_vibrating) {
    return;
  }
  _vibrating = true;
  if (pattern[0] === 0) {
    NativeVibration.vibrate(_default_vibration_length);
    // $FlowFixMe[reassign-const]
    pattern = pattern.slice(1);
  }
  if (pattern.length === 0) {
    _vibrating = false;
    return;
  }
  setTimeout(() => vibrateScheduler(++_id, pattern, repeat, 1), pattern[0]);
}

function vibrateScheduler(
  id: number,
  pattern: Array<number>,
  repeat: boolean,
  nextIndex: number,
) {
  if (!_vibrating || id !== _id) {
    return;
  }
  NativeVibration.vibrate(_default_vibration_length);
  if (nextIndex >= pattern.length) {
    if (repeat) {
      // $FlowFixMe[reassign-const]
      nextIndex = 0;
    } else {
      _vibrating = false;
      return;
    }
  }
  setTimeout(
    () => vibrateScheduler(id, pattern, repeat, nextIndex + 1),
    pattern[nextIndex],
  );
}

/**
 * Vibrates the device. On Android, requires the `android.permission.VIBRATE`
 * permission. On iOS, vibration duration is fixed at approximately 400ms
 * (implemented via `AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)`).
 *
 * @see https://reactnative.dev/docs/vibration
 */
const Vibration = {
  /**
   * Trigger a vibration with the specified `pattern`.
   *
   * The pattern can be a number (duration in ms) or an array of numbers. When
   * an array is provided on Android, odd indices represent vibration duration
   * and even indices represent separation time. On iOS, the duration value is
   * ignored and each vibration lasts approximately 400ms.
   */
  vibrate: function (
    pattern?: number | Array<number> = _default_vibration_length,
    repeat?: boolean = false,
  ) {
    if (Platform.OS === 'android') {
      if (typeof pattern === 'number') {
        NativeVibration.vibrate(pattern);
      } else if (Array.isArray(pattern)) {
        NativeVibration.vibrateByPattern(pattern, repeat ? 0 : -1);
      } else {
        throw new Error('Vibration pattern should be a number or array');
      }
    } else {
      if (_vibrating) {
        return;
      }
      if (typeof pattern === 'number') {
        NativeVibration.vibrate(pattern);
      } else if (Array.isArray(pattern)) {
        vibrateByPattern(pattern, repeat);
      } else {
        throw new Error('Vibration pattern should be a number or array');
      }
    }
  },

  /**
   * Stop vibrating after `vibrate()` was called with repetition enabled.
   */
  cancel: function () {
    if (Platform.OS === 'ios') {
      _vibrating = false;
    } else {
      NativeVibration.cancel();
    }
  },
};

export default Vibration;
