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
import * as Fantom from '@react-native/fantom';

let runs = 0;
const parameterizedRuns = [0, 0];

// We need to use `afterAll` because the benchmark API defines tests in Jest,
// and we can't call it from within other tests.
afterAll(() => {
  expect(runs).toBe(1);
  expect(parameterizedRuns).toEqual([1, 1]);
});

Fantom.unstable_benchmark
  .suite('Benchmark test', {
    testOnly: true,

    // Ignores warmup, iterations and duration
    warmup: true,
    minWarmupIterations: 10,
    minIterations: 10,
    minTestExecutionTimeMs: 1000,
    minWarmupDurationMs: 1000,
  })
  .test(
    'test',
    () => {
      runs++;
    },
    {async: true},
  )
  .test.each(
    [0, 1],
    index => `parameterized test ${index}`,
    index => {
      parameterizedRuns[index]++;
    },
    {async: true},
  )
  .verify(results => {
    expect(results.length).toBe(3);
    for (const result of results) {
      expect(result.state).toBe('completed');
      expect(result.latency.samplesCount).toBe(1);
      expect(result.latency.samples).toBeUndefined();
    }
  });
