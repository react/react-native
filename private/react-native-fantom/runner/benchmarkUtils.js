/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {BenchmarkResult} from '../src/Benchmark';

import {markdownTable} from './utils';

export const printBenchmarkResultsRanking = (
  benchmarkResults: Array<{
    title: string,
    result: BenchmarkResult,
  }>,
) => {
  const testTaskTimings: {[key: string]: {[key: string]: number}} = {};
  let numTestVariants = 0;

  for (const benchmarkResult of benchmarkResults) {
    const result = benchmarkResult.result;
    if (
      result == null ||
      result.timings == null ||
      benchmarkResult.title == null
    ) {
      continue;
    }
    numTestVariants++;
    for (const taskTiming of result.timings) {
      const taskName = taskTiming.name;
      if (testTaskTimings[taskName] === undefined) {
        testTaskTimings[taskName] = {};
      }
      testTaskTimings[taskName][benchmarkResult.title] =
        taskTiming.latency?.p50 ?? taskTiming.latency.mean;
    }
  }
  if (numTestVariants <= 1 || Object.keys(testTaskTimings).length === 0) {
    // No benchmark results to print, or there is nothing to compare with
    return;
  }

  // Find relative execution times for tasks
  const results: {[key: string]: {[key: string]: string}} = {};
  for (const taskName in testTaskTimings) {
    const kv = Object.entries(testTaskTimings[taskName]);
    kv.sort((a, b) => b[1] - a[1]);
    const slowest = kv[0][1];
    const fastest = kv[kv.length - 1][1];
    results[taskName] = {};
    for (let i = 0; i < kv.length; i++) {
      const [title, timing] = kv[i];
      let caption =
        timing === fastest ? '🏆 ' : timing === slowest ? '🐌 ' : '';
      caption += `${timing.toFixed(3)}ms`;
      caption += getTimingDelta(slowest, timing);
      results[taskName][title] = caption;
    }
  }

  console.log('### Benchmark Times Comparison (p50): ###');
  console.log(markdownTable(results, 'Task name'));
  console.log('');
};

function getTimingDelta(lastTiming: ?number, currentTiming: ?number): string {
  if (
    lastTiming != null &&
    currentTiming != null &&
    lastTiming !== currentTiming
  ) {
    const delta = currentTiming - lastTiming;
    const deltaPercent =
      Math.abs(delta / (delta > 0 ? lastTiming : currentTiming)) * 100;
    return ` (${deltaPercent.toFixed(2)}% ${delta > 0 ? 'slower' : 'faster'})`;
  } else {
    return '';
  }
}
