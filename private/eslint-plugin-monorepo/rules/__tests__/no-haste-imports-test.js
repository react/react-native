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

const rule = require('../no-haste-imports.js');
const {RuleTester} = require('eslint');

const ruleTester = new RuleTester({
  parser: require.resolve('flow-eslint'),
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
});

ruleTester.run('require(...)', rule, {
  valid: [
    {
      code: `const X = require('x');`,
    },
    {
      code: `const X = require('./X');`,
    },
    {
      code: `const Y = require('X/Y');`,
    },
  ],
  invalid: [
    {
      code: `const X = require('X');`,
      errors: [{messageId: 'hasteImport', data: {importPath: 'X'}}],
      output: null, // Expect no autofix to be suggested.
    },
    {
      code: `const useX = require('useX');`,
      errors: [{messageId: 'hasteImport', data: {importPath: 'useX'}}],
      output: null, // Expect no autofix to be suggested.
    },
  ],
});

ruleTester.run('import(...)', rule, {
  valid: [
    {
      code: `import('x');`,
    },
    {
      code: `import('./X');`,
    },
    {
      code: `import('X/Y');`,
    },
  ],
  invalid: [
    {
      code: `import('X');`,
      errors: [{messageId: 'hasteImport', data: {importPath: 'X'}}],
      output: null, // Expect no autofix to be suggested.
    },
    {
      code: `import('useX');`,
      errors: [{messageId: 'hasteImport', data: {importPath: 'useX'}}],
      output: null, // Expect no autofix to be suggested.
    },
  ],
});

ruleTester.run("import ... from '...'", rule, {
  valid: [
    {
      code: `import X from 'x';`,
    },
    {
      code: `import X from './X';`,
    },
    {
      code: `import Y from 'X/Y';`,
    },
  ],
  invalid: [
    {
      code: `import X from 'X';`,
      errors: [{messageId: 'hasteImport', data: {importPath: 'X'}}],
      output: null, // Expect no autofix to be suggested.
    },
    {
      code: `import useX from 'useX';`,
      errors: [{messageId: 'hasteImport', data: {importPath: 'useX'}}],
      output: null, // Expect no autofix to be suggested.
    },
  ],
});
