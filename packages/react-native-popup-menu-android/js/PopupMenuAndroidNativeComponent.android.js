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
  DirectEventHandler,
  Int32,
} from 'react-native/Libraries/Types/CodegenTypes';

import * as React from 'react';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

type PopupMenuSelectionEvent = Readonly<{
  item: Int32,
}>;

type PopupMenuDismissEvent = Readonly<{}>;

type NativeProps = Readonly<{
  ...ViewProps,

  //Props
  menuItems?: ?ReadonlyArray<string>,

  onPopupMenuSelectionChange?: DirectEventHandler<PopupMenuSelectionEvent>,
  onPopupMenuDismiss?: DirectEventHandler<PopupMenuDismissEvent>,
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
