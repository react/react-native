/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {DimensionValue, HostComponent, ViewProps} from 'react-native';

import {codegenNativeComponent} from 'react-native';

type NativeProps = Readonly<{
  ...ViewProps,

  // Props
  marginBack?: DimensionValue,
}>;

export default codegenNativeComponent<NativeProps>(
  'DimensionPropNativeComponentView',
) as HostComponent<NativeProps>;
