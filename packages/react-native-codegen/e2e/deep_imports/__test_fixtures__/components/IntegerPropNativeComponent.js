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
import type {
  Int32,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes';

import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

type NativeProps = Readonly<{
  ...ViewProps,

  // Props
  progress1?: WithDefault<Int32, 0>,
  progress2?: WithDefault<Int32, -1>,
  progress3?: WithDefault<Int32, 10>,
}>;

export default codegenNativeComponent<NativeProps>(
  'IntegerPropNativeComponentView',
) as HostComponent<NativeProps>;
