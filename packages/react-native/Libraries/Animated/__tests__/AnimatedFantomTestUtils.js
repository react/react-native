/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import * as Fantom from '@react-native/fantom';
import {Animated} from 'react-native';
import {setAnimationTimeProvider} from 'react-native/Libraries/Animated/AnimationTimingUtils';

export type Driver = {readonly name: string, readonly useNativeDriver: boolean};

// Every animation is exercised with both drivers. The JS driver runs the
// closed-form integration in JavaScript; the native driver hands the config to
// the C++ backend, which drives the view on each frame.
export const DRIVERS: ReadonlyArray<Driver> = [
  {name: 'JS driver', useNativeDriver: false},
  {name: 'native driver', useNativeDriver: true},
];

// Fantom's `produceFramesForDuration` advances its frame clock in fixed
// ~16.333ms (60fps) steps. We advance the JS animation clock by the same step
// so both drivers step at the same cadence.
export const FRAME_STEP_MS = 16333 / 1000;

/**
 * Runs `createAnimation(useNativeDriver)` on `value` to completion and returns
 * the per-frame trajectory recorded from `value`'s listener.
 *
 * Both drivers step at the same frame cadence, driven by two clocks advanced
 * together:
 *   - frame timing: `unstable_produceFramesForDuration` advances Fantom's frame
 *     clock (drives the native driver and flushes each frame's work), and
 *   - animation timing: `getCurrentAnimationTime` is overridden with a clock
 *     that advances one frame step per read, driving the JS driver
 *     deterministically (the native driver ignores it and reads the frame clock
 *     in C++).
 *
 * This makes the JS and native drivers produce the same trajectory, so tests
 * can assert one curve for both.
 */
export function collectAnimationTrajectory(
  value: Animated.Value,
  createAnimation: (useNativeDriver: boolean) => Animated.CompositeAnimation,
  useNativeDriver: boolean,
  durationMs: number,
): {samples: Array<number>, finished: boolean} {
  const samples: Array<number> = [];
  const listenerId = value.addListener(state => {
    samples.push(state.value);
  });

  let animationTime = 0;
  setAnimationTimeProvider(() => {
    const current = animationTime;
    animationTime += FRAME_STEP_MS;
    return current;
  });

  let finished = false;
  try {
    Fantom.runTask(() => {
      createAnimation(useNativeDriver).start(result => {
        finished = result.finished;
      });
    });
    Fantom.unstable_produceFramesForDuration(durationMs);
    Fantom.runWorkLoop();
  } finally {
    setAnimationTimeProvider(null);
    value.removeListener(listenerId);
  }

  return {samples, finished};
}

/** Diffs between consecutive samples. */
export function deltas(samples: ReadonlyArray<number>): Array<number> {
  const result: Array<number> = [];
  for (let i = 1; i < samples.length; i++) {
    result.push(samples[i] - samples[i - 1]);
  }
  return result;
}

/**
 * Asserts the samples rise monotonically to their peak (allowing tiny
 * floating-point noise), i.e. no dips on the way up.
 */
export function expectMonotonicToPeak(samples: ReadonlyArray<number>): void {
  const peakIndex = samples.indexOf(Math.max(...samples));
  for (let i = 1; i <= peakIndex; i++) {
    expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1] - 1e-6);
  }
}
