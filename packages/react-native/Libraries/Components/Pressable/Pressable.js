/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from '../../../src/private/types/HostInstance';
import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';
import type {
  GestureResponderEvent,
  LayoutChangeEvent,
  MouseEvent,
} from '../../Types/CoreEventTypes';
import type {ViewProps} from '../View/ViewPropTypes';

import {PressabilityDebugView} from '../../Pressability/PressabilityDebug';
import usePressability from '../../Pressability/usePressability';
import {type RectOrSize} from '../../StyleSheet/Rect';
import useMergeRefs from '../../Utilities/useMergeRefs';
import View from '../View/View';
import useAndroidRippleForView, {
  type PressableAndroidRippleConfig,
} from './useAndroidRippleForView';
import * as React from 'react';
import {memo, useMemo, useRef, useState} from 'react';

export type PressableInstance = HostInstance;

export type {PressableAndroidRippleConfig};

export type PressableStateCallbackType = Readonly<{
  pressed: boolean,
}>;

type PressableBaseProps = Readonly<{
  /**
   * Whether a press gesture can be interrupted by a parent gesture such as a
   * scroll event. Defaults to true.
   */
  cancelable?: ?boolean,

  /**
   * Either children or a function that receives a boolean reflecting whether
   * the component is currently pressed.
   */
  children?: React.Node | ((state: PressableStateCallbackType) => React.Node),

  /**
   * Duration to wait after hover in before calling `onHoverIn`.
   *
   * @platform macos windows
   */
  delayHoverIn?: ?number,

  /**
   * Duration to wait after hover out before calling `onHoverOut`.
   *
   * @platform macos windows
   */
  delayHoverOut?: ?number,

  /**
   * Duration (in milliseconds) from `onPressIn` before `onLongPress` is called.
   *
   * @default `500`
   */
  delayLongPress?: ?number,

  /**
   * Whether the press behavior is disabled.
   *
   * @default `false`
   */
  disabled?: ?boolean,

  /**
   * Additional distance outside of this view in which a press is detected.
   */
  hitSlop?: ?RectOrSize,

  /**
   * Additional distance outside of this view in which a touch is considered a
   * press before `onPressOut` is triggered.
   *
   * @default `{bottom: 30, left: 20, right: 20, top: 20}`
   */
  pressRetentionOffset?: ?RectOrSize,

  /**
   * Called when this view's layout changes.
   */
  onLayout?: ?(event: LayoutChangeEvent) => unknown,

  /**
   * Called when the hover is activated.
   */
  onHoverIn?: ?(event: MouseEvent) => unknown,

  /**
   * Called when the hover is deactivated.
   */
  onHoverOut?: ?(event: MouseEvent) => unknown,

  /**
   * Called if the time after `onPressIn` lasts longer than `delayLongPress`.
   */
  onLongPress?: ?(event: GestureResponderEvent) => unknown,

  /**
   * Called after `onPressOut`.
   */
  onPress?: ?(event: GestureResponderEvent) => unknown,

  /**
   * Called immediately when a touch is engaged, before `onPressOut` and
   * `onPress`.
   */
  onPressIn?: ?(event: GestureResponderEvent) => unknown,

  /**
   * Called when the press location moves.
   */
  onPressMove?: ?(event: GestureResponderEvent) => unknown,

  /**
   * Called when a touch is released.
   */
  onPressOut?: ?(event: GestureResponderEvent) => unknown,

  /**
   * Whether to prevent any other native components from becoming responder
   * while this pressable is responder.
   */
  blockNativeResponder?: ?boolean,

  /**
   * Either view styles or a function that receives a boolean reflecting whether
   * the component is currently pressed and returns view styles.
   */
  style?:
    | ViewStyleProp
    | ((state: PressableStateCallbackType) => ViewStyleProp),

  /**
   * Identifier used to find this view in tests.
   */
  testID?: ?string,

  /**
   * If true, doesn't play Android system sound on press.
   *
   * @platform android
   * @default `false`
   */
  android_disableSound?: ?boolean,

  /**
   * Enables the Android ripple effect and configures its properties.
   *
   * @platform android
   */
  android_ripple?: ?PressableAndroidRippleConfig,

  /**
   * Used only for documentation or testing (e.g. snapshot testing).
   */
  testOnly_pressed?: ?boolean,

  /**
   * Duration (in milliseconds) to wait after press down before calling
   * `onPressIn`.
   */
  unstable_pressDelay?: ?number,
}>;

/** @build-types emit-as-interface Uniwind compatibility */
export type PressableProps = Readonly<{
  // Pressability may override `onMouseEnter` and `onMouseLeave` to
  // implement `onHoverIn` and `onHoverOut` in a platform-agnostic way.
  // Hover events should be used instead of mouse events.
  ...Omit<ViewProps, 'onMouseEnter' | 'onMouseLeave'>,
  ...PressableBaseProps,
}>;

/**
 * A Core Component wrapper that can detect various stages of press
 * interactions on any of its defined children.
 *
 * @see https://reactnative.dev/docs/pressable
 */
