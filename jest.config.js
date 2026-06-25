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

// $FlowFixMe[cannot-resolve-module]
// $FlowFixMe[untyped-import]
const {defaults} = require('jest-config');

const PODS_LOCATIONS = [
  'packages/rn-tester/Pods',
  'private/helloworld/ios/Pods',
];

module.exports = {
  transform: {
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$':
      '<rootDir>/packages/jest-preset/jest/assetFileTransformer.js',
    '.*': './jest/preprocessor.js',
  },
  resolver: './packages/jest-preset/jest/resolver.js',
  setupFiles: ['./packages/jest-preset/jest/local-setup.js'],
  fakeTimers: {
    enableGlobally: true,
    legacyFakeTimers: false,
  },
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: true,
  },
  // This allows running Meta-internal tests with the `-test.fb.js` suffix.
  testRegex: '/__tests__/.*-test(\\.fb)?\\.js$',
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/packages/react-native/sdks',
    '<rootDir>/packages/react-native/Libraries/Renderer',
    '<rootDir>/packages/react-native/sdks/hermes/',
    ...PODS_LOCATIONS,
  ] /*:: as ReadonlyArray<string> */,
  transformIgnorePatterns: ['node_modules/(?!@react-native/)'],
  haste: {
    defaultPlatform: 'ios',
    platforms: ['ios', 'android'],
  },
  moduleFileExtensions: [
    'fb.js',
    ...defaults.moduleFileExtensions,
  ] /*:: as ReadonlyArray<string> */,
  modulePathIgnorePatterns: [
    'scripts/.*/__fixtures__/',
    '<rootDir>/packages/react-native/sdks/hermes/',
    ...PODS_LOCATIONS,
  ] /*:: as ReadonlyArray<string> */,
  unmockedModulePathPatterns: [
    'node_modules/react/',
    'packages/react-native/Libraries/Renderer',
    'promise',
    'source-map',
    'fastpath',
    'denodeify',
  ],
  testEnvironment: 'node',
  collectCoverageFrom: [
    'packages/react-native/Libraries/**/*.js',
    'packages/react-native/src/**/*.js',
  ],
  coveragePathIgnorePatterns: [
    '/__tests__/',
    '/vendor/',
    '<rootDir>/packages/react-native/Libraries/react-native/',
  ],
};
