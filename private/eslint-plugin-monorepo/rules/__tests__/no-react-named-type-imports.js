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

const rule = require('../no-react-named-type-imports');
const {RuleTester} = require('eslint');

const ruleTester = new RuleTester({
  parser: require.resolve('flow-eslint'),
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
});

ruleTester.run('import type { ... } from "react"', rule, {
  valid: [],
  invalid: [
    {
      code: `import type { ElementRef } from "react";`,
      errors: [{messageId: 'noNamedTypeImports'}],
      output: null,
    },
  ],
});

ruleTester.run('import { ... } from "react"', rule, {
  valid: [
    {
      code: `import { useRef } from "react";`,
    },
    {
      code: `import { useRef, useState } from "react";`,
    },
  ],
  invalid: [
    {
      code: `import { type ElementRef } from "react";`,
      errors: [{messageId: 'noNamedTypeImports'}],
      output: null,
    },
    {
      code: `import { useState, type ElementRef } from "react";`,
      errors: [{messageId: 'noNamedTypeImports'}],
      output: null,
    },
  ],
});
