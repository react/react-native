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

const rule = require('../no-react-native-imports.js');
const {RuleTester} = require('eslint');
const path = require('node:path');

const RN_ROOT_DIRECTORY = path.resolve(__dirname, '..', '..', '..', '..');
const RN_PACKAGE_DIRECTORY = path.resolve(
  RN_ROOT_DIRECTORY,
  'packages',
  'react-native',
);

const ruleTester = new RuleTester({
  parser: require.resolve('flow-eslint'),
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
});

// Use a filename inside `react-native`. This lint rule is only applicable to
// JavaScript files inside of the `react-native` repository.
const filename = `${RN_PACKAGE_DIRECTORY}/Libraries/Components/View/View.js`;

ruleTester.run('require(...)', rule, {
  valid: [
    {
      code: `const X = require('X');`,
      filename,
    },
    {
      code: `const X = require('react-native-X');`,
      filename,
    },
    {
      code: `const Y =require('react-native-X/Y');`,
      filename,
    },
  ],
  invalid: [
    {
      code: `const {Platform} = require('react-native');`,
      errors: [{messageId: 'rnImport'}],
      filename,
      output: null, // Expect no autofix to be suggested.
    },
    {
      code: `const Mystery = require('react-native/Mystery');`,
      errors: [{messageId: 'rnImport'}],
      filename,
      output: null, // Expect no autofix to be suggested.
    },
    {
      code: `const Platform = require('react-native/Libraries/Utilities/Platform').default;`,
      errors: [{messageId: 'rnImport'}],
      filename,
      output: `const Platform = require('../../Utilities/Platform').default;`,
    },
    {
      code: `const ViewNativeComponent = require('react-native/Libraries/Components/View/ViewNativeComponent');`,
      errors: [{messageId: 'rnImport'}],
      filename,
      output: `const ViewNativeComponent = require('./ViewNativeComponent');`,
    },
  ],
});

ruleTester.run('import(...)', rule, {
  valid: [
    {
      code: `import('X');`,
      filename,
    },
    {
      code: `import('react-native-X');`,
      filename,
    },
    {
      code: `import('react-native-X/Y');`,
      filename,
    },
  ],
  invalid: [
    /**
     * import expressions
     */
    {
      code: `import('react-native');`,
      errors: [{messageId: 'rnImport'}],
      filename,
      output: null, // Expect no autofix to be suggested.
    },
    {
      code: `import('react-native/Mystery');`,
      errors: [{messageId: 'rnImport'}],
      filename,
      output: null, // Expect no autofix to be suggested.
    },
    {
      code: `import('react-native/Libraries/Utilities/Platform').default;`,
      errors: [{messageId: 'rnImport'}],
      filename,
      output: `import('../../Utilities/Platform').default;`,
    },
    {
      code: `import('react-native/Libraries/Components/View/ViewNativeComponent');`,
      errors: [{messageId: 'rnImport'}],
      filename,
      output: `import('./ViewNativeComponent');`,
    },
  ],
});

ruleTester.run("import ... from '...'", rule, {
  valid: [
    {
      code: `import X from 'X';`,
      filename,
    },
    {
      code: `import X from 'react-native-X';`,
      filename,
    },
    {
      code: `import Y from 'react-native-X/Y';`,
      filename,
    },
  ],
  invalid: [
    {
      code: `import {Platform} from 'react-native';`,
      errors: [{messageId: 'rnImport'}],
      filename,
      output: null, // Expect no autofix to be suggested.
    },
    {
      code: `import Mystery from 'react-native/Mystery';`,
      errors: [{messageId: 'rnImport'}],
      filename,
      output: null, // Expect no autofix to be suggested.
    },
    {
      code: `import Platform from 'react-native/Libraries/Utilities/Platform';`,
      errors: [{messageId: 'rnImport'}],
      filename,
      output: `import Platform from '../../Utilities/Platform';`,
    },
    {
      code: `import ViewNativeComponent from 'react-native/Libraries/Components/View/ViewNativeComponent';`,
      errors: [{messageId: 'rnImport'}],
      filename,
      output: `import ViewNativeComponent from './ViewNativeComponent';`,
    },
  ],
});
