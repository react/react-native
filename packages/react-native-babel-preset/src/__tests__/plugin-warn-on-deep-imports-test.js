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

const {transform} = require('../__mocks__/test-helpers');
const rnDeepImportsWarningPlugin = require('../plugin-warn-on-deep-imports');

jest.mock('path', () => ({
  ...jest.requireActual('path'),
  resolve: jest.fn((...args) => args.join('/')),
}));

test('deep esm import', () => {
  const code = `
    import View from 'react-native/Libraries/Components/View/View';
    import {Text} from 'react-native';
  `;

  expect(transform(code, [rnDeepImportsWarningPlugin])).toMatchInlineSnapshot(`
    "import View from 'react-native/Libraries/Components/View/View';
    import { Text } from 'react-native';
    console.warn(\\"Deep imports from the 'react-native' package are deprecated ('react-native/Libraries/Components/View/View'). Source: path/to/project/foo.js 2:4\\");"
  `);
});

test('deep cjs import', () => {
  const code = `
    const View = require('react-native/Libraries/Components/View/View');
    const {Text} = require('react-native');
  `;

  expect(transform(code, [rnDeepImportsWarningPlugin])).toMatchInlineSnapshot(`
    "const View = require('react-native/Libraries/Components/View/View');
    const {
      Text
    } = require('react-native');
    console.warn(\\"Deep imports from the 'react-native' package are deprecated ('react-native/Libraries/Components/View/View'). Source: path/to/project/foo.js 2:17\\");"
  `);
});

test('multiple deep imports', () => {
  const code = `
    import View from 'react-native/Libraries/Components/View/View';
    import Text from 'react-native/Libraries/Text/Text';
    import {Image} from 'react-native';
  `;

  expect(transform(code, [rnDeepImportsWarningPlugin])).toMatchInlineSnapshot(`
    "import View from 'react-native/Libraries/Components/View/View';
    import Text from 'react-native/Libraries/Text/Text';
    import { Image } from 'react-native';
    console.warn(\\"Deep imports from the 'react-native' package are deprecated ('react-native/Libraries/Components/View/View'). Source: path/to/project/foo.js 2:4\\");
    console.warn(\\"Deep imports from the 'react-native' package are deprecated ('react-native/Libraries/Text/Text'). Source: path/to/project/foo.js 3:4\\");"
  `);
});

test('deep reexport', () => {
  const code = `
    export { PressabilityDebugView } from 'react-native/Libraries/Pressability/PressabilityDebug';
  `;

  expect(transform(code, [rnDeepImportsWarningPlugin])).toMatchInlineSnapshot(`
    "export { PressabilityDebugView } from 'react-native/Libraries/Pressability/PressabilityDebug';
    console.warn(\\"Deep imports from the 'react-native' package are deprecated ('react-native/Libraries/Pressability/PressabilityDebug'). Source: path/to/project/foo.js 2:4\\");"
  `);
});

test('import from other package', () => {
  const code = `
    import {foo} from 'react-native-foo';
  `;

  expect(transform(code, [rnDeepImportsWarningPlugin])).toMatchInlineSnapshot(
    `"import { foo } from 'react-native-foo';"`,
  );
});
