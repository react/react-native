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

import baseline from './WPTBaseline';
import fixtures from './WPTFixtures';
import {
  applyWPTFlakyStatuses,
  getWPTExecutionPaths,
  runWPTSuite,
} from './WPTTestHarness';

describe('Web Platform Tests: streams', () => {
  it('uses a non-manifest deterministic order', () => {
    expect(
      getWPTExecutionPaths(fixtures, 'streams', 'deterministic-shuffle'),
    ).not.toEqual(getWPTExecutionPaths(fixtures, 'streams', 'manifest'));
  });

  it('matches the manifest-order baseline when shuffled', () => {
    const result = runWPTSuite(fixtures, 'streams', 'deterministic-shuffle');
    expect(applyWPTFlakyStatuses(result, baseline.streams)).toEqual(
      baseline.streams,
    );
  });
});
