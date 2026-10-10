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
  HostComponent,
  ImageSource,
  PointValue,
  ViewProps,
} from 'react-native';

import {codegenNativeComponent} from 'react-native';

type ObjectArrayPropType = Readonly<{
  array: ReadonlyArray<string>,
}>;

type NativeProps = Readonly<{
  ...ViewProps,

  // Props
  objectProp?: Readonly<{
    stringProp?: CodegenTypes.WithDefault<string, ''>,
    booleanProp: boolean,
    floatProp: CodegenTypes.Float,
    intProp: CodegenTypes.Int32,
    stringEnumProp?: CodegenTypes.WithDefault<'small' | 'large', 'small'>,
    intEnumProp?: CodegenTypes.WithDefault<0 | 1, 0>,
  }>,
  objectArrayProp: ObjectArrayPropType,
  objectPrimitiveRequiredProp: Readonly<{
    image: ImageSource,
    color?: ColorValue,
    point: ?PointValue,
  }>,
}>;

export default codegenNativeComponent<NativeProps>(
  'ObjectPropsNativeComponent',
) as HostComponent<NativeProps>;
