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
import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {AccessibilityState} from '../View/ViewAccessibility';
import type {TouchableWithoutFeedbackProps} from './TouchableWithoutFeedback';

import View from '../../Components/View/View';
import Pressability, {
  type PressabilityConfig,
} from '../../Pressability/Pressability';
import {PressabilityDebugView} from '../../Pressability/PressabilityDebug';
import StyleSheet, {type ViewStyleProp} from '../../StyleSheet/StyleSheet';
import Platform from '../../Utilities/Platform';
import warnOnce from '../../Utilities/warnOnce';
import * as React from 'react';
import {cloneElement} from 'react';

export type TouchableHighlightInstance = HostInstance;

type AndroidProps = Readonly<{
  nextFocusDown?: ?number,
  nextFocusForward?: ?number,
  nextFocusLeft?: ?number,
  nextFocusRight?: ?number,
  nextFocusUp?: ?number,
}>;

type IOSProps = Readonly<{
  /**
   * @deprecated Use `focusable` instead
   */
  hasTVPreferredFocus?: ?boolean,
}>;

type TouchableHighlightBaseProps = Readonly<{
  /**
   * Opacity of the wrapped view when touch is active. Requires `underlayColor` to be set.
   *
   * @default `0.85`
   */
  activeOpacity?: ?number,

  /**
   * Color of the underlay shown when touch is active.
   */
  underlayColor?: ?ColorValue,

  style?: ?ViewStyleProp,

  /**
   * Called immediately after the underlay is shown.
   */
  onShowUnderlay?: ?() => void,

  /**
   * Called immediately after the underlay is hidden.
   */
  onHideUnderlay?: ?() => void,

  testOnly_pressed?: ?boolean,

  hostRef?: React.RefSetter<TouchableHighlightInstance>,
}>;

/** @build-types emit-as-interface Uniwind compatibility */
export type TouchableHighlightProps = Readonly<{
  ...TouchableWithoutFeedbackProps,
  ...AndroidProps,
  ...IOSProps,
  ...TouchableHighlightBaseProps,
}>;

type ExtraStyles = Readonly<{
  child: ViewStyleProp,
  underlay: ViewStyleProp,
}>;

type TouchableHighlightState = Readonly<{
  pressability: Pressability,
  extraStyles: ?ExtraStyles,
}>;

class TouchableHighlightImpl extends React.Component<
  TouchableHighlightProps,
  TouchableHighlightState,
