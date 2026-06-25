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

import flattenStyle from '../flattenStyle';
import * as Fantom from '@react-native/fantom';

const baseStyle = {
  width: 100,
  height: 40,
  opacity: 0.8,
  backgroundColor: 'blue',
  borderRadius: 8,
};

const overrideStyle = {
  height: 44,
  opacity: 1,
  borderWidth: 1,
  borderColor: 'red',
};

const accentStyle = {
  borderRadius: 12,
  transform: [{scale: 1.1}],
};

const objectStyle = baseStyle;
const singleArrayStyle = [baseStyle];
const singleEffectiveArrayStyle: $FlowFixMe = [
  null,
  false,
  undefined,
  baseStyle,
];
const nestedSingleArrayStyle: $FlowFixMe = [
  null,
  [undefined, baseStyle],
  false,
];
const nestedMergedArrayStyle = [baseStyle, [null, overrideStyle, accentStyle]];
const mergedArrayStyle = [baseStyle, overrideStyle];

Fantom.unstable_benchmark
  .suite('flattenStyle', {minTestExecutionTimeMs: 500})
  .test('flatten object style', () => {
    flattenStyle(objectStyle);
  })
  .test('flatten array with one style', () => {
    flattenStyle(singleArrayStyle);
  })
  .test('flatten array with one effective style', () => {
    flattenStyle(singleEffectiveArrayStyle);
  })
  .test('flatten nested array with one effective style', () => {
    flattenStyle(nestedSingleArrayStyle);
  })
  .test('flatten nested array with merged styles', () => {
    // $FlowFixMe[incompatible-call]
    flattenStyle(nestedMergedArrayStyle);
  })
  .test('flatten array with merged styles', () => {
    flattenStyle(mergedArrayStyle);
  });
