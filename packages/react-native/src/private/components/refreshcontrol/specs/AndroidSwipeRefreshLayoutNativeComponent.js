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
import type {ColorValue} from '../../../../../Libraries/StyleSheet/StyleSheet';
import type {
  DirectEventHandler,
  Float,
  WithDefault,
} from '../../../../../Libraries/Types/CodegenTypes';
import type {HostComponent} from '../../../types/HostComponent';

import codegenNativeCommands from '../../../../../Libraries/Utilities/codegenNativeCommands';
import codegenNativeComponent from '../../../../../Libraries/Utilities/codegenNativeComponent';
import * as React from 'react';

type AndroidSwipeRefreshLayoutNativeProps = Readonly<{
  ...ViewProps,

  /**
   * Whether the pull to refresh functionality is enabled.
   */
  enabled?: WithDefault<boolean, true>,
  /**
   * The colors (at least one) that will be used to draw the refresh indicator.
   */
  colors?: ?ReadonlyArray<ColorValue>,
  /**
   * The background color of the refresh indicator.
   */
  progressBackgroundColor?: ?ColorValue,
  /**
   * Size of the refresh indicator.
   */
  size?: WithDefault<'default' | 'large', 'default'>,
  /**
   * Progress view top offset
   */
  progressViewOffset?: WithDefault<Float, 0>,

  /**
   * Called when the view starts refreshing.
   */
  onRefresh?: ?DirectEventHandler<null>,

  /**
   * Whether the view should be indicating an active refresh.
   */
  refreshing: boolean,
}>;

type NativeType = HostComponent<AndroidSwipeRefreshLayoutNativeProps>;

interface NativeCommands {
  readonly setNativeRefreshing: (
    viewRef: React.ElementRef<NativeType>,
    value: boolean,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['setNativeRefreshing'],
});

export default codegenNativeComponent<AndroidSwipeRefreshLayoutNativeProps>(
  'AndroidSwipeRefreshLayout',
) as NativeType;
