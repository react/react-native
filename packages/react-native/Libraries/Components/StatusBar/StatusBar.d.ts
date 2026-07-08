/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';

export type StatusBarStyle =
  'default' | 'auto' | 'light-content' | 'dark-content';

export type StatusBarAnimation = 'none' | 'fade' | 'slide';

export interface StatusBarPropsIOS {
  /**
   * The transition effect when showing and hiding the status bar using
   * the hidden prop. Defaults to 'fade'.
   *
   * @platform ios
   */
  showHideTransition?: null | 'fade' | 'slide' | 'none' | undefined;
}

export interface StatusBarProps extends StatusBarPropsIOS {
  /**
   * If the transition between status bar property changes should be
   * animated. Supported for barStyle and hidden.
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
