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
  progress1?: CodegenTypes.WithDefault<CodegenTypes.Int32, 0>,
  progress2?: CodegenTypes.WithDefault<CodegenTypes.Int32, -1>,
  progress3?: CodegenTypes.WithDefault<CodegenTypes.Int32, 10>,
}>;

export default codegenNativeComponent<NativeProps>(
  'IntegerPropNativeComponentView',
) as HostComponent<NativeProps>;
