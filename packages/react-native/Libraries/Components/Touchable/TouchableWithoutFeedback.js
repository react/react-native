/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AccessibilityActionEvent} from '../../Components/View/ViewAccessibility';
import type {EdgeInsetsOrSizeProp} from '../../StyleSheet/EdgeInsetsPropType';
import type {
  BlurEvent,
  FocusEvent,
  GestureResponderEvent,
  LayoutChangeEvent,
} from '../../Types/CoreEventTypes';

import View from '../../Components/View/View';
import {type AccessibilityProps} from '../../Components/View/ViewAccessibility';
import {PressabilityDebugView} from '../../Pressability/PressabilityDebug';
import usePressability from '../../Pressability/usePressability';
import {type ViewStyleProp} from '../../StyleSheet/StyleSheet';
import * as React from 'react';
import {cloneElement, useMemo} from 'react';

export type TouchableWithoutFeedbackPropsIOS = {};

export type TouchableWithoutFeedbackPropsAndroid = {
  /**
   * If true, doesn't play a system sound on touch.
   *
   * @platform android
   */
  touchSoundDisabled?: ?boolean,
};

/** @build-types emit-as-interface Expo compatibility */
export type TouchableWithoutFeedbackProps = Readonly<
  {
    children?: ?React.Node,
    /**
     * Delay in ms, from onPressIn, before onLongPress is called.
     */
    delayLongPress?: ?number,
    /**
     * Delay in ms, from the start of the touch, before onPressIn is called.
     */
    delayPressIn?: ?number,
    /**
     * Delay in ms, from the release of the touch, before onPressOut is called.
     */
    delayPressOut?: ?number,
    /**
     * If true, disable all interactions for this component.
     */
    disabled?: ?boolean,
    /**
     * Whether this View should be focusable with a non-touch input device,
     * eg. receive focus with a hardware keyboard / TV remote.
     */
    focusable?: ?boolean,
    /**
     * This defines how far your touch can start away from the button.
     * This is added to pressRetentionOffset when moving off of the button.
     * NOTE The touch area never extends past the parent view bounds and
     * the Z-index of sibling views always takes precedence if a touch hits
     * two overlapping views.
     */
    hitSlop?: ?EdgeInsetsOrSizeProp,
    /**
     * Used to reference react managed views from native code.
     */
    id?: string,
    importantForAccessibility?: ?(
      'auto' | 'yes' | 'no' | 'no-hide-descendants'
    ),
    nativeID?: ?string,
    onAccessibilityAction?: ?(event: AccessibilityActionEvent) => unknown,
    /**
     * When `accessible` is true (which is the default) this may be called when
     * the OS-specific concept of "blur" occurs, meaning the element lost focus.
     * Some platforms may not have the concept of blur.
     */
    onBlur?: ?(event: BlurEvent) => unknown,
    /**
     * When `accessible` is true (which is the default) this may be called when
     * the OS-specific concept of "focus" occurs. Some platforms may not have
     * the concept of focus.
     */
    onFocus?: ?(event: FocusEvent) => unknown,
    /**
     * Invoked on mount and layout changes with
     * {nativeEvent: {layout: {x, y, width, height}}}
     */
    onLayout?: ?(event: LayoutChangeEvent) => unknown,
    onLongPress?: ?(event: GestureResponderEvent) => unknown,
    /**
     * Called when the touch is released,
     * but not if cancelled (e.g. by a scroll that steals the responder lock).
     */
    onPress?: ?(event: GestureResponderEvent) => unknown,
    onPressIn?: ?(event: GestureResponderEvent) => unknown,
    onPressOut?: ?(event: GestureResponderEvent) => unknown,
    /**
     * When the scroll view is disabled, this defines how far your
     * touch may move off of the button, before deactivating the button.
     * Once deactivated, try moving it back and you'll see that the button
     * is once again reactivated! Move it back and forth several times
     * while the scroll view is disabled. Ensure you pass in a constant
     * to reduce memory allocations.
     */
    pressRetentionOffset?: ?EdgeInsetsOrSizeProp,
    rejectResponderTermination?: ?boolean,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID?: ?string,
    /**
     * //FIXME: not in doc but available in examples
     */
    style?: ?ViewStyleProp,
  } & TouchableWithoutFeedbackPropsAndroid &
    TouchableWithoutFeedbackPropsIOS &
    AccessibilityProps,
>;

