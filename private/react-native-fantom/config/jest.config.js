/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const baseConfig = require('../../../jest.config');
const os = require('os');
const path = require('path');

// Every Fantom worker shares a single Metro server. With unbounded
// parallelism, concurrent bundle builds pile up faster than the
// per-test DELETE eviction can free their dependency graphs. Cap
// concurrency so the number of in-flight graphs stays bounded on
// high-core machines, while still using all available CPUs on smaller
// ones. The cap pairs with the Node heap size set in scripts/fantom.sh
// (16 GB) to leave comfortable headroom over the observed peak.
function getNumCpus() /*: number */ {
  if (typeof os.availableParallelism === 'function') {
    return os.availableParallelism();
  }
  const cpus = os.cpus();
  return cpus != null ? cpus.length : 1;
}

const FANTOM_MAX_WORKERS /*: number */ = Math.max(
  1,
  Math.min(getNumCpus() - 1, 16),
);

module.exports = {
  displayName: 'fantom',
  maxWorkers: FANTOM_MAX_WORKERS,
  rootDir: path.resolve(__dirname, '../../..') /*:: as string */,
  roots: [
    '<rootDir>/packages/react-native',
    '<rootDir>/packages/rn-tester',
    '<rootDir>/packages/polyfills',
    '<rootDir>/private/react-native-fantom',
  ],
  moduleFileExtensions: [
    ...baseConfig.moduleFileExtensions,
    'cpp',
    'h',
  ] /*:: as ReadonlyArray<string> */,
  // This allows running Meta-internal tests with the `-test.fb.js` suffix.
  testRegex: '/__tests__/.*-itest(\\.fb)?\\.js$',
  testPathIgnorePatterns: baseConfig.testPathIgnorePatterns,
  transformIgnorePatterns: ['.*'],
  testRunner: '<rootDir>/private/react-native-fantom/runner/index.js',
  watchPathIgnorePatterns: ['<rootDir>/private/react-native-fantom/build/'],
  globalSetup:
    '<rootDir>/private/react-native-fantom/runner/global-setup/setup.js',
  globalTeardown:
    '<rootDir>/private/react-native-fantom/runner/global-setup/teardown.js',
};
