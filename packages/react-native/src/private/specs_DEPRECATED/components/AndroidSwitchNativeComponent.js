/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from '../../../../Libraries/Components/View/ViewPropTypes';
import type {ColorValue} from '../../../../Libraries/StyleSheet/StyleSheet';
import type {
  BubblingEventHandler,
  Int32,
  WithDefault,
} from '../../../../Libraries/Types/CodegenTypes';
import type {HostComponent} from '../../types/HostComponent';

import codegenNativeCommands from '../../../../Libraries/Utilities/codegenNativeCommands';
import codegenNativeComponent from '../../../../Libraries/Utilities/codegenNativeComponent';
import * as React from 'react';

type AndroidSwitchChangeEvent = Readonly<{
  value: boolean,
  target: Int32,
}>;

type AndroidSwitchNativeProps = Readonly<{
  ...ViewProps,

  // Props
  disabled?: WithDefault<boolean, false>,
  enabled?: WithDefault<boolean, true>,
  thumbColor?: ?ColorValue,
  trackColorForFalse?: ?ColorValue,
  trackColorForTrue?: ?ColorValue,
  value?: WithDefault<boolean, false>,
  on?: WithDefault<boolean, false>,
  thumbTintColor?: ?ColorValue,
  trackTintColor?: ?ColorValue,

  // Events
  onChange?: BubblingEventHandler<AndroidSwitchChangeEvent>,
}>;

type NativeType = HostComponent<AndroidSwitchNativeProps>;

interface NativeCommands {
  readonly setNativeValue: (
    viewRef: React.ElementRef<NativeType>,
    value: boolean,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['setNativeValue'],
});

export default codegenNativeComponent<AndroidSwitchNativeProps>(
  'AndroidSwitch',
  {
    interfaceOnly: true,
  },
) as NativeType;
