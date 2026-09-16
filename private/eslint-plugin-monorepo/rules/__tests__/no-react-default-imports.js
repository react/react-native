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

const rule = require('../no-react-default-imports');
const {RuleTester} = require('eslint');

const ruleTester = new RuleTester({
  parser: require.resolve('flow-eslint'),
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
});

ruleTester.run('import React from "react"', rule, {
  valid: [
    {
      code: `import * as React from "react";`,
    },
  ],
  invalid: [
    {
      code: `import React from "react";`,
      errors: [{messageId: 'defaultReactImport'}],
      output: "import * as React from 'react';",
    },
    {
      code: `import React, {View} from "react";`,
      errors: [{messageId: 'defaultReactImport'}],
      output: null,
    },
  ],
});
