/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';
import typeof TouchableWithoutFeedback from './TouchableWithoutFeedback';

import Animated from '../../Animated/Animated';
import Pressability, {
  type PressabilityConfig,
} from '../../Pressability/Pressability';
import {PressabilityDebugView} from '../../Pressability/PressabilityDebug';
import Platform from '../../Utilities/Platform';
import * as React from 'react';

type TouchableBounceProps = Readonly<{
  ...React.ElementConfig<TouchableWithoutFeedback>,

  onPressAnimationComplete?: ?() => void,
  onPressWithCompletion?: ?(callback: () => void) => void,
  releaseBounciness?: ?number,
  releaseVelocity?: ?number,
  style?: ?ViewStyleProp,

  hostRef: React.RefSetter<React.ElementRef<typeof Animated.View>>,
}>;

type TouchableBounceState = Readonly<{
  pressability: Pressability,
  scale: Animated.Value,
}>;

class TouchableBounce extends React.Component<
  TouchableBounceProps,
  TouchableBounceState,
> {
  state: TouchableBounceState = {
    pressability: new Pressability(this._createPressabilityConfig()),
    scale: new Animated.Value(1),
  };

  _createPressabilityConfig(): PressabilityConfig {
    return {
      android_disableSound: this.props.touchSoundDisabled,
      cancelable: !this.props.rejectResponderTermination,
      delayLongPress: this.props.delayLongPress,
      delayPressIn: this.props.delayPressIn,
      delayPressOut: this.props.delayPressOut,
      disabled: this.props.disabled,
      hitSlop: this.props.hitSlop,
      minPressDuration: 0,
      onBlur: event => {
        if (Platform.isTV) {
          this._bounceTo(1, 0.4, 0);
        }
        if (this.props.onBlur != null) {
          this.props.onBlur(event);
        }
      },
      onFocus: event => {
        if (Platform.isTV) {
          this._bounceTo(0.93, 0.1, 0);
        }
        if (this.props.onFocus != null) {
          this.props.onFocus(event);
        }
      },
      onLongPress: this.props.onLongPress,
      onPress: event => {
        const {onPressAnimationComplete, onPressWithCompletion} = this.props;
        const releaseBounciness = this.props.releaseBounciness ?? 10;
        const releaseVelocity = this.props.releaseVelocity ?? 10;

        if (onPressWithCompletion != null) {
          onPressWithCompletion(() => {
            this.state.scale.setValue(0.93);
            this._bounceTo(
              1,
              releaseVelocity,
              releaseBounciness,
              onPressAnimationComplete,
            );
          });
          return;
        }

        this._bounceTo(
          1,
          releaseVelocity,
          releaseBounciness,
          onPressAnimationComplete,
        );
        if (this.props.onPress != null) {
          this.props.onPress(event);
        }
      },
      onPressIn: event => {
        this._bounceTo(0.93, 0.1, 0);
        if (this.props.onPressIn != null) {
          this.props.onPressIn(event);
        }
      },
      onPressOut: event => {
        this._bounceTo(1, 0.4, 0);
        if (this.props.onPressOut != null) {
          this.props.onPressOut(event);
        }
      },
      pressRectOffset: this.props.pressRetentionOffset,
    };
  }

  _bounceTo(
    toValue: number,
    velocity: number,
    bounciness: number,
    callback?: ?() => void,
  ) {
    Animated.spring(this.state.scale, {
      bounciness,
      toValue,
      useNativeDriver: true,
      velocity,
    }).start(callback);
  }

  render(): React.Node {
    // BACKWARD-COMPATIBILITY: Focus and blur events were never supported before
    // adopting `Pressability`, so preserve that behavior.
    const {onBlur, onFocus, ...eventHandlersWithoutBlurAndFocus} =
      this.state.pressability.getEventHandlers();
    const accessibilityLiveRegion =
      this.props['aria-live'] === 'off'
        ? 'none'
        : (this.props['aria-live'] ?? this.props.accessibilityLiveRegion);
    const _accessibilityState = {
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

    const accessibilityValue = {
      max: this.props['aria-valuemax'] ?? this.props.accessibilityValue?.max,
      min: this.props['aria-valuemin'] ?? this.props.accessibilityValue?.min,
      now: this.props['aria-valuenow'] ?? this.props.accessibilityValue?.now,
      text: this.props['aria-valuetext'] ?? this.props.accessibilityValue?.text,
    };

    const accessibilityLabel =
      this.props['aria-label'] ?? this.props.accessibilityLabel;
    return (
      <Animated.View
        style={[{transform: [{scale: this.state.scale}]}, this.props.style]}
        accessible={this.props.accessible !== false}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={this.props.accessibilityHint}
        accessibilityLanguage={this.props.accessibilityLanguage}
        accessibilityRole={this.props.accessibilityRole}
        accessibilityState={_accessibilityState}
        accessibilityActions={this.props.accessibilityActions}
        onAccessibilityAction={this.props.onAccessibilityAction}
        accessibilityValue={accessibilityValue}
        accessibilityLiveRegion={accessibilityLiveRegion}
        importantForAccessibility={
          this.props['aria-hidden'] === true
            ? 'no-hide-descendants'
            : // $FlowFixMe[incompatible-type] - AnimatedProps types were made more strict and need refining at this call site
              this.props.importantForAccessibility
        }
        accessibilityViewIsModal={
          this.props['aria-modal'] ?? this.props.accessibilityViewIsModal
        }
        accessibilityElementsHidden={
          this.props['aria-hidden'] ?? this.props.accessibilityElementsHidden
        }
        nativeID={this.props.id ?? this.props.nativeID}
        testID={this.props.testID}
        hitSlop={this.props.hitSlop}
        focusable={
          this.props.focusable !== false &&
          this.props.onPress !== undefined &&
          !this.props.disabled
        }
        // $FlowFixMe[prop-missing]
        ref={this.props.hostRef}
        {...eventHandlersWithoutBlurAndFocus}>
        {this.props.children}
        {__DEV__ ? (
          <PressabilityDebugView color="orange" hitSlop={this.props.hitSlop} />
        ) : null}
      </Animated.View>
    );
  }

  componentDidUpdate(
    prevProps: TouchableBounceProps,
    prevState: TouchableBounceState,
  ) {
    this.state.pressability.configure(this._createPressabilityConfig());
  }

  componentDidMount(): unknown {
    this.state.pressability.configure(this._createPressabilityConfig());
  }

  componentWillUnmount(): void {
    this.state.pressability.reset();
    this.state.scale.resetAnimation();
  }
}

export default (function TouchableBounceWrapper({
  ref: hostRef,
  ...props
}: {
  ref: React.RefSetter<unknown>,
  ...Readonly<Omit<TouchableBounceProps, 'hostRef'>>,
}) {
  return <TouchableBounce {...props} hostRef={hostRef} />;
} as component(
  ref?: React.RefSetter<unknown>,
  ...props: Readonly<Omit<TouchableBounceProps, 'hostRef'>>
));
