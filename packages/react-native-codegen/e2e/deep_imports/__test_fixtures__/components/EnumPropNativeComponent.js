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
  alignment?: CodegenTypes.WithDefault<
    'top' | 'center' | 'bottom-right',
    'center',
  >,
  intervals?: CodegenTypes.WithDefault<0 | 15 | 30 | 60, 0>,
}>;

export default codegenNativeComponent<NativeProps>(
  'EnumPropNativeComponentView',
) as HostComponent<NativeProps>;
