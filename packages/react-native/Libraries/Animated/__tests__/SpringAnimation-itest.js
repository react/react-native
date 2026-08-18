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

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import {
  DRIVERS,
  collectAnimationTrajectory,
  expectMonotonicToPeak,
} from './AnimatedFantomTestUtils';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {Animated, useAnimatedValue} from 'react-native';

// Springs are observed through an <Animated.View>'s opacity. The animation is
// bound to a mounted view (required for the native driver) and its per-frame
// trajectory is recorded from the value's listener.
function renderOpacity(): Animated.Value {
  let value: ?Animated.Value;
  const viewRef = createRef<HostInstance>();

  function MyApp() {
    const opacity = useAnimatedValue(0);
    value = opacity;
    return (
      <Animated.View ref={viewRef} style={{width: 100, height: 100, opacity}} />
    );
  }

  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  return nullthrows(value);
}

function expectSettledAtTarget(sample: number, target: number): void {
  expect(Math.abs(sample - target)).toBeLessThan(0.02);
}

for (const {name, useNativeDriver} of DRIVERS) {
  describe(`Animated.spring (${name})`, () => {
    it('follows an underdamped curve that overshoots then settles', () => {
      const value = renderOpacity();

      // zeta = c / (2 * sqrt(k * m)) = 20 / (2 * sqrt(200)) ~= 0.707, which
      // overshoots the target by exp(-zeta * pi / sqrt(1 - zeta^2)) ~= 4.3%.
      const {samples, finished} = collectAnimationTrajectory(
        value,
        driver =>
          Animated.spring(value, {
            toValue: 1,
            stiffness: 200,
            damping: 20,
            mass: 1,
            useNativeDriver: driver,
          }),
        useNativeDriver,
        3000,
      );

      expect(finished).toBe(true);
      expect(samples.length).toBeGreaterThan(3);
      // Rises smoothly through the full range (not a snap to the end).
      expect(samples.some(v => v > 0.2 && v < 0.4)).toBe(true);
      expect(samples.some(v => v > 0.6 && v < 0.8)).toBe(true);
      expectMonotonicToPeak(samples);

      // Overshoots the target by the amount the damping ratio predicts.
      const peak = Math.max(...samples);
      expect(peak).toBeGreaterThan(1.02);
      expect(peak).toBeLessThan(1.07);

      // Oscillates back down from the peak and settles at the target.
      const last = samples[samples.length - 1];
      expect(last).toBeLessThan(peak);
      expectSettledAtTarget(last, 1);
    });

    it('follows an overdamped curve that approaches the target without overshoot', () => {
      const value = renderOpacity();

      // zeta = 30 / (2 * sqrt(100)) = 1.5 > 1 (overdamped): a smooth sigmoid to
      // the target with no overshoot.
      const {samples, finished} = collectAnimationTrajectory(
        value,
        driver =>
          Animated.spring(value, {
            toValue: 1,
            stiffness: 100,
            damping: 30,
            mass: 1,
            useNativeDriver: driver,
          }),
        useNativeDriver,
        3000,
      );

      expect(finished).toBe(true);
      expect(samples.some(v => v > 0.2 && v < 0.4)).toBe(true);
      expect(samples.some(v => v > 0.6 && v < 0.8)).toBe(true);
      expectMonotonicToPeak(samples);

      // No meaningful overshoot for an overdamped spring.
      expect(Math.max(...samples)).toBeLessThan(1.005);
      expectSettledAtTarget(samples[samples.length - 1], 1);
    });

    it('does not overshoot past toValue when overshootClamping is enabled', () => {
      const value = renderOpacity();

      // Same underdamped config as the overshoot test, but clamping must
      // suppress the overshoot entirely.
      const {samples} = collectAnimationTrajectory(
        value,
        driver =>
          Animated.spring(value, {
            toValue: 1,
            stiffness: 200,
            damping: 20,
            mass: 1,
            overshootClamping: true,
            useNativeDriver: driver,
          }),
        useNativeDriver,
        3000,
      );

      expectMonotonicToPeak(samples);
      // Clamped: overshoot is suppressed to well under the ~4.3% the same
      // unclamped config produces (peak ~1.043).
      expect(Math.max(...samples)).toBeLessThan(1.02);
      expectSettledAtTarget(samples[samples.length - 1], 1);
    });

    it('settles at the target when configured via tension/friction', () => {
      const value = renderOpacity();

      // Exercises the Origami tension/friction -> stiffness/damping conversion
      // in SpringConfig (`fromOrigamiTensionAndFriction`).
      const {samples, finished} = collectAnimationTrajectory(
        value,
        driver =>
          Animated.spring(value, {
            toValue: 1,
            tension: 40,
            friction: 7,
            useNativeDriver: driver,
          }),
        useNativeDriver,
        3000,
      );

      expect(finished).toBe(true);
      expectMonotonicToPeak(samples);
      expectSettledAtTarget(samples[samples.length - 1], 1);
    });

    // `speed` values chosen so the bounciness/speed -> stiffness/damping
    // conversion exercises all three friction regimes in SpringConfig
    // (bouncyTension <= 18, 18 < bouncyTension <= 44, and > 44).
    for (const speed of [2, 5, 12]) {
      it(`settles at the target when configured via bounciness/speed (speed ${speed})`, () => {
        const value = renderOpacity();

        const {samples, finished} = collectAnimationTrajectory(
          value,
          driver =>
            Animated.spring(value, {
              toValue: 1,
              bounciness: 12,
              speed,
              useNativeDriver: driver,
            }),
          useNativeDriver,
          3000,
        );

        expect(finished).toBe(true);
        expectSettledAtTarget(samples[samples.length - 1], 1);
      });
    }
  });
}

describe('Animated.spring config validation', () => {
  it('throws when combining mutually exclusive config groups', () => {
    const value = renderOpacity();

    expect(() => {
      Fantom.runTask(() => {
        Animated.spring(value, {
          toValue: 1,
          stiffness: 100,
          bounciness: 10,
          useNativeDriver: true,
        }).start();
      });
    }).toThrow();
  });
});
