/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {InterpolationConfigType} from '../nodes/AnimatedInterpolation';

import AnimatedInterpolation from '../nodes/AnimatedInterpolation';
import * as Fantom from '@react-native/fantom';

const CALLS = 1_000_000;

function createInterpolation(
  config: InterpolationConfigType<string>,
): number => string {
  let parentValue = 0;
  const interpolation = new AnimatedInterpolation(
    // $FlowFixMe[incompatible-type]
    {__getValue: () => parentValue},
    config,
  );
  return input => {
    parentValue = input;
    return interpolation.__getValue();
  };
}

function run(interpolation: number => string) {
  for (let i = 0; i < CALLS; i++) {
    interpolation(i / CALLS);
  }
}

const rotate = createInterpolation({
  inputRange: [0, 1],
  outputRange: ['0deg', '360deg'],
});
const shadow = createInterpolation({
  inputRange: [0, 1],
  outputRange: ['0px 0px 0px', '-10.5px 20px 4px'],
});
const color = createInterpolation({
  inputRange: [0, 1],
  outputRange: ['#FF9500', 'rgba(50, 150, 250, 0.4)'],
});

Fantom.unstable_benchmark
  .suite('AnimatedInterpolation', {minIterations: 10})
  .test(`string output, 1 number (${CALLS} calls)`, () => {
    run(rotate);
  })
  .test(`string output, 3 numbers (${CALLS} calls)`, () => {
    run(shadow);
  })
  .test(`color output (${CALLS} calls)`, () => {
    run(color);
  });
