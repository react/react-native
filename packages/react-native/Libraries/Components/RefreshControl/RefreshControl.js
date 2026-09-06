/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {ViewProps} from '../View/ViewPropTypes';

import AndroidSwipeRefreshLayoutNativeComponent, {
  Commands as AndroidSwipeRefreshLayoutCommands,
} from './AndroidSwipeRefreshLayoutNativeComponent';
import PullToRefreshViewNativeComponent, {
  Commands as PullToRefreshCommands,
} from './PullToRefreshViewNativeComponent';
import * as React from 'react';
import {useCallback, useEffect, useRef, useState} from 'react';

const Platform = require('../../Utilities/Platform').default;

export type RefreshControlPropsIOS = Readonly<{
  /**
   * The color of the refresh indicator.
   *
   * @platform ios
   */
  tintColor?: ?ColorValue,

  /**
   * The title displayed under the refresh indicator.
   *
   * @platform ios
   */
  title?: ?string,

  /**
   * The color of the refresh indicator title.
   *
   * @platform ios
   */
  titleColor?: ?ColorValue,
}>;

export type RefreshControlPropsAndroid = Readonly<{
  /**
   * The colors (at least one) that will be used to draw the refresh indicator.
   *
   * @platform android
   */
  colors?: ?ReadonlyArray<ColorValue>,

  /**
   * Whether the pull to refresh functionality is enabled.
   *
   * @default `true`
   * @platform android
   */
  enabled?: ?boolean,

  /**
   * The background color of the refresh indicator.
   *
   * @platform android
   */
  progressBackgroundColor?: ?ColorValue,

  /**
   * Size of the refresh indicator.
   *
   * @platform android
   */
  size?: ?('default' | 'large'),
}>;

type RefreshControlBaseProps = Readonly<{
  /**
   * Called when the view starts refreshing.
   */
  onRefresh?: ?() => void | Promise<void>,

  /**
   * Whether the view should be indicating an active refresh.
   */
  refreshing: boolean,

  /**
   * Progress view top offset.
   *
   * @default `0`
   */
  progressViewOffset?: ?number,
}>;

export type RefreshControlProps = Readonly<{
  ...ViewProps,
  ...RefreshControlPropsIOS,
  ...RefreshControlPropsAndroid,
  ...RefreshControlBaseProps,
}>;

/**
 * Used inside a `ScrollView` to add pull to refresh functionality. When the
 * `ScrollView` is at `scrollY: 0`, swiping down triggers an `onRefresh` event.
 *
 * **Note:** `refreshing` is a controlled prop, this is why it needs to be set
 * to `true` in the `onRefresh` function otherwise the refresh indicator will
 * stop immediately.
 *
 * @see https://reactnative.dev/docs/refreshcontrol
 */
const RefreshControl: component(...RefreshControlProps) = ({
  // Android only props
  enabled,
  colors,
  progressBackgroundColor,
  size,
  // iOS only props
  tintColor,
  titleColor,
  title,
  // Common props
  onRefresh,
  refreshing,
  ...viewProps
}: RefreshControlProps): React.Node => {
  const ref =
    useRef<
      React.ElementRef<
        | typeof PullToRefreshViewNativeComponent
        | typeof AndroidSwipeRefreshLayoutNativeComponent,
      >,
    >(null);

  const [rerender, forceRerender] = useState(0);
  const nativeRefreshingState = useRef(refreshing);

  const handleRefresh = useCallback(() => {
    nativeRefreshingState.current = true; // Native state has changed to `true` on `onRefresh` callback.

    // $FlowFixMe[unused-promise]
    onRefresh?.();

    // The native component will start refreshing so force an update to
    // make sure it stays in sync with the js component.
    forceRerender(val => val + 1);
  }, [onRefresh]);

  // RefreshControl is a controlled component so if the native refreshing
  // value doesn't match the current js refreshing prop update it to
  // the js value.
  useEffect(() => {
    const viewRef = ref.current;
    if (!viewRef) {
      return;
    }

    //  Do nothing when a native state is the same as a `refreshing` prop
    if (nativeRefreshingState.current === refreshing) {
      return;
    }

    // Otherwise a JS component has to sync a native state with an actual `refreshing` value
    if (Platform.OS === 'android') {
      AndroidSwipeRefreshLayoutCommands.setNativeRefreshing(
        viewRef,
        refreshing,
      );
    } else {
      PullToRefreshCommands.setNativeRefreshing(viewRef, refreshing);
    }

    nativeRefreshingState.current = refreshing;
  }, [refreshing, rerender]);

  if (Platform.OS === 'ios') {
    return (
      <PullToRefreshViewNativeComponent
        {...viewProps}
        refreshing={refreshing}
        tintColor={tintColor}
        titleColor={titleColor}
        title={title}
        ref={ref}
        onRefresh={handleRefresh}
      />
    );
  }

  return (
    <AndroidSwipeRefreshLayoutNativeComponent
      {...viewProps}
      refreshing={refreshing}
      enabled={enabled}
      colors={colors}
      progressBackgroundColor={progressBackgroundColor}
      size={size}
      ref={ref}
      onRefresh={handleRefresh}
    />
  );
};

RefreshControl.displayName = 'RefreshControl';

export default RefreshControl;