const PASSTHROUGH_PROPS = [
  'accessibilityActions',
  'accessibilityElementsHidden',
  'accessibilityHint',
  'accessibilityLanguage',
  'accessibilityIgnoresInvertColors',
  'accessibilityLabel',
  'accessibilityLiveRegion',
  'accessibilityRole',
  'accessibilityValue',
  'aria-valuemax',
  'aria-valuemin',
  'aria-valuenow',
  'aria-valuetext',
  'accessibilityViewIsModal',
  'aria-modal',
  'hitSlop',
  'importantForAccessibility',
  'nativeID',
  'onAccessibilityAction',
  'onBlur',
  'onFocus',
  'onLayout',
  'testID',
] as const;

/**
 * Do not use unless you have a very good reason. All elements that respond to press should have a visual feedback when touched.
 *
 * Supports only one child. If you need more extensive and future-proof touch handling, use `Pressable`.
 *
 * @see https://reactnative.dev/docs/touchablewithoutfeedback
 */
export default function TouchableWithoutFeedback(
  props: TouchableWithoutFeedbackProps,
): React.Node {
  const {
    disabled,
    rejectResponderTermination,
    'aria-disabled': ariaDisabled,
    accessibilityState,
    hitSlop,
    delayLongPress,
    delayPressIn,
    delayPressOut,
    pressRetentionOffset,
    touchSoundDisabled,
    onBlur: _onBlur,
    onFocus: _onFocus,
    onLongPress,
    onPress,
    onPressIn,
    onPressOut,
  } = props;

  const pressabilityConfig = useMemo(
    () => ({
      cancelable: !rejectResponderTermination,
      disabled:
        disabled !== null
          ? disabled
          : (ariaDisabled ?? accessibilityState?.disabled),
      hitSlop: hitSlop,
      delayLongPress: delayLongPress,
      delayPressIn: delayPressIn,
      delayPressOut: delayPressOut,
      minPressDuration: 0,
      pressRectOffset: pressRetentionOffset,
      android_disableSound: touchSoundDisabled,
      onBlur: _onBlur,
      onFocus: _onFocus,
      onLongPress: onLongPress,
      onPress: onPress,
      onPressIn: onPressIn,
      onPressOut: onPressOut,
    }),
    [
      rejectResponderTermination,
      disabled,
      ariaDisabled,
      accessibilityState?.disabled,
      hitSlop,
      delayLongPress,
      delayPressIn,
      delayPressOut,
      pressRetentionOffset,
      touchSoundDisabled,
      _onBlur,
      _onFocus,
      onLongPress,
      onPress,
      onPressIn,
      onPressOut,
    ],
  );

  const eventHandlers = usePressability(pressabilityConfig);

  const element = React.Children.only<$FlowFixMe>(props.children);
  const children: Array<React.Node> = [element.props.children];
  const ariaLive = props['aria-live'];

  if (__DEV__) {
    if (element.type === View) {
      children.push(
        <PressabilityDebugView color="red" hitSlop={props.hitSlop} />,
      );
    }
  }

  let _accessibilityState = {
    busy: props['aria-busy'] ?? props.accessibilityState?.busy,
    checked: props['aria-checked'] ?? props.accessibilityState?.checked,
    disabled: props['aria-disabled'] ?? props.accessibilityState?.disabled,
    expanded: props['aria-expanded'] ?? props.accessibilityState?.expanded,
    selected: props['aria-selected'] ?? props.accessibilityState?.selected,
  };

  // BACKWARD-COMPATIBILITY: Focus and blur events were never supported before
  // adopting `Pressability`, so preserve that behavior.
  const {onBlur, onFocus, ...eventHandlersWithoutBlurAndFocus} = eventHandlers;

  const elementProps: {[string]: unknown, ...} = {
    ...eventHandlersWithoutBlurAndFocus,
    accessible: props.accessible !== false,
    accessibilityState:
      props.disabled != null
        ? {
            ..._accessibilityState,
            disabled: props.disabled,
          }
        : _accessibilityState,
    focusable:
      props.focusable !== false &&
      props.onPress !== undefined &&
      !props.disabled,

    accessibilityElementsHidden:
      props['aria-hidden'] ?? props.accessibilityElementsHidden,
    importantForAccessibility:
      props['aria-hidden'] === true
        ? 'no-hide-descendants'
        : props.importantForAccessibility,
    accessibilityLiveRegion:
      ariaLive === 'off' ? 'none' : (ariaLive ?? props.accessibilityLiveRegion),
    nativeID: props.id ?? props.nativeID,
  };

  for (const prop of PASSTHROUGH_PROPS) {
    if (props[prop] !== undefined) {
      elementProps[prop] = props[prop];
    }
  }

  // $FlowFixMe[incompatible-type]
  return cloneElement(element, elementProps, ...children);
}
