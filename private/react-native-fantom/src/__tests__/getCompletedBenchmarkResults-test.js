/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Statistics, TaskResultCompleted} from 'tinybench';

import getCompletedBenchmarkResults from '../getCompletedBenchmarkResults';

const statistics: Statistics = {
  aad: 0,
  critical: 0,
  df: 0,
  mad: 0,
  max: 2,
  mean: 2,
  min: 2,
  moe: 0,
  p50: 2,
  p75: 2,
  p99: 2,
  p995: 2,
  p999: 2,
  rme: 0,
  samples: undefined,
  samplesCount: 1,
  sd: 0,
  sem: 0,
  variance: 0,
};

const completedResult: TaskResultCompleted = {
  state: 'completed',
  runtime: 'hermes',
  runtimeVersion: 'test',
  timestampProviderName: 'custom',
  latency: statistics,
  throughput: statistics,
  period: 2,
  totalTime: 2,
};

describe('getCompletedBenchmarkResults', () => {
  it('preserves completed results without retained samples', () => {
    const results = getCompletedBenchmarkResults([completedResult]);
    expect(results[0]).toBe(completedResult);
    expect(results[0].latency.samplesCount).toBe(1);
    expect(results[0].latency.samples).toBeUndefined();
  });

  const states: ReadonlyArray<'not-started' | 'started' | 'aborted'> = [
    'not-started',
    'started',
    'aborted',
  ];
  it.each(states)('rejects %s results without statistics', state => {
    expect(() =>
      getCompletedBenchmarkResults([
        {
          state,
          runtime: 'hermes',
          runtimeVersion: 'test',
          timestampProviderName: 'custom',
        },
      ]),
    ).toThrow(`Benchmark did not complete (state: ${state})`);
  });

  it('rejects partial statistics from aborted runs', () => {
    expect(() =>
      getCompletedBenchmarkResults([
        {...completedResult, state: 'aborted-with-statistics'},
      ]),
    ).toThrow('Benchmark did not complete (state: aborted-with-statistics)');
  });

  it('rejects errored results', () => {
    expect(() =>
      getCompletedBenchmarkResults([
        {
          state: 'errored',
          error: new Error('task failed'),
          runtime: 'hermes',
          runtimeVersion: 'test',
          timestampProviderName: 'custom',
        },
      ]),
    ).toThrow('Benchmark did not complete (state: errored)');
  });
});
