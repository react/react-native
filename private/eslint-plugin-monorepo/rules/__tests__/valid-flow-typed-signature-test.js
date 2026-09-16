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

const rule = require('../valid-flow-typed-signature.js');
const {RuleTester} = require('eslint');

const ruleTester = new RuleTester({
  parser: require.resolve('flow-eslint'),
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
});

ruleTester.run('valid-flow-typed-signature', rule, {
  valid: [
    {
      code: `// ...`,
    },
    {
      code: [
        `// flow-typed signature: 9333721862f426d869c32ea6f7cecfda`,
        `// flow-typed version: 123456/xyz_v1.x.x/flow_>=v0.83.x`,
        ``,
        `declare module "xyz" {}`,
      ].join('\n'),
    },
  ],
  invalid: [
    {
      code: [
        `// flow-typed signature: 90affbd9a1954ec9ff029b7ad7183a16`,
        `// flow-typed version: 123456/xyz_v1.x.x/flow_>=v0.83.x`,
        ``,
        `declare module "xyz" {}`,
      ].join('\n'),
      errors: [{messageId: 'invalidSignature'}],
    },
  ],
});
