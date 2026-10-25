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
import type {ViewProps} from '../View/ViewPropTypes';
import type {TouchableWithoutFeedbackProps} from './TouchableWithoutFeedback';

import Animated from '../../Animated/Animated';
import Easing from '../../Animated/Easing';
import Pressability, {
  type PressabilityConfig,
} from '../../Pressability/Pressability';
import {PressabilityDebugView} from '../../Pressability/PressabilityDebug';
import flattenStyle from '../../StyleSheet/flattenStyle';
import Platform from '../../Utilities/Platform';
import * as React from 'react';

export type TouchableOpacityInstance = HostInstance;

export type TouchableOpacityTVProps = Readonly<{
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
}>;

type TouchableOpacityBaseProps = Readonly<{
  /**
   * Opacity of the wrapped view when touch is active.
   *
   * @default `0.2`
   */
  activeOpacity?: ?number,

  style?: ?Animated.WithAnimatedValue<ViewStyleProp>,

  hostRef?: ?React.RefSetter<TouchableOpacityInstance>,
}>;

export type TouchableOpacityProps = Readonly<{
  ...TouchableWithoutFeedbackProps,
  ...TouchableOpacityTVProps,
  ...TouchableOpacityBaseProps,
}>;

type TouchableOpacityState = Readonly<{
  anim: Animated.Value,
  pressability: Pressability,
}>;

/**
 * A wrapper for making views respond properly to touches. On press down, the opacity of the wrapped view is decreased, dimming it.
 *
 * Opacity is controlled by wrapping the children in an `Animated.View`, which is added to the view hierarchy. Be aware that this can affect layout.
 *
 * If you need more extensive and future-proof touch handling, use `Pressable`.
 *
 * @see https://reactnative.dev/docs/touchableopacity
 */
class TouchableOpacity extends React.Component<
  TouchableOpacityProps,
  TouchableOpacityState,
> {
  state: TouchableOpacityState = {
    anim: new Animated.Value(this._getChildStyleOpacityWithDefault()),
    pressability: new Pressability(this._createPressabilityConfig()),
  };

  _createPressabilityConfig(): PressabilityConfig {
    return {
      cancelable: !this.props.rejectResponderTermination,
      disabled:
        this.props.disabled ??
        this.props['aria-disabled'] ??
        this.props.accessibilityState?.disabled,
      hitSlop: this.props.hitSlop,
      delayLongPress: this.props.delayLongPress,
      delayPressIn: this.props.delayPressIn,
      delayPressOut: this.props.delayPressOut,
      minPressDuration: 0,
      pressRectOffset: this.props.pressRetentionOffset,
      onBlur: event => {
        if (Platform.isTV) {
          this._opacityInactive(250);
        }
        if (this.props.onBlur != null) {
          this.props.onBlur(event);
        }
      },
      onFocus: event => {
        if (Platform.isTV) {
          this._opacityActive(150);
        }
        if (this.props.onFocus != null) {
          this.props.onFocus(event);
        }
      },
      onLongPress: this.props.onLongPress,
      onPress: this.props.onPress,
      onPressIn: event => {
        this._opacityActive(
          event.dispatchConfig.registrationName === 'onResponderGrant'
            ? 0
            : 150,
        );
        if (this.props.onPressIn != null) {
          this.props.onPressIn(event);
        }
      },
      onPressOut: event => {
        this._opacityInactive(250);
        if (this.props.onPressOut != null) {
          this.props.onPressOut(event);
        }
      },
    };
  }

  /**
   * Animate the touchable to a new opacity.
   */
  _setOpacityTo(toValue: number, duration: number): void {
    Animated.timing(this.state.anim, {
      toValue,
      duration,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }

  _opacityActive(duration: number): void {
    this._setOpacityTo(this.props.activeOpacity ?? 0.2, duration);
  }

  _opacityInactive(duration: number): void {
    this._setOpacityTo(this._getChildStyleOpacityWithDefault(), duration);
  }

  _getChildStyleOpacityWithDefault(): number {
    // $FlowFixMe[underconstrained-implicit-instantiation]
    // $FlowFixMe[prop-missing]
    const opacity = flattenStyle(this.props.style)?.opacity;
    return typeof opacity === 'number' ? opacity : 1;
  }

  render(): React.Node {
    // BACKWARD-COMPATIBILITY: Focus and blur events were never supported before
    // adopting `Pressability`, so preserve that behavior.
    const {onBlur, onFocus, ...eventHandlersWithoutBlurAndFocus} =
      this.state.pressability.getEventHandlers();

    const {
      accessible,
      activeOpacity,
      children,
      delayLongPress,
      delayPressIn,
      delayPressOut,
      disabled,
      focusable,
      hostRef,
      onBlur: _onBlur,
      onFocus: _onFocus,
      onLongPress,
      onPress,
      onPressIn,
      onPressOut,
      pressRetentionOffset,
      rejectResponderTermination,
      style,
      touchSoundDisabled,
      ...restProps
    } = this.props;

    const pressabilityConfig = this._createPressabilityConfig();
    if (pressabilityConfig.disabled != null) {
      // Expose Pressability's resolved disabled state to accessibility through View.
      restProps['aria-disabled'] = pressabilityConfig.disabled;
    }

    const viewProps: ViewProps = restProps;

    return (
      <Animated.View
        {...viewProps}
        accessible={accessible !== false}
        style={[style, {opacity: this.state.anim}]}
        focusable={focusable !== false && onPress !== undefined && !disabled}
        // $FlowFixMe[prop-missing]
        ref={hostRef}
        {...eventHandlersWithoutBlurAndFocus}>
        {children}
        {__DEV__ ? (
          <PressabilityDebugView color="cyan" hitSlop={this.props.hitSlop} />
        ) : null}
      </Animated.View>
    );
  }

  componentDidUpdate(
    prevProps: TouchableOpacityProps,
    prevState: TouchableOpacityState,
  ) {
    this.state.pressability.configure(this._createPressabilityConfig());
    if (
      this.props.disabled !== prevProps.disabled ||
      // $FlowFixMe[underconstrained-implicit-instantiation]
      // $FlowFixMe[prop-missing]
      flattenStyle(prevProps.style)?.opacity !==
        // $FlowFixMe[underconstrained-implicit-instantiation]
        // $FlowFixMe[prop-missing]
        flattenStyle(this.props.style)?.opacity
    ) {
      this._opacityInactive(250);
    }
  }

  componentDidMount(): void {
    this.state.pressability.configure(this._createPressabilityConfig());
  }

  componentWillUnmount(): void {
    this.state.pressability.reset();
    this.state.anim.resetAnimation();
  }
}

const Touchable: component(
  ref?: React.RefSetter<TouchableOpacityInstance>,
  ...props: TouchableOpacityProps
) = ({
  ref,
  ...props
}: {
  ref?: React.RefSetter<TouchableOpacityInstance>,
  ...TouchableOpacityProps,
}) => <TouchableOpacity {...props} hostRef={ref} />;

Touchable.displayName = 'TouchableOpacity';

export default Touchable;
