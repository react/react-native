/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ColorValue, HostComponent, ViewProps} from 'react-native';

import {codegenNativeComponent} from 'react-native';

type NativeProps = Readonly<{
  ...ViewProps,

  // Props
  tintColor?: ColorValue,
}>;

export default codegenNativeComponent<NativeProps>(
  'ColorPropNativeComponentView',
) as HostComponent<NativeProps>;
