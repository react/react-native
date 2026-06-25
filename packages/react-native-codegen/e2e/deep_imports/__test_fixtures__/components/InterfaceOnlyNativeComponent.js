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
  BubblingEventHandler,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes';

import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

type NativeProps = Readonly<{
  ...ViewProps,

  // Props
  title?: WithDefault<string, ''>,

  // Events
  onChange?: ?BubblingEventHandler<Readonly<{value: boolean}>>,
}>;

export default codegenNativeComponent<NativeProps>(
  'InterfaceOnlyNativeComponentView',
  {
    interfaceOnly: true,
    paperComponentName: 'RCTInterfaceOnlyComponent',
  },
) as HostComponent<NativeProps>;
