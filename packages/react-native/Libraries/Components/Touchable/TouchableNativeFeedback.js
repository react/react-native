/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ProcessedColorValue} from '../../StyleSheet/processColor';
import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {GestureResponderEvent} from '../../Types/CoreEventTypes';
import type {TouchableWithoutFeedbackProps} from './TouchableWithoutFeedback';

import View from '../../Components/View/View';
import Pressability, {
  type PressabilityConfig,
} from '../../Pressability/Pressability';
import {PressabilityDebugView} from '../../Pressability/PressabilityDebug';
import {findHostInstance_DEPRECATED} from '../../ReactNative/RendererProxy';
import processColor from '../../StyleSheet/processColor';
import Platform from '../../Utilities/Platform';
import {Commands} from '../View/ViewNativeComponent';
import * as React from 'react';
import {cloneElement} from 'react';

type TouchableNativeFeedbackTVProps = {
  /**
   * *(Apple TV only)* TV preferred focus (see documentation for the View component).
   *
   * @platform ios
   * @deprecated Use `focusable` instead
   */
  hasTVPreferredFocus?: ?boolean,

  /**
   * Designates the next view to receive focus when the user navigates down. See the Android documentation.
   *
   * @platform android
   */
  nextFocusDown?: ?number,

  /**
   * Designates the next view to receive focus when the user navigates forward. See the Android documentation.
   *
   * @platform android
   */
  nextFocusForward?: ?number,

  /**
   * Designates the next view to receive focus when the user navigates left. See the Android documentation.
   *
   * @platform android
   */
  nextFocusLeft?: ?number,

  /**
   * Designates the next view to receive focus when the user navigates right. See the Android documentation.
   *
   * @platform android
   */
  nextFocusRight?: ?number,

  /**
   * Designates the next view to receive focus when the user navigates up. See the Android documentation.
   *
   * @platform android
   */
  nextFocusUp?: ?number,
};

export type TouchableNativeFeedbackProps = Readonly<{
  ...TouchableWithoutFeedbackProps,
  ...TouchableNativeFeedbackTVProps,
  /**
   * Determines the type of background drawable used to display touch feedback. Use one of the static methods to generate this value:
   *
   * - `TouchableNativeFeedback.SelectableBackground()` - Default background for selectable elements.
   * - `TouchableNativeFeedback.SelectableBackgroundBorderless()` - Default background for borderless selectable elements. API 21+.
   * - `TouchableNativeFeedback.Ripple(color, borderless)` - Ripple drawable with the specified color.
   */
  background?: ?(
    | Readonly<{
        type: 'ThemeAttrAndroid',
        attribute:
          'selectableItemBackground' | 'selectableItemBackgroundBorderless',
        rippleRadius: ?number,
      }>
    | Readonly<{
        type: 'RippleAndroid',
        color: ?ProcessedColorValue,
        borderless: boolean,
        rippleRadius: ?number,
      }>
  ),
  /**
   * If `true`, adds the ripple effect to the foreground of the view instead of the background. Useful if a child view has its own background, or you are displaying images.
   *
   * Check `TouchableNativeFeedback.canUseNativeForeground()` first, as this is only available on Android 6.0 and above. On older versions, this falls back to background.
   */
  useForeground?: ?boolean,
}>;

type TouchableNativeFeedbackState = Readonly<{
  pressability: Pressability,
}>;

/**
 * A wrapper for making views respond properly to touches (Android only). Uses native state drawable to display touch feedback.
 *
 * Supports only a single View instance as a child. If you need more extensive and future-proof touch handling, use `Pressable`.
 *
 * @see https://reactnative.dev/docs/touchablenativefeedback
 * @platform android
 */
class TouchableNativeFeedback extends React.Component<
  TouchableNativeFeedbackProps,
  TouchableNativeFeedbackState,
