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

type PullToRefreshNativeProps = Readonly<{
  ...ViewProps,

  /**
   * The color of the refresh indicator.
   */
  tintColor?: ?ColorValue,
  /**
   * Title color.
   */
  titleColor?: ?ColorValue,
  /**
   * The title displayed under the refresh indicator.
   */
  title?: WithDefault<string, null>,
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

type ComponentType = HostComponent<PullToRefreshNativeProps>;

interface NativeCommands {
  readonly setNativeRefreshing: (
    viewRef: React.ElementRef<ComponentType>,
    refreshing: boolean,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['setNativeRefreshing'],
});

export default codegenNativeComponent<PullToRefreshNativeProps>(
  'PullToRefreshView',
  {
    paperComponentName: 'RCTRefreshControl',
    excludedPlatforms: ['android'],
  },
) as HostComponent<PullToRefreshNativeProps>;
