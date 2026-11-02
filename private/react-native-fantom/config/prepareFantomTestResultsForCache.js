/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/*::
type FantomTestResult = {
  readonly numFailingTests: number,
  readonly testExecError?: ?unknown,
  ...,
};

type FantomAggregatedResult = {
  readonly testResults: ReadonlyArray<FantomTestResult>,
  ...,
};
*/

function prepareFantomTestResultsForCache(
  results /*: FantomAggregatedResult */,
) /*: FantomAggregatedResult */ {
  return {
    ...results,
    testResults: results.testResults.map(testResult =>
      testResult.testExecError != null && testResult.numFailingTests === 0
        ? {...testResult, numFailingTests: 1}
        : testResult,
    ),
  };
}

module.exports = prepareFantomTestResultsForCache;
