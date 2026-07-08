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
import {
  NativeSyntheticEvent,
  NativeTouchEvent,
} from '../../Types/CoreEventTypes';
import {ViewProps} from '../View/ViewPropTypes';

export interface DrawerSlideEvent extends NativeSyntheticEvent<NativeTouchEvent> {}

/**
 * DrawerLayoutAndroid is deprecated and will be removed in a future release.
 * Use `react-native-drawer-layout` instead.
 * @see https://reactnavigation.org/docs/drawer-layout/
 * @deprecated
 */
export interface DrawerLayoutAndroidProps extends ViewProps {
  /**
   * Specifies the background color of the drawer. The default value
   * is white. If you want to set the opacity of the drawer, use rgba.
   * Example:
   * return (
   *   <DrawerLayoutAndroid drawerBackgroundColor="rgba(0,0,0,0.5)">
   *   </DrawerLayoutAndroid>
   *);
   */
  drawerBackgroundColor?: ColorValue | undefined;

  /**
   * Specifies the lock mode of the drawer. The drawer can be locked
   * in 3 states:
   *
   * - unlocked (default), meaning that the drawer will respond
   *   (open/close) to touch gestures.
   *
   * - locked-closed, meaning that the drawer will stay closed and not
   *   respond to gestures.
   *
   * - locked-open, meaning that the drawer will stay opened and
   *   not respond to gestures. The drawer may still be opened and
   *   closed programmatically (openDrawer/closeDrawer).
   */
  drawerLockMode?: 'unlocked' | 'locked-closed' | 'locked-open' | undefined;

  /**
   * Specifies the side of the screen from which the drawer will slide in.
   * - 'left' (the default)
   * - 'right'
   */
  drawerPosition?: 'left' | 'right' | undefined;

  /**
   * Specifies the width of the drawer, more precisely the width of the
   * view that be pulled in from the edge of the window.
   */
  drawerWidth?: number | undefined;

  /**
   * Determines whether the keyboard gets dismissed in response to a drag.
   * - 'none' (the default), drags do not dismiss the keyboard.
   * - 'on-drag', the keyboard is dismissed when a drag begins.
   */
  keyboardDismissMode?: 'none' | 'on-drag' | undefined;

  /**
   * Function called whenever the navigation view has been closed.
   */
  onDrawerClose?: (() => void) | undefined;

  /**
   * Function called whenever the navigation view has been opened.
   */
  onDrawerOpen?: (() => void) | undefined;

  /**
   * Function called whenever there is an interaction with the navigation view.
   */
  onDrawerSlide?: ((event: DrawerSlideEvent) => void) | undefined;

  /**
   * Function called when the drawer state has changed.
   * The drawer can be in 3 states:
   * - idle, meaning there is no interaction with the navigation
   *   view happening at the time
   * - dragging, meaning there is currently an interaction with the
   *   navigation view
   * - settling, meaning that there was an interaction with the
   *   navigation view, and the navigation view is now finishing
   *   it's closing or opening animation
   */
  onDrawerStateChanged?:
    ((event: 'Idle' | 'Dragging' | 'Settling') => void) | undefined;

  /**
   * The navigation view that will be rendered to the side of the
   * screen and can be pulled in.
   */
  renderNavigationView: () => React.JSX.Element;

  /**
   * Make the drawer take the entire screen and draw the background of
   * the status bar to allow it to open over the status bar. It will
   * only have an effect on API 21+.
   */
  statusBarBackgroundColor?: ColorValue | undefined;
}

interface DrawerPosition {
  Left: number;
  Right: number;
}

declare class DrawerLayoutAndroidComponent extends React.Component<DrawerLayoutAndroidProps> {}
declare const DrawerLayoutAndroidBase: Constructor<HostInstance> &
  typeof DrawerLayoutAndroidComponent;
/**
 * DrawerLayoutAndroid is deprecated and will be removed in a future release.
 * Use `react-native-drawer-layout` instead.
 * @see https://reactnavigation.org/docs/drawer-layout/
 * @deprecated
 */
export class DrawerLayoutAndroid extends DrawerLayoutAndroidBase {
  /**
   * drawer's positions.
   */
  positions: DrawerPosition;

  /**
   * Opens the drawer.
   */
  openDrawer(): void;

  /**
   * Closes the drawer.
   */
  closeDrawer(): void;
}
