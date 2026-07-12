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
import {TimerMixin} from '../../../types/private/TimerMixin';
import {Insets} from '../../../types/public/Insets';
import {StyleProp} from '../../StyleSheet/StyleSheet';
import {ViewStyle} from '../../StyleSheet/StyleSheetTypes';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  TargetedEvent,
} from '../../Types/CoreEventTypes';
import {AccessibilityProps} from '../View/ViewAccessibility';
import {TouchableMixin} from './Touchable';

export interface TouchableWithoutFeedbackPropsIOS {}

export interface TouchableWithoutFeedbackPropsAndroid {
  /**
   * If true, doesn't play a system sound on touch.
   *
   * @platform android
   */
  touchSoundDisabled?: boolean | undefined;
}

/**
 * @see https://reactnative.dev/docs/touchablewithoutfeedback#props
 */
export interface TouchableWithoutFeedbackProps
  extends
    TouchableWithoutFeedbackPropsIOS,
    TouchableWithoutFeedbackPropsAndroid,
    AccessibilityProps {
  children?: React.ReactNode | undefined;

  rejectResponderTermination?: boolean | undefined;

  /**
   * Delay in ms, from onPressIn, before onLongPress is called.
   */
  delayLongPress?: number | undefined;

  /**
   * Delay in ms, from the start of the touch, before onPressIn is called.
   */
  delayPressIn?: number | undefined;

  /**
   * Delay in ms, from the release of the touch, before onPressOut is called.
   */
  delayPressOut?: number | undefined;

  /**
   * If true, disable all interactions for this component.
   */
  disabled?: boolean | undefined;

  /**
   * Whether this View should be focusable with a non-touch input device,
   * eg. receive focus with a hardware keyboard / TV remote.
   */
  focusable?: boolean | undefined;

  /**
   * This defines how far your touch can start away from the button.
   * This is added to pressRetentionOffset when moving off of the button.
   * NOTE The touch area never extends past the parent view bounds and
   * the Z-index of sibling views always takes precedence if a touch hits
   * two overlapping views.
   */
  hitSlop?: null | Insets | number | undefined;

  /**
   * Used to reference react managed views from native code.
   */
  id?: string | undefined;

  /**
   * When `accessible` is true (which is the default) this may be called when
   * the OS-specific concept of "blur" occurs, meaning the element lost focus.
   * Some platforms may not have the concept of blur.
   */
  onBlur?: ((e: NativeSyntheticEvent<TargetedEvent>) => void) | undefined;

  /**
   * When `accessible` is true (which is the default) this may be called when
   * the OS-specific concept of "focus" occurs. Some platforms may not have
   * the concept of focus.
   */
  onFocus?: ((e: NativeSyntheticEvent<TargetedEvent>) => void) | undefined;

  /**
   * Invoked on mount and layout changes with
   * {nativeEvent: {layout: {x, y, width, height}}}
   */
  onLayout?: ((event: LayoutChangeEvent) => void) | undefined;

  onLongPress?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * Called when the touch is released,
   * but not if cancelled (e.g. by a scroll that steals the responder lock).
   */
  onPress?: ((event: GestureResponderEvent) => void) | undefined;

  onPressIn?: ((event: GestureResponderEvent) => void) | undefined;

  onPressOut?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * //FIXME: not in doc but available in examples
   */
  style?: StyleProp<ViewStyle> | undefined;

  /**
   * When the scroll view is disabled, this defines how far your
   * touch may move off of the button, before deactivating the button.
   * Once deactivated, try moving it back and you'll see that the button
   * is once again reactivated! Move it back and forth several times
   * while the scroll view is disabled. Ensure you pass in a constant
   * to reduce memory allocations.
   */
  pressRetentionOffset?: null | Insets | number | undefined;

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: string | undefined;
}

/**
 * Do not use unless you have a very good reason.
 * All the elements that respond to press should have a visual feedback when touched.
 * This is one of the primary reason a "web" app doesn't feel "native".
 *
 * @see https://reactnative.dev/docs/touchablewithoutfeedback
 */
declare class TouchableWithoutFeedbackComponent extends React.Component<TouchableWithoutFeedbackProps> {}
declare const TouchableWithoutFeedbackBase: Constructor<TimerMixin> &
  Constructor<TouchableMixin> &
  typeof TouchableWithoutFeedbackComponent;
export class TouchableWithoutFeedback extends TouchableWithoutFeedbackBase {}
