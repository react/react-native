/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {shouldCollectCoverage} from '../coverageUtils';

test.each(['View-benchmark-itest.js', 'ViewBenchmark-itest.js'])(
  'keeps coverage disabled across configurations of %s',
  testPath => {
    const globalConfig = {collectCoverage: true};

    expect(
      [1, 2, 3].map(() => shouldCollectCoverage(testPath, '', globalConfig)),
    ).toEqual([false, false, false]);
  },
);

test('collects coverage for an integration test when enabled', () => {
  expect(
    shouldCollectCoverage('View-itest.js', '', {collectCoverage: true}),
  ).toBe(true);
});