> {
  /**
   * Creates an object that represents android theme's default background for
   * selectable elements (?android:attr/selectableItemBackground).
   *
   * @param rippleRadius The radius of ripple effect
   */
  static SelectableBackground: (rippleRadius?: ?number) => Readonly<{
    attribute: 'selectableItemBackground',
    type: 'ThemeAttrAndroid',
    rippleRadius: ?number,
  }> = (rippleRadius?: ?number) => ({
    type: 'ThemeAttrAndroid',
    attribute: 'selectableItemBackground',
    rippleRadius,
  });

  /**
   * Creates an object that represent android theme's default background for borderless
   * selectable elements (?android:attr/selectableItemBackgroundBorderless).
   * Available on android API level 21+.
   *
   * @param rippleRadius The radius of ripple effect
   */
  static SelectableBackgroundBorderless: (rippleRadius?: ?number) => Readonly<{
    attribute: 'selectableItemBackgroundBorderless',
    type: 'ThemeAttrAndroid',
    rippleRadius: ?number,
  }> = (rippleRadius?: ?number) => ({
    type: 'ThemeAttrAndroid',
    attribute: 'selectableItemBackgroundBorderless',
    rippleRadius,
  });

  /**
   * Creates an object that represents ripple drawable with specified color (as a
   * string). If property `borderless` evaluates to true the ripple will
   * render outside of the view bounds (see native actionbar buttons as an
   * example of that behavior). This background type is available on Android
   * API level 21+.
   *
   * @param color The ripple color
   * @param borderless If the ripple can render outside it's bounds
   * @param rippleRadius The radius of ripple effect
   */
  static Ripple: (
    color: ColorValue,
    borderless: boolean,
    rippleRadius?: ?number,
  ) => Readonly<{
    borderless: boolean,
    color: ?ProcessedColorValue,
    rippleRadius: ?number,
    type: 'RippleAndroid',
  }> = (color: ColorValue, borderless: boolean, rippleRadius?: ?number) => {
    const processedColor = processColor(color);
    return {
      type: 'RippleAndroid',
      color: processedColor,
      borderless,
      rippleRadius,
    };
  };

  /**
   * Whether `useForeground` is supported.
   */
  static canUseNativeForeground: () => boolean = () =>
    Platform.OS === 'android';

  state: TouchableNativeFeedbackState = {
    pressability: new Pressability(this._createPressabilityConfig()),
  };

  _createPressabilityConfig(): PressabilityConfig {
    const accessibilityStateDisabled =
      this.props['aria-disabled'] ?? this.props.accessibilityState?.disabled;
    return {
      cancelable: !this.props.rejectResponderTermination,
      disabled:
        this.props.disabled != null
          ? this.props.disabled
          : accessibilityStateDisabled,
      hitSlop: this.props.hitSlop,
      delayLongPress: this.props.delayLongPress,
      delayPressIn: this.props.delayPressIn,
      delayPressOut: this.props.delayPressOut,
      minPressDuration: 0,
      pressRectOffset: this.props.pressRetentionOffset,
      android_disableSound: this.props.touchSoundDisabled,
      onLongPress: this.props.onLongPress,
      onPress: this.props.onPress,
      onPressIn: event => {
        if (Platform.OS === 'android') {
          this._dispatchHotspotUpdate(event);
          this._dispatchPressedStateChange(true);
        }
        if (this.props.onPressIn != null) {
          this.props.onPressIn(event);
        }
      },
      onPressMove: event => {
        if (Platform.OS === 'android') {
          this._dispatchHotspotUpdate(event);
        }
      },
      onPressOut: event => {
        if (Platform.OS === 'android') {
          this._dispatchPressedStateChange(false);
        }
        if (this.props.onPressOut != null) {
          this.props.onPressOut(event);
        }
      },
    };
  }

  _dispatchPressedStateChange(pressed: boolean): void {
    if (Platform.OS === 'android') {
      const hostComponentRef = findHostInstance_DEPRECATED<$FlowFixMe>(this);
      if (hostComponentRef == null) {
        console.warn(
          'Touchable: Unable to find HostComponent instance. ' +
            'Has your Touchable component been unmounted?',
        );
      } else {
        Commands.setPressed(hostComponentRef, pressed);
      }
    }
  }

  _dispatchHotspotUpdate(event: GestureResponderEvent): void {
    if (Platform.OS === 'android') {
      const {locationX, locationY} = event.nativeEvent;
      const hostComponentRef = findHostInstance_DEPRECATED<$FlowFixMe>(this);
      if (hostComponentRef == null) {
        console.warn(
          'Touchable: Unable to find HostComponent instance. ' +
            'Has your Touchable component been unmounted?',
        );
      } else {
        Commands.hotspotUpdate(
          hostComponentRef,
          locationX ?? 0,
          locationY ?? 0,
        );
      }
    }
  }

  render(): React.Node {
    const element = React.Children.only<$FlowFixMe>(this.props.children);
    const children: Array<React.Node> = [element.props.children];
    if (__DEV__) {
      if (element.type === View) {
        children.push(
          <PressabilityDebugView color="brown" hitSlop={this.props.hitSlop} />,
        );
      }
    }

    // BACKWARD-COMPATIBILITY: Focus and blur events were never supported before
    // adopting `Pressability`, so preserve that behavior.
    const {onBlur, onFocus, ...eventHandlersWithoutBlurAndFocus} =
      this.state.pressability.getEventHandlers();

    let _accessibilityState = {
      busy: this.props['aria-busy'] ?? this.props.accessibilityState?.busy,
      checked:
        this.props['aria-checked'] ?? this.props.accessibilityState?.checked,
      disabled:
        this.props['aria-disabled'] ?? this.props.accessibilityState?.disabled,
      expanded:
        this.props['aria-expanded'] ?? this.props.accessibilityState?.expanded,
      selected:
        this.props['aria-selected'] ?? this.props.accessibilityState?.selected,
    };

    _accessibilityState =
      this.props.disabled != null
        ? {
            ..._accessibilityState,
            disabled: this.props.disabled,
          }
        : _accessibilityState;

    const accessibilityValue = {
      max: this.props['aria-valuemax'] ?? this.props.accessibilityValue?.max,
      min: this.props['aria-valuemin'] ?? this.props.accessibilityValue?.min,
      now: this.props['aria-valuenow'] ?? this.props.accessibilityValue?.now,
      text: this.props['aria-valuetext'] ?? this.props.accessibilityValue?.text,
    };

    const accessibilityLiveRegion =
      this.props['aria-live'] === 'off'
        ? 'none'
        : (this.props['aria-live'] ?? this.props.accessibilityLiveRegion);

    const accessibilityLabel =
      this.props['aria-label'] ?? this.props.accessibilityLabel;
    return cloneElement(
      element,
      {
        ...eventHandlersWithoutBlurAndFocus,
        ...getBackgroundProp(
          this.props.background === undefined
            ? TouchableNativeFeedback.SelectableBackground()
            : this.props.background,
          this.props.useForeground === true,
        ),
        accessible: this.props.accessible !== false,
        accessibilityHint: this.props.accessibilityHint,
        accessibilityLanguage: this.props.accessibilityLanguage,
        accessibilityLabel: accessibilityLabel,
        accessibilityRole: this.props.accessibilityRole,
        accessibilityState: _accessibilityState,
        accessibilityActions: this.props.accessibilityActions,
        onAccessibilityAction: this.props.onAccessibilityAction,
        accessibilityValue: accessibilityValue,
        importantForAccessibility:
          this.props['aria-hidden'] === true
            ? 'no-hide-descendants'
            : this.props.importantForAccessibility,
        accessibilityViewIsModal:
          this.props['aria-modal'] ?? this.props.accessibilityViewIsModal,
        accessibilityLiveRegion: accessibilityLiveRegion,
        accessibilityElementsHidden:
          this.props['aria-hidden'] ?? this.props.accessibilityElementsHidden,
        hasTVPreferredFocus: this.props.hasTVPreferredFocus,
        hitSlop: this.props.hitSlop,
        focusable:
          this.props.focusable !== false &&
          this.props.onPress !== undefined &&
          !this.props.disabled,
        nativeID: this.props.id ?? this.props.nativeID,
        nextFocusDown: this.props.nextFocusDown,
        nextFocusForward: this.props.nextFocusForward,
        nextFocusLeft: this.props.nextFocusLeft,
        nextFocusRight: this.props.nextFocusRight,
        nextFocusUp: this.props.nextFocusUp,
        onLayout: this.props.onLayout,
        testID: this.props.testID,
      },
      ...children,
    );
  }

  componentDidUpdate(
    prevProps: TouchableNativeFeedbackProps,
    prevState: TouchableNativeFeedbackState,
  ) {
    this.state.pressability.configure(this._createPressabilityConfig());
  }

  componentDidMount(): unknown {
    this.state.pressability.configure(this._createPressabilityConfig());
  }

  componentWillUnmount(): void {
    this.state.pressability.reset();
  }
}

const getBackgroundProp =
  Platform.OS === 'android'
    ? /* $FlowFixMe[missing-local-annot] The type annotation(s) required by
       * Flow's LTI update could not be added via codemod */
      (background, useForeground: boolean) =>
        useForeground && TouchableNativeFeedback.canUseNativeForeground()
          ? {nativeForegroundAndroid: background}
          : {nativeBackgroundAndroid: background}
    : /* $FlowFixMe[missing-local-annot] The type annotation(s) required by
       * Flow's LTI update could not be added via codemod */
      (background, useForeground: boolean) => null;

TouchableNativeFeedback.displayName = 'TouchableNativeFeedback';

export type TouchableNativeFeedbackInstance = TouchableNativeFeedback;

export default TouchableNativeFeedback;
