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
  parser: require.resolve('flow-eslint'),
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 6,
    sourceType: 'module',
  },
});

module.exports = ESLintTester;
