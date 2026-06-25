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
  placeholder?: CodegenTypes.WithDefault<string, ''>,
  defaultValue?: string,
}>;

export default codegenNativeComponent<NativeProps>(
  'StringPropNativeComponentView',
) as HostComponent<NativeProps>;
