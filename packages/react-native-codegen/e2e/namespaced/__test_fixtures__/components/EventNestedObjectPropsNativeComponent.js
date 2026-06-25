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

type OnChangeEvent = Readonly<{
  location: {
    source: {url: string, ...},
    x: CodegenTypes.Int32,
    y: CodegenTypes.Int32,
    arrayOfObjects: ReadonlyArray<{value: Readonly<{str: string}>}>,
    ...
  },
}>;

type NativeProps = Readonly<{
  ...ViewProps,

  // Props
  disabled?: CodegenTypes.WithDefault<boolean, false>,

  // Events
  onChange?: ?CodegenTypes.BubblingEventHandler<OnChangeEvent>,
}>;

export default codegenNativeComponent<NativeProps>(
  'EventNestedObjectPropsNativeComponentView',
) as HostComponent<NativeProps>;
