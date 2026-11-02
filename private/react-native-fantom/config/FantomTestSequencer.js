/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

'use strict';

const prepareFantomTestResultsForCache = require('./prepareFantomTestResultsForCache');
const TestSequencer = require('@jest/test-sequencer').default;

class FantomTestSequencer extends TestSequencer {
  cacheResults(tests, results) {
    // Jest 29 treats suite-level runtime errors as passing in its retry cache
    // because they have no failed test cases (https://github.com/jestjs/jest/issues/15382).
    super.cacheResults(tests, prepareFantomTestResultsForCache(results));
  }
}

module.exports = FantomTestSequencer;
