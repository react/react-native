/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @fantom_native_opt false
 * @fantom_js_bytecode false
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import processColor from '../processColor';
import * as Fantom from '@react-native/fantom';

const REPEATED_COLORS = [
  'red',
  'blue',
  '#1e83c9',
  'rgba(10, 20, 30, 0.4)',
  'hsl(318, 69%, 55%)',
];

const GENERATED_COLORS = Array.from(
  {length: 2048},
  (_, i) =>
    `rgba(${(i % 256).toString()}, ${((i * 3) % 256).toString()}, ${(
      (i * 7) %
      256
    ).toString()}, ${((i % 100) / 100).toFixed(2)})`,
);

let benchmarkSink = 0;

function processColors(
  colors: ReadonlyArray<string>,
  iterations: number,
): void {
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    const color = processColor(colors[i % colors.length]);
    if (typeof color === 'number') {
      result += color;
    }
  }
  benchmarkSink += result;
  if (benchmarkSink > Number.MAX_SAFE_INTEGER) {
    benchmarkSink = 0;
  }
}

Fantom.unstable_benchmark
  .suite('processColor')
  .test('process repeated primitive colors', () => {
    processColors(REPEATED_COLORS, 1000);
  })
  .test('process generated primitive colors', () => {
    processColors(GENERATED_COLORS, 2048);
  });
