/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {Constructor} from '../../../types/private/Utilities';
import {HostInstance} from '../../../types/public/ReactNativeTypes';
import {ColorValue} from '../../StyleSheet/StyleSheet';
import {ViewProps} from '../View/ViewPropTypes';

export interface RefreshControlPropsIOS extends ViewProps {
  /**
   * The color of the refresh indicator.
   */
  tintColor?: ColorValue | undefined;

  /**
   * The title displayed under the refresh indicator.
   */
  title?: string | undefined;

  /**
   * Title color.
   */
  titleColor?: ColorValue | undefined;
}

export interface RefreshControlPropsAndroid extends ViewProps {
  /**
   * The colors (at least one) that will be used to draw the refresh indicator.
   */
  colors?: ColorValue[] | undefined;

  /**
   * Whether the pull to refresh functionality is enabled.
   */
  enabled?: boolean | undefined;

  /**
   * The background color of the refresh indicator.
   */
  progressBackgroundColor?: ColorValue | undefined;

  /**
   * Size of the refresh indicator, see RefreshControl.SIZE.
   */
  size?: 'default' | 'large' | undefined;
}

export interface RefreshControlProps
  extends RefreshControlPropsIOS, RefreshControlPropsAndroid {
  /**
   * Called when the view starts refreshing.
   */
  onRefresh?: (() => void) | undefined;

  /**
   * Whether the view should be indicating an active refresh.
   */
  refreshing: boolean;

  /**
   * Progress view top offset
   */
  progressViewOffset?: number | undefined;
}

/**
 * This component is used inside a ScrollView or ListView to add pull to refresh
 * functionality. When the ScrollView is at `scrollY: 0`, swiping down
 * triggers an `onRefresh` event.
 *
 * __Note:__ `refreshing` is a controlled prop, this is why it needs to be set to true
 * in the `onRefresh` function otherwise the refresh indicator will stop immediately.
 */
declare class RefreshControlComponent extends React.Component<RefreshControlProps> {}
declare const RefreshControlBase: Constructor<HostInstance> &
  typeof RefreshControlComponent;
export class RefreshControl extends RefreshControlBase {
  static SIZE: Object; // Undocumented
}
