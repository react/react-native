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
import type {
  ViewLayout,
  ViewLayoutEvent,
  ViewProps,
} from '../View/ViewPropTypes';
import type {KeyboardEvent, KeyboardMetrics} from './Keyboard';

import LayoutAnimation from '../../LayoutAnimation/LayoutAnimation';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Platform from '../../Utilities/Platform';
import {type EventSubscription} from '../../vendor/emitter/EventEmitter';
import AccessibilityInfo from '../AccessibilityInfo/AccessibilityInfo';
import View from '../View/View';
import Keyboard from './Keyboard';
import * as React from 'react';
import {createRef} from 'react';

/** @build-types emit-as-interface Uniwind compatibility */
export type KeyboardAvoidingViewProps = Readonly<{
  ...ViewProps,

  /**
   * Specify how to react to the presence of the keyboard.
   */
  behavior?: ?('height' | 'position' | 'padding'),

  /**
   * The style of the content container (View) when `behavior` is 'position'.
   */
  contentContainerStyle?: ?ViewStyleProp,

  /**
   * Whether the `KeyboardAvoidingView` is enabled.
   *
   * @default `true`
   */
  enabled?: ?boolean,

  /**
   * Distance between the top of the user screen and the React Native view,
   * may be non-zero in some use cases.
   *
   * @default `0`
   */
  keyboardVerticalOffset?: number,
}>;

type KeyboardAvoidingViewState = {
  bottom: number,
};

/**
 * Automatically adjusts its height, position, or bottom padding based on the
 * keyboard height to remain visible while the virtual keyboard is displayed.
 *
 * @see https://reactnative.dev/docs/keyboardavoidingview
 */
class KeyboardAvoidingView extends React.Component<
  KeyboardAvoidingViewProps,
  KeyboardAvoidingViewState,
