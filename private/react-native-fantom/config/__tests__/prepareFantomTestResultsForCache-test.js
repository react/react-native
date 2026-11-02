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

const prepareFantomTestResultsForCache = require('../prepareFantomTestResultsForCache');

describe('prepareFantomTestResultsForCache', () => {
  it('marks suite-level runtime errors as failed for Jest retries', () => {
    const runtimeFailure = {
      numFailingTests: 0,
      testExecError: new Error('Process exited with SIGSEGV'),
    };
    const passingResult = {numFailingTests: 0};
    const assertionFailure = {numFailingTests: 1};
    const results = {
      testResults: [runtimeFailure, passingResult, assertionFailure],
    };

    const cacheResults = prepareFantomTestResultsForCache(results);

    expect(cacheResults.testResults).toEqual([
      {...runtimeFailure, numFailingTests: 1},
      passingResult,
      assertionFailure,
    ]);
    expect(results.testResults[0]).toBe(runtimeFailure);
  });
});
