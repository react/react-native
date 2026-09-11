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
    // Resolve from the preset's own scope so strict-isolation installs
    // (pnpm / Yarn pnpm-mode) find the transformer without relying on
    // hoisting or a consumer devDependency.
    '^.+\\.(js|ts|tsx)$': require.resolve('babel-jest'),
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$':
      require.resolve('./jest/assetFileTransformer.js'),
  },
  transformIgnorePatterns: [
    // Match react-native packages at any nesting depth so pnpm
    // (node_modules/.pnpm/<hash>/node_modules/...) and Yarn pnpm-mode
    // (node_modules/.store/<virtual>/package/...) layouts still transform
    // preset and react-native sources instead of ignoring them as opaque
    // node_modules. A trailing `-virtual-<hexhash>` synthetic suffix (Yarn,
    // e.g. @react-native-jest-preset-virtual-2eb6229c53) is allowed; real
    // `-suffix` packages such as react-native-reanimated, react-native-svg,
    // @react-native-async-storage/async-storage, or
    // react-native-virtual-* stay ignored, exactly as before.
    'node_modules/(?!([^\\/]*[\\/])*((jest-)?react-native|@react-native(-community)?)(([^\\/]*-virtual-[0-9a-f]+)?[\\/]|$))',
  ],
  setupFiles: [require.resolve('./jest/setup.js')],
  testEnvironment: require.resolve('./jest/react-native-env.js'),
};