> {
  _hideTimeout: ?TimeoutID;
  _isMounted: boolean = false;

  state: TouchableHighlightState = {
    pressability: new Pressability(this._createPressabilityConfig()),
    extraStyles:
      this.props.testOnly_pressed === true ? this._createExtraStyles() : null,
  };

  _createPressabilityConfig(): PressabilityConfig {
    return {
      cancelable: !this.props.rejectResponderTermination,
      disabled:
        this.props.disabled != null
          ? this.props.disabled
          : this.props.accessibilityState?.disabled,
      hitSlop: this.props.hitSlop,
      delayLongPress: this.props.delayLongPress,
      delayPressIn: this.props.delayPressIn,
      delayPressOut: this.props.delayPressOut,
      minPressDuration: 0,
      pressRectOffset: this.props.pressRetentionOffset,
      android_disableSound: this.props.touchSoundDisabled,
      onBlur: event => {
        if (Platform.isTV) {
          this._hideUnderlay();
        }
        if (this.props.onBlur != null) {
          this.props.onBlur(event);
        }
      },
      onFocus: event => {
        if (Platform.isTV) {
          this._showUnderlay();
        }
        if (this.props.onFocus != null) {
          this.props.onFocus(event);
        }
      },
      onLongPress: this.props.onLongPress,
      onPress: event => {
        if (this._hideTimeout != null) {
          clearTimeout(this._hideTimeout);
        }
        if (!Platform.isTV) {
          this._showUnderlay();
          this._hideTimeout = setTimeout(() => {
            this._hideUnderlay();
          }, this.props.delayPressOut ?? 0);
        }
        if (this.props.onPress != null) {
          this.props.onPress(event);
        }
      },
      onPressIn: event => {
        if (this._hideTimeout != null) {
          clearTimeout(this._hideTimeout);
          this._hideTimeout = null;
        }
        this._showUnderlay();
        if (this.props.onPressIn != null) {
          this.props.onPressIn(event);
        }
      },
      onPressOut: event => {
        if (this._hideTimeout == null) {
          this._hideUnderlay();
        }
        if (this.props.onPressOut != null) {
          this.props.onPressOut(event);
        }
      },
    };
  }

  _createExtraStyles(): ExtraStyles {
    return {
      child: {opacity: this.props.activeOpacity ?? 0.85},
      underlay: {
        backgroundColor:
          this.props.underlayColor === undefined
            ? 'black'
            : this.props.underlayColor,
      },
    };
  }

  _showUnderlay(): void {
    if (!this._isMounted || !this._hasPressHandler()) {
      return;
    }
    this.setState({extraStyles: this._createExtraStyles()});
    if (this.props.onShowUnderlay != null) {
      this.props.onShowUnderlay();
    }
  }

  _hideUnderlay(): void {
    if (this._hideTimeout != null) {
      clearTimeout(this._hideTimeout);
      this._hideTimeout = null;
    }
    if (this.props.testOnly_pressed === true) {
      return;
    }
    if (this._hasPressHandler()) {
      this.setState({extraStyles: null});
      if (this.props.onHideUnderlay != null) {
        this.props.onHideUnderlay();
      }
    }
  }

  _hasPressHandler(): boolean {
    return (
      this.props.onPress != null ||
      this.props.onPressIn != null ||
      this.props.onPressOut != null ||
      this.props.onLongPress != null
    );
  }

  render(): React.Node {
    const child = React.Children.only<$FlowFixMe>(this.props.children);
    if (__DEV__ && child.type === React.Fragment) {
      warnOnce(
        'TouchableHighlight-fragment',
        'TouchableHighlight does not support React.Fragment as a child. ' +
          'Wrap the children in a single host element such as <View>.',
      );
    }

    // BACKWARD-COMPATIBILITY: Focus and blur events were never supported before
    // adopting `Pressability`, so preserve that behavior.
    const {onBlur, onFocus, ...eventHandlersWithoutBlurAndFocus} =
      this.state.pressability.getEventHandlers();

    const accessibilityState: ?AccessibilityState =
      this.props.disabled != null
        ? {
            ...this.props.accessibilityState,
            disabled: this.props.disabled,
          }
        : this.props.accessibilityState;

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
    return (
      <View
        accessible={this.props.accessible !== false}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={this.props.accessibilityHint}
        accessibilityLanguage={this.props.accessibilityLanguage}
        accessibilityRole={this.props.accessibilityRole}
        accessibilityState={accessibilityState}
        accessibilityValue={accessibilityValue}
        accessibilityActions={this.props.accessibilityActions}
        onAccessibilityAction={this.props.onAccessibilityAction}
        importantForAccessibility={
          this.props['aria-hidden'] === true
            ? 'no-hide-descendants'
            : this.props.importantForAccessibility
        }
        accessibilityViewIsModal={
          this.props['aria-modal'] ?? this.props.accessibilityViewIsModal
        }
        accessibilityLiveRegion={accessibilityLiveRegion}
        accessibilityElementsHidden={
          this.props['aria-hidden'] ?? this.props.accessibilityElementsHidden
        }
        style={StyleSheet.compose(
          this.props.style,
          this.state.extraStyles?.underlay,
        )}
        onLayout={this.props.onLayout}
        hitSlop={this.props.hitSlop}
        hasTVPreferredFocus={this.props.hasTVPreferredFocus}
        nextFocusDown={this.props.nextFocusDown}
        nextFocusForward={this.props.nextFocusForward}
        nextFocusLeft={this.props.nextFocusLeft}
        nextFocusRight={this.props.nextFocusRight}
        nextFocusUp={this.props.nextFocusUp}
        focusable={
          this.props.focusable !== false &&
          this.props.onPress !== undefined &&
          !this.props.disabled
        }
        nativeID={this.props.id ?? this.props.nativeID}
        testID={this.props.testID}
        ref={this.props.hostRef}
        {...eventHandlersWithoutBlurAndFocus}>
        {child.type === React.Fragment
          ? child
          : cloneElement(child, {
              style: StyleSheet.compose(
                child.props.style,
                this.state.extraStyles?.child,
              ),
            })}
        {__DEV__ ? (
          <PressabilityDebugView color="green" hitSlop={this.props.hitSlop} />
        ) : null}
      </View>
    );
  }

  componentDidMount(): void {
    this._isMounted = true;
    this.state.pressability.configure(this._createPressabilityConfig());
  }

  componentDidUpdate(
    prevProps: TouchableHighlightProps,
    prevState: TouchableHighlightState,
  ) {
    this.state.pressability.configure(this._createPressabilityConfig());
  }

  componentWillUnmount(): void {
    this._isMounted = false;
    if (this._hideTimeout != null) {
      clearTimeout(this._hideTimeout);
    }
    this.state.pressability.reset();
  }
}

/**
 * A wrapper for making views respond properly to touches. On press down, the opacity of the wrapped view is decreased, which allows the underlay color to show through, darkening or tinting the view.
 *
 * The underlay comes from wrapping the child in a new View, which can affect layout.
 *
 * Must have exactly one child (not zero or more than one). If you wish to have several child components, wrap them in a View.
 *
 * If you need more extensive and future-proof touch handling, use `Pressable`.
 *
 * @see https://reactnative.dev/docs/touchablehighlight
 */
const TouchableHighlight: component(
  ref?: React.RefSetter<TouchableHighlightInstance>,
  ...props: Readonly<Omit<TouchableHighlightProps, 'hostRef'>>
) = ({
  ref: hostRef,
  ...props
}: {
  ref?: React.RefSetter<TouchableHighlightInstance>,
  ...Readonly<Omit<TouchableHighlightProps, 'hostRef'>>,
}) => <TouchableHighlightImpl {...props} hostRef={hostRef} />;

TouchableHighlight.displayName = 'TouchableHighlight';

export default TouchableHighlight;
