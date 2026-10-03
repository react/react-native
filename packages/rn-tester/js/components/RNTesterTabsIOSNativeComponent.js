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

type Tab = Readonly<{
  key: string,
  title: string,
  // An SF Symbol name.
  systemImage: string,
  testID: string,
}>;

type TabPressEvent = Readonly<{
  key: string,
}>;

export type ContentInsets = Readonly<{
  top: CodegenTypes.Double,
  left: CodegenTypes.Double,
  bottom: CodegenTypes.Double,
  right: CodegenTypes.Double,
}>;

type NativeProps = Readonly<{
  ...ViewProps,
  tabs: ReadonlyArray<Tab>,
  selectedTab: string,
  tabBarHidden?: boolean,
  // Selection is controlled: pressing a tab only reports it, and the tab is
  // selected once `selectedTab` changes.
  onTabPress?: ?CodegenTypes.DirectEventHandler<TabPressEvent>,
  // The area the tab bar and window cutouts cover, which content should clear.
  onContentInsetsChange?: ?CodegenTypes.DirectEventHandler<ContentInsets>,
}>;

export default codegenNativeComponent<NativeProps>('RNTesterTabsIOS', {
  excludedPlatforms: ['android'],
}) as HostComponent<NativeProps>;
