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
  deltas,
  expectMonotonicToPeak,
} from './AnimatedFantomTestUtils';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {Animated, useAnimatedValue} from 'react-native';

function renderTranslateX(): Animated.Value {
  let value: ?Animated.Value;
  const viewRef = createRef<HostInstance>();

  function MyApp() {
    const translateX = useAnimatedValue(0);
    value = translateX;
    return (
      <Animated.View
        ref={viewRef}
        style={[{width: 100, height: 100}, {transform: [{translateX}]}]}
      />
    );
  }

  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  return nullthrows(value);
}

const VELOCITY = 2;
const DECELERATION = 0.99;
// value(t) = v0 / (1 - deceleration) * (1 - deceleration^t): the asymptote is
// v0 / (1 - deceleration).
const ASYMPTOTE = VELOCITY / (1 - DECELERATION);

for (const {name, useNativeDriver} of DRIVERS) {
  describe(`Animated.decay (${name})`, () => {
    it('decelerates exponentially to a resting position', () => {
      const value = renderTranslateX();

      const {samples, finished} = collectAnimationTrajectory(
        value,
        driver =>
          Animated.decay(value, {
            velocity: VELOCITY,
            deceleration: DECELERATION,
            useNativeDriver: driver,
          }),
        useNativeDriver,
        3000,
      );

      expect(finished).toBe(true);
      expect(samples.length).toBeGreaterThan(10);

      // Comes to rest just below the analytical asymptote.
      const rest = samples[samples.length - 1];
      expect(rest).toBeGreaterThan(ASYMPTOTE * 0.97);
      expect(rest).toBeLessThanOrEqual(ASYMPTOTE + 1e-6);

      // Monotonically increasing to its resting position (no dips), which for
      // decay is also the peak.
      expectMonotonicToPeak(samples);

      // Exponential deceleration has two signatures over the early frames
      // (before it converges into floating-point noise):
      //   1. each per-frame step is strictly smaller than the previous one, and
      //   2. the ratio between consecutive steps is (nearly) constant — the
      //      defining property of geometric/exponential decay, which a linear
      //      ramp (constant deltas, ratio 1) or an accelerating curve (ratio
      //      > 1) would fail.
      const frameDeltas = deltas(samples);
      const ratios: Array<number> = [];
      for (let i = 1; i < 9; i++) {
        expect(frameDeltas[i]).toBeLessThan(frameDeltas[i - 1]);
        ratios.push(frameDeltas[i] / frameDeltas[i - 1]);
      }
      for (const ratio of ratios) {
        expect(ratio).toBeGreaterThan(0.75);
        expect(ratio).toBeLessThan(0.95);
      }
      expect(Math.max(...ratios) - Math.min(...ratios)).toBeLessThan(0.1);
    });
  });
}
