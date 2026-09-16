/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {Constructor} from '../../../private/Utilities';
import {TimerMixin} from '../../../private/TimerMixin';
import {StyleProp} from '../../StyleSheet/StyleSheet';
import {ViewStyle} from '../../StyleSheet/StyleSheetTypes';
import {ViewProps} from '../View/ViewPropTypes';

/**
 * It is a component to solve the common problem of views that need to move out of the way of the virtual keyboard.
 * It can automatically adjust either its position or bottom padding based on the position of the keyboard.
 */
declare class KeyboardAvoidingViewComponent extends React.Component<KeyboardAvoidingViewProps> {}
declare const KeyboardAvoidingViewBase: Constructor<TimerMixin> &
  typeof KeyboardAvoidingViewComponent;
export class KeyboardAvoidingView extends KeyboardAvoidingViewBase {}

export interface KeyboardAvoidingViewProps extends ViewProps {
  behavior?: 'height' | 'position' | 'padding' | undefined;

  /**
   * The style of the content container(View) when behavior is 'position'.
   */
  contentContainerStyle?: StyleProp<ViewStyle> | undefined;

  /**
   * This is the distance between the top of the user screen and the react native view,
   * may be non-zero in some use cases.
   */
  keyboardVerticalOffset?: number | undefined;

  /**
   * Enables or disables the KeyboardAvoidingView.
   *
   * Default is true
   */
  enabled?: boolean | undefined;
}
