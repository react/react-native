/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {WPTSuiteResult} from './WPTTestHarness';

import baseline from './WPTBaseline';
import fixtures from './WPTFixtures';
import {
  applyWPTFlakyStatuses,
  getWPTExecutionPaths,
  runWPTSuite,
} from './WPTTestHarness';

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

function singleTestResult(status: string): WPTSuiteResult {
  return {
    files: [
      {
        harnessStatus: 'OK',
        path: 'example.any.js',
        tests: [{name: 'intermittent result', status}],
      },
    ],
    manifest: {sha256: 'test', version: 0},
    revision: 'test',
    source: 'test',
    suite: 'fetch',
    summary: {
      BLOCKED: 0,
      FAIL: status === 'FAIL' ? 1 : 0,
      FLAKY: status === 'FLAKY' ? 1 : 0,
      NOTRUN: 0,
      PASS: status === 'PASS' ? 1 : 0,
      PRECONDITION_FAILED: 0,
      TIMEOUT: 0,
      noOpTests: 0,
      total: 1,
      unsupportedFiles: 0,
    },
  };
}

describe('Web Platform Tests: fetch', () => {
  it('uses a non-manifest deterministic order', () => {
    expect(
      getWPTExecutionPaths(fixtures, 'fetch', 'deterministic-shuffle'),
    ).not.toEqual(getWPTExecutionPaths(fixtures, 'fetch', 'manifest'));
  });

  it('matches the manifest-order baseline when shuffled', () => {
    const result = runWPTSuite(fixtures, 'fetch', 'deterministic-shuffle');
    expect(applyWPTFlakyStatuses(result, baseline.fetch)).toEqual(
      baseline.fetch,
    );
  });

  it('preserves a flaky baseline result for either outcome', () => {
    const flakyBaseline = singleTestResult('FLAKY');
    expect(
      applyWPTFlakyStatuses(singleTestResult('PASS'), flakyBaseline),
    ).toEqual(flakyBaseline);
    expect(
      applyWPTFlakyStatuses(singleTestResult('FAIL'), flakyBaseline),
    ).toEqual(flakyBaseline);
  });
});
