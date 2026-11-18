/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TaskResult, TaskResultCompleted} from 'tinybench';

export type SuiteResults = Array<Readonly<TaskResultCompleted>>;

export default function getCompletedBenchmarkResults(
  results: ReadonlyArray<Readonly<TaskResult>>,
): SuiteResults {
  return results.map(result => {
    if (result.state !== 'completed') {
      throw new Error(`Benchmark did not complete (state: ${result.state})`);
    }
    return result;
  });
}
