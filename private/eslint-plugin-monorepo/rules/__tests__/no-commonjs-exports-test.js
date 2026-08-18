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

const rule = require('../no-commonjs-exports.js');
const {RuleTester} = require('eslint');

const ruleTester = new RuleTester({
  parser: require.resolve('flow-eslint'),
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
});

ruleTester.run('module.exports', rule, {
  valid: [
    {
      code: `export default function foo() {}`,
    },
    {
      code: `export function foo() {}`,
    },
  ],
  invalid: [
    {
      code: `module.exports = function foo() {}`,
      errors: [{messageId: 'moduleExports'}],
      output: null, // Expect no autofix to be suggested.
    },
    {
      code: `exports.foo = function foo() {}`,
      errors: [{messageId: 'exports'}],
      output: null, // Expect no autofix to be suggested.
    },
  ],
});
