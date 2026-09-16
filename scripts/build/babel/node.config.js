/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {BabelCoreOptions} from '@babel/core';

const TARGET_NODE_VERSION = '18';

const config: BabelCoreOptions = {
  presets: [
    require.resolve('@babel/preset-flow'),
    [
      require.resolve('@babel/preset-env'),
      {
        targets: {
          node: TARGET_NODE_VERSION,
        },
      },
    ],
  ],
  plugins: [
    require.resolve('flow-parser/babel-plugin'),
    [
      require.resolve('babel-plugin-transform-define'),
      {
        'process.env.BUILD_EXCLUDE_BABEL_REGISTER': true,
      },
    ],
    [
      require.resolve('babel-plugin-minify-dead-code-elimination'),
      {keepFnName: true, keepFnArgs: true, keepClassName: true},
    ],
  ],
};

module.exports = config;
