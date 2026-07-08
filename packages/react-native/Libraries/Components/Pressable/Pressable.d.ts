/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {Insets} from '../../../types/public/Insets';
import {ColorValue, StyleProp} from '../../StyleSheet/StyleSheet';
import {ViewStyle} from '../../StyleSheet/StyleSheetTypes';
import {
  GestureResponderEvent,
  MouseEvent,
  NativeSyntheticEvent,
  TargetedEvent,
} from '../../Types/CoreEventTypes';
import {View} from '../View/View';
import {AccessibilityProps} from '../View/ViewAccessibility';
import {ViewProps} from '../View/ViewPropTypes';

export interface PressableStateCallbackType {
  readonly pressed: boolean;
}

export interface PressableAndroidRippleConfig {
  color?: null | ColorValue | undefined;
  borderless?: null | boolean | undefined;
  radius?: null | number | undefined;
  foreground?: null | boolean | undefined;
  alpha?: null | number | undefined;
}

export interface PressableProps
  extends
    AccessibilityProps,
    Omit<ViewProps, 'children' | 'style' | 'hitSlop'> {
  /**
   * Called when the hover is activated to provide visual feedback.
   */
  onHoverIn?: null | ((event: MouseEvent) => void) | undefined;

  /**
   * Called when the hover is deactivated to undo visual feedback.
   */
  onHoverOut?: null | ((event: MouseEvent) => void) | undefined;

  /**
   * Called when a single tap gesture is detected.
   */
  onPress?: null | ((event: GestureResponderEvent) => void) | undefined;

  /**
   * Called when a touch is engaged before `onPress`.
   */
  onPressIn?: null | ((event: GestureResponderEvent) => void) | undefined;

  /**
   * Called when the press location moves.
   */
  onPressMove?: null | ((event: GestureResponderEvent) => void) | undefined;

  /**
   * Called when a touch is released before `onPress`.
   */
  onPressOut?: null | ((event: GestureResponderEvent) => void) | undefined;

  /**
   * Called when a long-tap gesture is detected.
   */
  onLongPress?: null | ((event: GestureResponderEvent) => void) | undefined;

  /**
   * Called after the element loses focus.
   * @platform macos windows
   */
  onBlur?:
    null | ((event: NativeSyntheticEvent<TargetedEvent>) => void) | undefined;

  /**
   * Called after the element is focused.
   * @platform macos windows
   */
  onFocus?:
    null | ((event: NativeSyntheticEvent<TargetedEvent>) => void) | undefined;

  /**
   * Either children or a render prop that receives a boolean reflecting whether
   * the component is currently pressed.
   */
  children?:
    | React.ReactNode
    | ((state: PressableStateCallbackType) => React.ReactNode)
    | undefined;

  /**
   * Whether a press gesture can be interrupted by a parent gesture such as a
   * scroll event. Defaults to true.
   */
  cancelable?: null | boolean | undefined;

  /**
   * Duration to wait after hover in before calling `onHoverIn`.
   * @platform macos windows
   */
  delayHoverIn?: number | null | undefined;

  /**
   * Duration to wait after hover out before calling `onHoverOut`.
   * @platform macos windows
   */
  delayHoverOut?: number | null | undefined;

  /**
   * Duration (in milliseconds) from `onPressIn` before `onLongPress` is called.
   */
  delayLongPress?: null | number | undefined;

  /**
   * Whether the press behavior is disabled.
   */
  disabled?: null | boolean | undefined;

  /**
   * Additional distance outside of this view in which a press is detected.
   */
  hitSlop?: null | Insets | number | undefined;

  /**
   * Additional distance outside of this view in which a touch is considered a
   * press before `onPressOut` is triggered.
   */
  pressRetentionOffset?: null | Insets | number | undefined;

  /**
   * If true, doesn't play system sound on touch.
   */
  android_disableSound?: null | boolean | undefined;

  /**
   * Enables the Android ripple effect and configures its color.
   */
  android_ripple?: null | PressableAndroidRippleConfig | undefined;

  /**
   * Used only for documentation or testing (e.g. snapshot testing).
   */
  testOnly_pressed?: null | boolean | undefined;

  /**
   * Either view styles or a function that receives a boolean reflecting whether
   * the component is currently pressed and returns view styles.
   */
  style?:
    | StyleProp<ViewStyle>
    | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>)
    | undefined;

  /**
   * Duration (in milliseconds) to wait after press down before calling onPressIn.
   */
  unstable_pressDelay?: number | undefined;
}

// TODO use React.AbstractComponent when available
export const Pressable: React.ForwardRefExoticComponent<
  PressableProps & React.RefAttributes<View>
>;
