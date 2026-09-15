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
import {applyWPTFlakyStatuses, runWPTSuite} from './WPTTestHarness';

const BASELINE_MARKER = '__RN_WPT_BASELINE__';
describe('Web Platform Tests baseline capture', () => {
  it('captures fetch', () => {
    const result = applyWPTFlakyStatuses(
      runWPTSuite(fixtures, 'fetch'),
      baseline.fetch,
    );
    console.log(`${BASELINE_MARKER}fetch:${JSON.stringify(result)}`);
  });

  it('captures streams', () => {
    const result = applyWPTFlakyStatuses(
      runWPTSuite(fixtures, 'streams'),
      baseline.streams,
    );
    console.log(`${BASELINE_MARKER}streams:${JSON.stringify(result)}`);
  });
});
