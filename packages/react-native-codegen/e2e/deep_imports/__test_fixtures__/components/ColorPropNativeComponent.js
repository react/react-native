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
import type {ColorValue} from 'react-native/Libraries/StyleSheet/StyleSheet';

import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

type NativeProps = Readonly<{
  ...ViewProps,

  // Props
  tintColor?: ColorValue,
}>;

export default codegenNativeComponent<NativeProps>(
  'ColorPropNativeComponentView',
) as HostComponent<NativeProps>;