function Pressable({
  ref: forwardedRef,
  ...props
}: {
  ref?: React.RefSetter<PressableInstance>,
  ...PressableProps,
}): React.Node {
  const {
    accessible,
    accessibilityState,
    'aria-live': ariaLive,
    android_disableSound,
    android_ripple,
    'aria-busy': ariaBusy,
    'aria-checked': ariaChecked,
    'aria-disabled': ariaDisabled,
    'aria-expanded': ariaExpanded,
    'aria-label': ariaLabel,
    'aria-selected': ariaSelected,
    blockNativeResponder,
    cancelable,
    children,
    delayHoverIn,
    delayHoverOut,
    delayLongPress,
    disabled,
    focusable,
    hitSlop,
    onBlur,
    onFocus,
    onHoverIn,
    onHoverOut,
    onLongPress,
    onPress,
    onPressIn,
    onPressMove,
    onPressOut,
    pressRetentionOffset,
    style,
    testOnly_pressed,
    unstable_pressDelay,
    ...restProps
  } = props;

  const viewRef = useRef<PressableInstance | null>(null);
  const mergedRef = useMergeRefs(forwardedRef, viewRef);

  const android_rippleConfig = useAndroidRippleForView(android_ripple, viewRef);

  const [pressed, setPressed] = usePressState(testOnly_pressed === true);

  const shouldUpdatePressed =
    typeof children === 'function' || typeof style === 'function';

  let _accessibilityState = {
    busy: ariaBusy ?? accessibilityState?.busy,
    checked: ariaChecked ?? accessibilityState?.checked,
    disabled: ariaDisabled ?? accessibilityState?.disabled,
    expanded: ariaExpanded ?? accessibilityState?.expanded,
    selected: ariaSelected ?? accessibilityState?.selected,
  };

  _accessibilityState =
    disabled != null ? {..._accessibilityState, disabled} : _accessibilityState;

  const accessibilityValue = {
    max: props['aria-valuemax'] ?? props.accessibilityValue?.max,
    min: props['aria-valuemin'] ?? props.accessibilityValue?.min,
    now: props['aria-valuenow'] ?? props.accessibilityValue?.now,
    text: props['aria-valuetext'] ?? props.accessibilityValue?.text,
  };

  const accessibilityLiveRegion =
    ariaLive === 'off' ? 'none' : (ariaLive ?? props.accessibilityLiveRegion);

  const accessibilityLabel = ariaLabel ?? props.accessibilityLabel;
  const restPropsWithDefaults: React.ElementConfig<typeof View> = {
    ...restProps,
    ...android_rippleConfig?.viewProps,
    accessible: accessible !== false,
    accessibilityViewIsModal:
      restProps['aria-modal'] ?? restProps.accessibilityViewIsModal,
    accessibilityLiveRegion,
    accessibilityLabel,
    accessibilityState: _accessibilityState,
    focusable: focusable !== false,
    accessibilityValue,
    hitSlop,
  };

  const config = useMemo(
    () => ({
      cancelable,
      disabled,
      hitSlop,
      pressRectOffset: pressRetentionOffset,
      android_disableSound,
      delayHoverIn,
      delayHoverOut,
      delayLongPress,
      delayPressIn: unstable_pressDelay,
      onBlur,
      onFocus,
      onHoverIn,
      onHoverOut,
      onLongPress,
      onPress,
      onPressIn(event: GestureResponderEvent): void {
        if (android_rippleConfig != null) {
          android_rippleConfig.onPressIn(event);
        }
        shouldUpdatePressed && setPressed(true);
        if (onPressIn != null) {
          onPressIn(event);
        }
      },
      onPressMove(event: GestureResponderEvent): void {
        android_rippleConfig?.onPressMove(event);
        if (onPressMove != null) {
          onPressMove(event);
        }
      },
      onPressOut(event: GestureResponderEvent): void {
        if (android_rippleConfig != null) {
          android_rippleConfig.onPressOut(event);
        }
        shouldUpdatePressed && setPressed(false);
        if (onPressOut != null) {
          onPressOut(event);
        }
      },
      blockNativeResponder,
    }),
    [
      android_disableSound,
      android_rippleConfig,
      blockNativeResponder,
      cancelable,
      delayHoverIn,
      delayHoverOut,
      delayLongPress,
      disabled,
      hitSlop,
      onBlur,
      onFocus,
      onHoverIn,
      onHoverOut,
      onLongPress,
      onPress,
      onPressIn,
      onPressMove,
      onPressOut,
      pressRetentionOffset,
      setPressed,
      shouldUpdatePressed,
      unstable_pressDelay,
    ],
  );

  const eventHandlers = usePressability(config);

  return (
    <View
      {...restPropsWithDefaults}
      {...eventHandlers}
      ref={mergedRef}
      style={typeof style === 'function' ? style({pressed}) : style}
      collapsable={false}>
      {typeof children === 'function' ? children({pressed}) : children}
      {__DEV__ ? <PressabilityDebugView color="red" hitSlop={hitSlop} /> : null}
    </View>
  );
}

function usePressState(forcePressed: boolean): [boolean, (boolean) => void] {
  const [pressed, setPressed] = useState(false);
  return [pressed || forcePressed, setPressed];
}

const MemoedPressable = memo(Pressable);
MemoedPressable.displayName = 'Pressable';

export default MemoedPressable as component(
  ref?: React.RefSetter<PressableInstance>,
  ...props: PressableProps
);
