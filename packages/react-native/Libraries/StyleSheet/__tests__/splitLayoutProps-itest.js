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

test('splits zIndex into the outer style', () => {
  // On Android a ScrollView with a RefreshControl is wrapped in an
  // AndroidSwipeRefreshLayout, and the outer style is applied to that wrapper.
  // `zIndex` has to travel outwards along with the other positioning props,
  // because the wrapper is the node that participates in the parent's
  // stacking context.
  const style = {zIndex: 1, top: 0, backgroundColor: 'red', padding: 8};
  const {outer, inner} = splitLayoutProps(style);
  expect(outer).toEqual({zIndex: 1, top: 0});
  expect(inner).toEqual({backgroundColor: 'red', padding: 8});
});

test('returns null values if argument is null', () => {
  const {outer, inner} = splitLayoutProps(null);
  expect(outer).toBe(null);
  expect(inner).toBe(null);
});
