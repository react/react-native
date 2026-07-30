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

const path = require('node:path');

module.exports = {
  haste: {
    defaultPlatform: 'ios',
    platforms: ['android', 'ios', 'native'],
  },
  moduleNameMapper: {
    // `setup-env` and `react-private-interface` are secondary entry points
    // exposed via the package's `exports`, but `./jest/resolver.js` strips
    // `exports` and the generic mapper below resolves subpaths as literal
    // directory paths. Alias them explicitly so they resolve to their `src/`
    // implementations.
    '^react-native/react-private-interface$': `${path.dirname(require.resolve('react-native'))}/src/react-private-interface.js`,
    '^react-native/setup-env$': `${path.dirname(require.resolve('react-native'))}/src/setup-env.js`,
    '^react-native($|/.*)': `${path.dirname(require.resolve('react-native'))}/$1`,
  },
  resolver: require.resolve('./jest/resolver.js'),
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest',
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$':
      require.resolve('./jest/assetFileTransformer.js'),
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)/)',
  ],
  setupFiles: [require.resolve('./jest/setup.js')],
  testEnvironment: require.resolve('./jest/react-native-env.js'),
};
