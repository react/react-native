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

const rule = require('../no-deep-imports.js');
const {publicAPIMapping} = require('../utils.js');
const ESLintTester = require('./eslint-tester.js');

const eslintTester = new ESLintTester();

test('resolve all public API paths', () => {
  for (const subpath of Object.keys(publicAPIMapping)) {
    require.resolve('react-native/' + subpath);
  }
});

eslintTester.run('../no-deep-imports', rule, {
  valid: [
    "import {View} from 'react-native';",
    "const {View} = require('react-native');",
    "import Foo from 'react-native-foo';",
    "import Foo from 'react-native-foo/Foo';",
    "import Foo from 'react/native/Foo';",
    "import 'react-native/Libraries/Core/InitializeCore';",
    "require('react-native/Libraries/Core/InitializeCore');",
    "import Foo from 'react-native/src/fb_internal/Foo'",
    "require('react-native/src/fb_internal/Foo')",
  ],
  invalid: [
    {
      code: "import View from 'react-native/Libraries/Components/View/View';",
      errors: [
        {
          messageId: 'deepImport',
          data: {importPath: 'react-native/Libraries/Components/View/View'},
        },
      ],
      output: "import {View} from 'react-native';",
    },
    {
      code: "const View = require('react-native/Libraries/Components/View/View');",
      errors: [
        {
          messageId: 'deepImport',
          data: {importPath: 'react-native/Libraries/Components/View/View'},
        },
      ],
      output: "const {View} = require('react-native');",
    },
    {
      code: "var View = require('react-native/Libraries/Components/View/View');",
      errors: [
        {
          messageId: 'deepImport',
          data: {importPath: 'react-native/Libraries/Components/View/View'},
        },
      ],
      output: "var {View} = require('react-native');",
    },
    {
      code: "import Foo from 'react-native/Libraries/Components/Foo';",
      errors: [
        {
          messageId: 'deepImport',
          data: {importPath: 'react-native/Libraries/Components/Foo'},
        },
      ],
      output: null,
    },
    {
      code: "import {Foo} from 'react-native/Libraries/Components/Foo';",
      errors: [
        {
          messageId: 'deepImport',
          data: {importPath: 'react-native/Libraries/Components/Foo'},
        },
      ],
      output: null,
    },
    {
      code: "const {Foo} = require('react-native/Libraries/Foo');",
      errors: [
        {
          messageId: 'deepImport',
          data: {importPath: 'react-native/Libraries/Foo'},
        },
      ],
      output: null,
    },
    {
      code: "if(require('react-native/Libraries/Foo')) {};",
      errors: [
        {
          messageId: 'deepImport',
          data: {importPath: 'react-native/Libraries/Foo'},
        },
      ],
      output: null,
    },
    {
      code: "import type {RootTag} from 'react-native/Libraries/Types/RootTagTypes';",
      errors: [
        {
          messageId: 'deepImport',
          data: {importPath: 'react-native/Libraries/Types/RootTagTypes'},
        },
      ],
      output: "import type {RootTag} from 'react-native';",
    },
    {
      code: "import type {ModalBaseProps, Foo} from 'react-native/Libraries/Modal/Modal';",
      errors: [
        {
          messageId: 'deepImport',
          data: {importPath: 'react-native/Libraries/Modal/Modal'},
        },
      ],
      output: null,
    },
    {
      // Deep type import with no public API mapping: still reported, no fix.
      code: "import type {Foo} from 'react-native/Libraries/Components/Foo';",
      errors: [
        {
          messageId: 'deepImport',
          data: {importPath: 'react-native/Libraries/Components/Foo'},
        },
      ],
      output: null,
    },
    {
      // Deep type import from a module whose mapping has `types: null`
      // (e.g. AccessibilityInfo): still reported, no fix.
      code: "import type {AccessibilityChangeEventName} from 'react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo';",
      errors: [
        {
          messageId: 'deepImport',
          data: {
            importPath:
              'react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo',
          },
        },
      ],
      output: null,
    },
  ],
});
