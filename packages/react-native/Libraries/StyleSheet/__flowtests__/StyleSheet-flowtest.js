/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ImageStyleProp, TextStyleProp} from '../StyleSheet';

const StyleSheet = require('../StyleSheet').default;

const imageStyle = {tintColor: 'rgb(0, 0, 0)'};
const textStyle = {color: 'rgb(0, 0, 0)'};

export function testGoodCompose() {
  StyleSheet.compose(imageStyle, imageStyle) as ImageStyleProp;

  StyleSheet.compose(textStyle, textStyle) as TextStyleProp;

  StyleSheet.compose(null, null) as TextStyleProp;

  StyleSheet.compose(textStyle, null) as TextStyleProp;

  StyleSheet.compose(
    textStyle,
    Math.random() < 0.5 ? textStyle : null,
  ) as TextStyleProp;

  StyleSheet.compose([textStyle], null) as TextStyleProp;

  StyleSheet.compose([textStyle], null) as TextStyleProp;

  StyleSheet.compose([textStyle], [textStyle]) as TextStyleProp;
}

export function testBadCompose() {
  // $FlowExpectedError[incompatible-type]  - Incompatible type.
  StyleSheet.compose(textStyle, textStyle) as ImageStyleProp;

  // $FlowExpectedError[incompatible-type]  - Incompatible type.
  StyleSheet.compose([textStyle], null) as ImageStyleProp;

  // $FlowExpectedError[incompatible-type]  - Incompatible type.
  StyleSheet.compose(
    Math.random() < 0.5 ? textStyle : null,
    null,
  ) as ImageStyleProp;
}
