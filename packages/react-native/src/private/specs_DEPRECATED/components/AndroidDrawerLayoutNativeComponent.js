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
  DirectEventHandler,
  Float,
  Int32,
  WithDefault,
} from '../../../../Libraries/Types/CodegenTypes';
import type {HostComponent} from '../../types/HostComponent';

import codegenNativeCommands from '../../../../Libraries/Utilities/codegenNativeCommands';
import codegenNativeComponent from '../../../../Libraries/Utilities/codegenNativeComponent';
import * as React from 'react';

type DrawerStateEvent = Readonly<{
  drawerState: Int32,
}>;

type DrawerSlideEvent = Readonly<{
  offset: Float,
}>;

type AndroidDrawerLayoutNativeProps = Readonly<{
  ...ViewProps,
  /**
   * Determines whether the keyboard gets dismissed in response to a drag.
   *   - 'none' (the default), drags do not dismiss the keyboard.
   *   - 'on-drag', the keyboard is dismissed when a drag begins.
   */
  keyboardDismissMode?: WithDefault<'none' | 'on-drag', 'none'>,

  /**
   * Specifies the background color of the drawer. The default value is white.
   * If you want to set the opacity of the drawer, use rgba. Example:
   *
   * ```
   * return (
   *   <DrawerLayoutAndroid drawerBackgroundColor="rgba(0,0,0,0.5)">
   *   </DrawerLayoutAndroid>
   * );
   * ```
   */
  drawerBackgroundColor: ColorValue,

  /**
   * Specifies the side of the screen from which the drawer will slide in.
   */
  drawerPosition?: WithDefault<'left' | 'right', 'left'>,

  /**
   * Specifies the width of the drawer, more precisely the width of the view that be pulled in
   * from the edge of the window.
   */

  drawerWidth?: WithDefault<Float, null>,

  /**
   * Specifies the lock mode of the drawer. The drawer can be locked in 3 states:
   * - unlocked (default), meaning that the drawer will respond (open/close) to touch gestures.
   * - locked-closed, meaning that the drawer will stay closed and not respond to gestures.
   * - locked-open, meaning that the drawer will stay opened and not respond to gestures.
   * The drawer may still be opened and closed programmatically (`openDrawer`/`closeDrawer`).
   */
  drawerLockMode?: WithDefault<
    'unlocked' | 'locked-closed' | 'locked-open',
    'unlocked',
  >,

  /**
   * Function called whenever there is an interaction with the navigation view.
   */
  onDrawerSlide?: ?DirectEventHandler<DrawerSlideEvent>,

  /**
   * Function called when the drawer state has changed. The drawer can be in 3 states:
   * - Idle, meaning there is no interaction with the navigation view happening at the time
   * - Dragging, meaning there is currently an interaction with the navigation view
   * - Settling, meaning that there was an interaction with the navigation view, and the
   * navigation view is now finishing its closing or opening animation
   */
  onDrawerStateChanged?: ?DirectEventHandler<DrawerStateEvent>,

  /**
   * Function called whenever the navigation view has been opened.
   */
  onDrawerOpen?: ?DirectEventHandler<null>,

  /**
   * Function called whenever the navigation view has been closed.
   */
  onDrawerClose?: ?DirectEventHandler<null>,

  /**
   * Make the drawer take the entire screen and draw the background of the
   * status bar to allow it to open over the status bar. It will only have an
   * effect on API 21+.
   */
  statusBarBackgroundColor?: ?ColorValue,
}>;

type NativeType = HostComponent<AndroidDrawerLayoutNativeProps>;

interface NativeCommands {
  readonly openDrawer: (viewRef: React.ElementRef<NativeType>) => void;
  readonly closeDrawer: (viewRef: React.ElementRef<NativeType>) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['openDrawer', 'closeDrawer'],
});

export default codegenNativeComponent<AndroidDrawerLayoutNativeProps>(
  'AndroidDrawerLayout',
) as NativeType;