> {
  _frame: ?ViewLayout = null;
  _keyboardEvent: ?KeyboardEvent = null;
  _subscriptions: Array<EventSubscription> = [];
  viewRef: {current: React.ElementRef<typeof View> | null, ...};
  _initialFrameHeight: number = 0;
  _bottom: number = 0;

  constructor(props: KeyboardAvoidingViewProps) {
    super(props);
    this.state = {bottom: 0};
    this.viewRef = createRef();
  }

  async _relativeKeyboardHeight(
    keyboardFrame: KeyboardMetrics,
  ): Promise<number> {
    const frame = this._frame;
    if (!frame || !keyboardFrame) {
      return 0;
    }

    // On iOS when Prefer Cross-Fade Transitions is enabled, the keyboard position
    // & height is reported differently (0 instead of Y position value matching height of frame)
    if (
      Platform.OS === 'ios' &&
      keyboardFrame.screenY === 0 &&
      (await AccessibilityInfo.prefersCrossFadeTransitions())
    ) {
      return 0;
    }

    const keyboardY =
      keyboardFrame.screenY - (this.props.keyboardVerticalOffset ?? 0);

    if (this.props.behavior === 'height') {
      return Math.max(
        this.state.bottom + frame.y + frame.height - keyboardY,
        0,
      );
    }

    // Calculate the displacement needed for the view such that it
    // no longer overlaps with the keyboard
    return Math.max(frame.y + frame.height - keyboardY, 0);
  }

  _onKeyboardChange = (event: ?KeyboardEvent) => {
    this._keyboardEvent = event;
    // $FlowFixMe[unused-promise]
    this._updateBottomIfNecessary();
  };

  _onKeyboardHide = (event: ?KeyboardEvent) => {
    this._keyboardEvent = null;
    // $FlowFixMe[unused-promise]
    this._updateBottomIfNecessary();
  };

  _onLayout = async (event: ViewLayoutEvent) => {
    event.persist();

    const oldFrame = this._frame;
    this._frame = event.nativeEvent.layout;
    if (!this._initialFrameHeight) {
      // save the initial frame height, before the keyboard is visible
      this._initialFrameHeight = this._frame.height;
    }

    // update bottom height for the first time or when the height is changed
    if (!oldFrame || oldFrame.height !== this._frame.height) {
      await this._updateBottomIfNecessary();
    }

    if (this.props.onLayout) {
      this.props.onLayout(event);
    }
  };

  // Avoid unnecessary renders if the KeyboardAvoidingView is disabled.
  _setBottom = (value: number) => {
    const enabled = this.props.enabled ?? true;
    this._bottom = value;
    if (enabled) {
      this.setState({bottom: value});
    }
  };

  _updateBottomIfNecessary = async () => {
    if (this._keyboardEvent == null) {
      this._setBottom(0);
      return;
    }

    const {duration, easing, endCoordinates} = this._keyboardEvent;
    const height = await this._relativeKeyboardHeight(endCoordinates);

    if (this._bottom === height) {
      return;
    }

    this._setBottom(height);

    const enabled = this.props.enabled ?? true;
    if (enabled && duration && easing) {
      LayoutAnimation.configureNext({
        // We have to pass the duration equal to minimal accepted duration defined here: RCTLayoutAnimation.m
        duration: duration > 10 ? duration : 10,
        update: {
          duration: duration > 10 ? duration : 10,
          type: LayoutAnimation.Types[easing] || 'keyboard',
        },
      });
    }
  };

  componentDidUpdate(
    _: KeyboardAvoidingViewProps,
    prevState: KeyboardAvoidingViewState,
  ): void {
    const enabled = this.props.enabled ?? true;
    if (enabled && this._bottom !== prevState.bottom) {
      this.setState({bottom: this._bottom});
    }
  }

  componentDidMount(): void {
    if (!Keyboard.isVisible()) {
      this._keyboardEvent = null;
      this._setBottom(0);
    }

    if (Platform.OS === 'ios') {
      this._subscriptions = [
        // When undocked, split or floating, iOS will emit
        // UIKeyboardWillHideNotification notification.
        // UIKeyboardWillChangeFrameNotification will be emitted before
        // UIKeyboardWillHideNotification, so we need to listen to
        // keyboardWillHide and keyboardWillShow instead of
        // keyboardWillChangeFrame.
        Keyboard.addListener('keyboardWillHide', this._onKeyboardHide),
        Keyboard.addListener('keyboardWillShow', this._onKeyboardChange),
      ];
    } else {
      this._subscriptions = [
        Keyboard.addListener('keyboardDidHide', this._onKeyboardHide),
        Keyboard.addListener('keyboardDidShow', this._onKeyboardChange),
      ];
    }
  }

  componentWillUnmount(): void {
    this._subscriptions.forEach(subscription => {
      subscription.remove();
    });
  }

  render(): React.Node {
    const {
      behavior,
      children,
      contentContainerStyle,
      enabled = true,
      // eslint-disable-next-line no-unused-vars
      keyboardVerticalOffset = 0,
      style,
      onLayout,
      ...props
    } = this.props;
    const bottomHeight = enabled === true ? this.state.bottom : 0;
    switch (behavior) {
      case 'height':
        let heightStyle;
        if (this._frame != null && this.state.bottom > 0) {
          // Note that we only apply a height change when there is keyboard present,
          // i.e. this.state.bottom is greater than 0. If we remove that condition,
          // this.frame.height will never go back to its original value.
          // When height changes, we need to disable flex.
          heightStyle = {
            height: this._initialFrameHeight - bottomHeight,
            flex: 0,
          };
        }
        return (
          <View
            ref={this.viewRef}
            style={StyleSheet.compose(style, heightStyle)}
            onLayout={this._onLayout}
            {...props}>
            {children}
          </View>
        );

      case 'position':
        return (
          <View
            ref={this.viewRef}
            style={style}
            onLayout={this._onLayout}
            {...props}>
            <View
              style={StyleSheet.compose(contentContainerStyle, {
                bottom: bottomHeight,
              })}>
              {children}
            </View>
          </View>
        );

      case 'padding':
        return (
          <View
            ref={this.viewRef}
            style={StyleSheet.compose(style, {paddingBottom: bottomHeight})}
            onLayout={this._onLayout}
            {...props}>
            {children}
          </View>
        );

      default:
        return (
          <View
            ref={this.viewRef}
            onLayout={this._onLayout}
            style={style}
            {...props}>
            {children}
          </View>
        );
    }
  }
}

export type KeyboardAvoidingViewInstance = KeyboardAvoidingView;

export default KeyboardAvoidingView;
