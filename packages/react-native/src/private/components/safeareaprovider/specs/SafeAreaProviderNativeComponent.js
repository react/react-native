/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from '../../../../../Libraries/Components/View/ViewPropTypes';
import type {
  DirectEventHandler,
  Double,
} from '../../../../../Libraries/Types/CodegenTypes';
import type {HostComponent} from '../../../types/HostComponent';

import codegenNativeComponent from '../../../../../Libraries/Utilities/codegenNativeComponent';

export type SafeAreaProviderInsetsChangeEvent = Readonly<{
  insets: Readonly<{
    top: Double,
    right: Double,
    bottom: Double,
    left: Double,
  }>,
  frame: Readonly<{
    x: Double,
    y: Double,
    width: Double,
    height: Double,
  }>,
}>;

type SafeAreaProviderNativeProps = Readonly<{
  ...ViewProps,
  onInsetsChange?: ?DirectEventHandler<SafeAreaProviderInsetsChangeEvent>,
}>;

export default codegenNativeComponent<SafeAreaProviderNativeProps>(
  'SafeAreaProvider',
  {
    paperComponentName: 'RCTSafeAreaProvider',
  },
) as HostComponent<SafeAreaProviderNativeProps>;
