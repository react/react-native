/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {ColorValue} from '../../StyleSheet/StyleSheet';

export type StatusBarStyle =
  | 'default'
  | 'auto'
  | 'light-content'
  | 'dark-content';

export type StatusBarAnimation = 'none' | 'fade' | 'slide';

export interface StatusBarPropsIOS {
  /**
   * If the network activity indicator should be visible.
   *
   * @platform ios
   */
  networkActivityIndicatorVisible?: boolean | undefined;

  /**
   * The transition effect when showing and hiding the status bar using
   * the hidden prop. Defaults to 'fade'.
   *
   * @platform ios
   */
  showHideTransition?: null | 'fade' | 'slide' | 'none' | undefined;
}

export interface StatusBarPropsAndroid {
  /**
   * The background color of the status bar.
   *
   * Please note that this prop has no effect on Android 15+
   *
   * @platform android
   */
  backgroundColor?: ColorValue | undefined;

  /**
   * If the status bar is translucent. When translucent is set to true,
   * the app will draw under the status bar. This is useful when using a
   * semi transparent status bar color.
   *
   * Please note that this prop has no effect on Android 15+
   *
   * @platform android
   */
  translucent?: boolean | undefined;
}

export interface StatusBarProps
  extends StatusBarPropsIOS,
    StatusBarPropsAndroid {
  /**
   * If the transition between status bar property changes should be
   * animated. Supported for backgroundColor, barStyle and hidden.
   */
  animated?: boolean | undefined;

  /**
   * Sets the color of the status bar text.
   */
  barStyle?: null | StatusBarStyle | undefined;

  /**
   * If the status bar is hidden.
   */
  hidden?: boolean | undefined;
}

export class StatusBar extends React.Component<StatusBarProps> {
  /**
   * The current height of the status bar on the device.
   * @platform android
   */
  static currentHeight?: number | undefined;

  /**
   * Show or hide the status bar
   * @param hidden The dialog's title.
   * @param animation Optional animation when
   *    changing the status bar hidden property.
   */
  static setHidden: (hidden: boolean, animation?: StatusBarAnimation) => void;

  /**
   * Set the status bar style
   * @param style Status bar style to set
   * @param animated Animate the style change.
   */
  static setBarStyle: (style: StatusBarStyle, animated?: boolean) => void;

  /**
   * Control the visibility of the network activity indicator
   * @param visible Show the indicator.
   */
  static setNetworkActivityIndicatorVisible: (visible: boolean) => void;

  /**
   * Set the background color for the status bar
   * @param color Background color.
   * @param animated Animate the style change.
   */
  static setBackgroundColor: (color: ColorValue, animated?: boolean) => void;

  /**
   * Control the translucency of the status bar
   * @param translucent Set as translucent.
   */
  static setTranslucent: (translucent: boolean) => void;

  /**
   * Push a StatusBar entry onto the stack.
   * The return value should be passed to `popStackEntry` when complete.
   *
   * @param props Object containing the StatusBar props to use in the stack entry.
   */
  static pushStackEntry: (props: StatusBarProps) => StatusBarProps;

  /**
   * Pop a StatusBar entry from the stack.
   *
   * @param entry Entry returned from `pushStackEntry`.
   */
  static popStackEntry: (entry: StatusBarProps) => void;

  /**
   * Replace an existing StatusBar stack entry with new props.
   *
   * @param entry Entry returned from `pushStackEntry` to replace.
   * @param props Object containing the StatusBar props to use in the replacement stack entry.
   */
  static replaceStackEntry: (
    entry: StatusBarProps,
    props: StatusBarProps,
  ) => StatusBarProps;
}
