/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';

import {codegenNativeComponent} from 'react-native';

type NativeProps = Readonly<{
  ...ViewProps,

  // Props
  blurRadius: CodegenTypes.Float,
  blurRadius2?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.001>,
  blurRadius3?: CodegenTypes.WithDefault<CodegenTypes.Float, 2.1>,
  blurRadius4?: CodegenTypes.WithDefault<CodegenTypes.Float, 0>,
  blurRadius5?: CodegenTypes.WithDefault<CodegenTypes.Float, 1>,
  blurRadius6?: CodegenTypes.WithDefault<CodegenTypes.Float, -0.0>,
  blurRadiusNullable?: CodegenTypes.WithDefault<CodegenTypes.Float, null>,
}>;

export default codegenNativeComponent<NativeProps>(
  'FloatPropsNativeComponentView',
) as HostComponent<NativeProps>;
