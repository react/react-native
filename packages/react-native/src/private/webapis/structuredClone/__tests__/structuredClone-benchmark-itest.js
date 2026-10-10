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

import structuredClone from '../structuredClone';
import * as Fantom from '@react-native/fantom';

const basicArray = [1, 2, 3];
const basicObject = {a: 1, b: 2, c: 3};
const complexObject = {
  a: 1,
  b: 'foo',
  c: false,
  d: undefined,
  e: {
    f: {
      g: [1, 'foo', 'bar'],
    },
  },
};

Fantom.unstable_benchmark
  .suite('structuredClone')
  .test('clone a string', () => {
    structuredClone('hello world');
  })
  .test('clone a basic array', () => {
    structuredClone(basicArray);
  })
  .test('clone a basic object', () => {
    structuredClone(basicObject);
  })
  .test('clone a complex object', () => {
    structuredClone(complexObject);
  });
