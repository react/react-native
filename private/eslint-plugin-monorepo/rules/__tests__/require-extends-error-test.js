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

const rule = require('../require-extends-error.js');
const {RuleTester} = require('eslint');

const ruleTester = new RuleTester({
  parser: require.resolve('flow-eslint'),
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
});

ruleTester.run('functions', rule, {
  valid: [
    {
      code: `(function () {});`,
    },
    {
      code: `function xError() {}`,
    },
  ],
  invalid: [
    {
      code: 'function XError() {}',
      errors: [{messageId: 'errorFunction', data: {name: 'XError'}}],
    },
    {
      code: '(function XError() {});',
      errors: [{messageId: 'errorFunction', data: {name: 'XError'}}],
    },
  ],
});

ruleTester.run('classes', rule, {
  valid: [
    {
      code: `(class {});`,
    },
    {
      code: `(class extends Y {});`,
    },
    {
      code: `class X extends Y {}`,
    },
    {
      code: `(class X extends Y {});`,
    },
    {
      code: `class XError extends Error {}`,
    },
    {
      code: `(class XError extends Error {});`,
    },
    {
      code: `class XError extends YError {}`,
    },
    {
      code: `(class XError extends YError {});`,
    },
    {
      code: `class XError extends Y.Error {}`,
    },
    {
      code: `(class XError extends Y.Error {});`,
    },
    {
      code: `class XError extends Y.Z.Error {}`,
    },
    {
      code: `(class XError extends Y.Z.Error {});`,
    },
  ],
  invalid: [
    {
      code: `class XError {}`,
      errors: [{messageId: 'errorClass', data: {name: 'XError'}}],
    },
    {
      code: `(class XError {});`,
      errors: [{messageId: 'errorClass', data: {name: 'XError'}}],
    },
    {
      code: `class XError extends Y {}`,
      errors: [{messageId: 'errorClass', data: {name: 'XError'}}],
    },
    {
      code: `(class XError extends Y {});`,
      errors: [{messageId: 'errorClass', data: {name: 'XError'}}],
    },
    {
      code: `class XError extends Y.Z {}`,
      errors: [{messageId: 'errorClass', data: {name: 'XError'}}],
    },
    {
      code: `(class XError extends Y.Z {});`,
      errors: [{messageId: 'errorClass', data: {name: 'XError'}}],
    },
  ],
});

ruleTester.run('superclasses', rule, {
  valid: [],
  invalid: [
    {
      code: `(class extends Error {});`,
      errors: [{messageId: 'errorSuperClassMissingName'}],
    },
    {
      code: `class X extends Error {}`,
      errors: [{messageId: 'errorSuperClass', data: {name: 'X'}}],
    },
    {
      code: `(class X extends Error {});`,
      errors: [{messageId: 'errorSuperClass', data: {name: 'X'}}],
    },
    {
      code: `class X extends YError {}`,
      errors: [{messageId: 'errorSuperClass', data: {name: 'X'}}],
    },
    {
      code: `(class X extends YError {});`,
      errors: [{messageId: 'errorSuperClass', data: {name: 'X'}}],
    },
    {
      code: `class X extends Y.Error {}`,
      errors: [{messageId: 'errorSuperClass', data: {name: 'X'}}],
    },
    {
      code: `(class X extends Y.Error {});`,
      errors: [{messageId: 'errorSuperClass', data: {name: 'X'}}],
    },
    {
      code: `class X extends Y.Z.Error {}`,
      errors: [{messageId: 'errorSuperClass', data: {name: 'X'}}],
    },
    {
      code: `(class X extends Y.Z.Error {});`,
      errors: [{messageId: 'errorSuperClass', data: {name: 'X'}}],
    },
  ],
});
