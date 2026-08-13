/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
// @ts-ignore
import {Image, StyleSheet, type ImageStyle} from 'react-native';

// `ImageStyle` must accept every `ViewStyle` property. This matches the Flow
// definition of `____ImageStyle_InternalCore`, which spreads
// `____ViewStyle_Internal`, and the generated strict API, which declares
// `Omit<____ViewStyle_Internal, 'overflow'> & {...}`.
const viewStyleProperties: ImageStyle = {
  backgroundImage: 'linear-gradient(to right, red, blue)',
  borderCurve: 'continuous',
  boxShadow: '0 0 10px red',
  cursor: 'pointer',
  elevation: 4,
  filter: 'brightness(0.5)',
  isolation: 'isolate',
  mixBlendMode: 'multiply',
  outlineColor: 'red',
  outlineOffset: 2,
  outlineStyle: 'dashed',
  outlineWidth: 1,
  pointerEvents: 'none',
};

// Image-specific properties remain available.
const imageStyleProperties: ImageStyle = {
  objectFit: 'contain',
  overlayColor: 'red',
  resizeMode: 'cover',
  tintColor: 'blue',
};

// Unlike `ViewStyle`, `overflow` on `ImageStyle` is narrowed to
// 'visible' | 'hidden' — 'scroll' is not accepted.
const overflowVisible: ImageStyle = {overflow: 'visible'};
const overflowHidden: ImageStyle = {overflow: 'hidden'};
// @ts-expect-error - 'scroll' is not a valid `overflow` value for `ImageStyle`
const overflowScroll: ImageStyle = {overflow: 'scroll'};

// Unknown properties are still rejected.
// @ts-expect-error - 'notAStyleProperty' does not exist on `ImageStyle`
const unknownProperty: ImageStyle = {notAStyleProperty: 1};

const styles = StyleSheet.create({
  image: {
    boxShadow: '0 0 10px red',
    filter: 'brightness(0.5)',
    resizeMode: 'cover',
  } as ImageStyle,
});

export function App() {
  return (
    <>
      <Image
        source={{uri: 'https://reactnative.dev/img/logo-og.png'}}
        style={styles.image}
      />
      {/* The user-visible path: writing `ViewStyle` properties inline on `<Image>`. */}
      <Image
        source={{uri: 'https://reactnative.dev/img/logo-og.png'}}
        style={{filter: 'brightness(0.5)', mixBlendMode: 'multiply'}}
      />
    </>
  );
}

export {
  imageStyleProperties,
  overflowHidden,
  overflowScroll,
  overflowVisible,
  unknownProperty,
  viewStyleProperties,
};
