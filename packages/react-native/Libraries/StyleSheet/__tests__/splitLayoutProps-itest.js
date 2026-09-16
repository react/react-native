/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';
import splitLayoutProps from '../splitLayoutProps';

test('splits style objects', () => {
  const style = {width: 10, margin: 20, padding: 30, transform: [{scaleY: -1}]};
  const {outer, inner} = splitLayoutProps(style);
  expect(outer).toMatchInlineSnapshot(`
Object {
  "margin": 20,
  "transform": Array [
    Object {
      "scaleY": -1,
    },
  ],
  "width": 10,
}
`);
  expect(inner).toMatchInlineSnapshot(`
    Object {
      "padding": 30,
    }
  `);
});

test('does not copy values to both returned objects', () => {
  const style = {marginVertical: 5, paddingHorizontal: 10};
  const {outer, inner} = splitLayoutProps(style);
  expect(outer).toMatchInlineSnapshot(`
    Object {
      "marginVertical": 5,
    }
  `);
  expect(inner).toMatchInlineSnapshot(`
    Object {
      "paddingHorizontal": 10,
    }
  `);
});

test('returns null values if argument is null', () => {
  const {outer, inner} = splitLayoutProps(null);
  expect(outer).toBe(null);
  expect(inner).toBe(null);
});
