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

const rule = require('../no-react-node-imports');
const {RuleTester} = require('eslint');

const ruleTester = new RuleTester({
  parser: require.resolve('flow-eslint'),
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
});

ruleTester.run('import(...)', rule, {
  valid: [
    {
      code: `import React from "react";`,
    },
    {
      code: `import { Foo } from "react";`,
    },
  ],
  invalid: [
    {
      code: `import { Node } from "react";`,
      errors: [{messageId: 'nodeImport'}],
      output: null,
    },
  ],
});
