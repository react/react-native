/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  CodegenTypes,
  ColorValue,
  DimensionValue,
  EdgeInsetsValue,
  HostComponent,
  ImageSource,
  PointValue,
  ViewProps,
} from 'react-native';

import {codegenNativeComponent} from 'react-native';

type NativeProps = Readonly<{
  ...ViewProps,

  // Props
  names?: ReadonlyArray<string>,
  disableds?: ReadonlyArray<boolean>,
  progress?: ReadonlyArray<CodegenTypes.Int32>,
  radii?: ReadonlyArray<CodegenTypes.Float>,
  colors?: ReadonlyArray<ColorValue>,
  srcs?: ReadonlyArray<ImageSource>,
  points?: ReadonlyArray<PointValue>,
  edgeInsets?: ReadonlyArray<EdgeInsetsValue>,
  dimensions?: ReadonlyArray<DimensionValue>,
  sizes?: CodegenTypes.WithDefault<ReadonlyArray<'small' | 'large'>, 'small'>,
  object?: ReadonlyArray<Readonly<{prop: string}>>,
  arrayOfObjects?: ReadonlyArray<
    Readonly<{prop1: CodegenTypes.Float, prop2: CodegenTypes.Int32}>,
  >,
  arrayOfMixed?: ReadonlyArray<CodegenTypes.UnsafeMixed>,
}>;

export default codegenNativeComponent<NativeProps>(
  'ArrayPropsNativeComponentView',
) as HostComponent<NativeProps>;
