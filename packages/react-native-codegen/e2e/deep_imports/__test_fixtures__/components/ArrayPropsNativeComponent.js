/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostComponent} from 'react-native';
import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';
import type {ImageSource} from 'react-native/Libraries/Image/ImageSource';
import type {ColorValue} from 'react-native/Libraries/StyleSheet/StyleSheet';
import type {
  DimensionValue,
  EdgeInsetsValue,
  PointValue,
} from 'react-native/Libraries/StyleSheet/StyleSheetTypes';
import type {
  Float,
  Int32,
  UnsafeMixed,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes';

import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

type NativeProps = Readonly<{
  ...ViewProps,

  // Props
  names?: ReadonlyArray<string>,
  disableds?: ReadonlyArray<boolean>,
  progress?: ReadonlyArray<Int32>,
  radii?: ReadonlyArray<Float>,
  colors?: ReadonlyArray<ColorValue>,
  srcs?: ReadonlyArray<ImageSource>,
  points?: ReadonlyArray<PointValue>,
  edgeInsets?: ReadonlyArray<EdgeInsetsValue>,
  dimensions?: ReadonlyArray<DimensionValue>,
  sizes?: WithDefault<ReadonlyArray<'small' | 'large'>, 'small'>,
  object?: ReadonlyArray<Readonly<{prop: string}>>,
  arrayOfObjects?: ReadonlyArray<Readonly<{prop1: Float, prop2: Int32}>>,
  arrayOfMixed?: ReadonlyArray<UnsafeMixed>,
}>;

export default codegenNativeComponent<NativeProps>(
  'ArrayPropsNativeComponentView',
) as HostComponent<NativeProps>;
