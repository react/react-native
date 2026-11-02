/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// The hand-written legacy ImageStyle and TextStyle must accept every ViewStyle
// prop, as the generated (strict API) types do. ImageStyle only narrows
// `overflow`. See https://github.com/facebook/react-native/issues/52957

import * as React from 'react';
// @ts-ignore
import {
  Image,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

type MissingKeys<Target, Source> = Exclude<keyof Source, keyof Target>;

// On failure, the error names every ViewStyle prop the target type lacks.
const imageStyleHasAllViewStyleKeys: [
  MissingKeys<ImageStyle, Omit<ViewStyle, 'overflow'>>,
] extends [never]
  ? true
  : MissingKeys<ImageStyle, Omit<ViewStyle, 'overflow'>> = true;

const textStyleHasAllViewStyleKeys: [
  MissingKeys<TextStyle, ViewStyle>,
] extends [never]
  ? true
  : MissingKeys<TextStyle, ViewStyle> = true;

function viewStyleToImageStyle(style: Omit<ViewStyle, 'overflow'>): ImageStyle {
  return style;
}

const imageStyle: ImageStyle = {
  borderBlockColor: 'red',
  borderBlockEndColor: 'red',
  borderBlockStartColor: 'red',
  borderBottomColor: 'red',
  borderEndColor: 'red',
  borderLeftColor: 'red',
  borderRightColor: 'red',
  borderStartColor: 'red',
  borderTopColor: 'red',
  borderBottomEndRadius: 4,
  borderBottomStartRadius: 4,
  borderEndEndRadius: 4,
  borderEndStartRadius: 4,
  borderStartEndRadius: 4,
  borderStartStartRadius: 4,
  borderTopEndRadius: 4,
  borderTopStartRadius: 4,
  borderCurve: 'continuous',
  borderStyle: 'dashed',
  outlineColor: 'blue',
  outlineOffset: 2,
  outlineStyle: 'solid',
  outlineWidth: 1,
  elevation: 2,
  pointerEvents: 'none',
  isolation: 'isolate',
  boxShadow: '0 2px 4px black',
  filter: 'blur(4px)',
  mixBlendMode: 'multiply',
  backgroundImage: 'linear-gradient(red, blue)',
  experimental_backgroundImage: 'linear-gradient(red, blue)',
  backgroundSize: '50% 50%',
  experimental_backgroundSize: '50% 50%',
  backgroundPosition: 'center',
  experimental_backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  experimental_backgroundRepeat: 'no-repeat',
};

const imageStyleWithScrollOverflow: ImageStyle = {
  // @ts-expect-error Image does not support `overflow: 'scroll'`.
  overflow: 'scroll',
};

const imageStyleWithTextProp: ImageStyle = {
  // @ts-expect-error `fontSize` is not an Image style prop.
  fontSize: 12,
};

const viewStyle: ViewStyle = {
  backgroundColor: 'white',
};

export function App() {
  return (
    <View style={viewStyle}>
      <Image style={imageStyle} />
      <Image style={viewStyleToImageStyle(viewStyle)} />
    </View>
  );
}
