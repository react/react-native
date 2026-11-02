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

import * as React from 'react';
import {codegenNativeCommands, codegenNativeComponent} from 'react-native';

type PopupMenuSelectionEvent = Readonly<{
  item: CodegenTypes.Int32,
}>;

type PopupMenuDismissEvent = Readonly<{}>;

type NativeProps = Readonly<{
  ...ViewProps,

  //Props
  menuItems?: ?ReadonlyArray<string>,

  onPopupMenuSelectionChange?: CodegenTypes.DirectEventHandler<PopupMenuSelectionEvent>,
  onPopupMenuDismiss?: CodegenTypes.DirectEventHandler<PopupMenuDismissEvent>,
}>;

type ComponentType = HostComponent<NativeProps>;

interface NativeCommands {
  readonly show: (viewRef: React.ElementRef<ComponentType>) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['show'],
});

export default codegenNativeComponent<NativeProps>(
  'AndroidPopupMenu',
) as HostComponent<NativeProps>;
