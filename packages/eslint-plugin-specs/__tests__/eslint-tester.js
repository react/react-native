/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const ESLintTester = require('eslint').RuleTester;

ESLintTester.setDefaultConfig({
  parser: require.resolve('hermes-eslint'),
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 6,
    sourceType: 'module',
    babelOptions: {
      presets: [require.resolve('flow-parser/babel-plugin')],
    },
  },
});

module.exports = ESLintTester;
