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
import AccessibilityInfo from '../AccessibilityInfo/AccessibilityInfo';
import View from '../View/View';
import Keyboard from './Keyboard';
import * as React from 'react';
import {useCallback, useEffect, useRef, useState} from 'react';

type KeyboardAvoidingViewPropsCore = Readonly<{
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

/** @build-types emit-as-interface Uniwind compatibility */
export type KeyboardAvoidingViewProps = Readonly<{
  ...ViewProps,
  ...KeyboardAvoidingViewPropsCore,
}>;

/**
 * Automatically adjusts its height, position, or bottom padding based on the
 * keyboard height to remain visible while the virtual keyboard is displayed.
 *
 * @see https://reactnative.dev/docs/keyboardavoidingview
 */
const KeyboardAvoidingView: component(
  ref?: React.RefSetter<React.ElementRef<typeof View>>,
  ...props: KeyboardAvoidingViewProps
) = ({
  ref,
  behavior,
  children,
  contentContainerStyle,
  enabled = true,
  keyboardVerticalOffset = 0,
  style,
  onLayout,
  ...props
}: {
  ref?: React.RefSetter<React.ElementRef<typeof View>>,
  ...KeyboardAvoidingViewProps,
}): React.Node => {
  const [bottom, setBottom] = useState<number>(0);

  const frame = useRef<?ViewLayout>(null);
  const keyboardEvent = useRef<?KeyboardEvent>(null);
  const initialFrameHeight = useRef<number>(0);
  const bottomValue = useRef<number>(0);

  // Mirror the latest props/state so the (stable) keyboard subscription
  // callbacks can read them like the original class component read
  // `this.props` / `this.state`, without resubscribing on every render.
  const latest = useRef<{
    behavior: ?('height' | 'position' | 'padding'),
    enabled: boolean,
    keyboardVerticalOffset: number,
    bottom: number,
    onLayout: ?(event: ViewLayoutEvent) => unknown,
  }>({
    behavior,
    enabled: enabled ?? true,
    keyboardVerticalOffset,
    bottom,
    onLayout,
  });
  latest.current = {
    behavior,
    enabled: enabled ?? true,
    keyboardVerticalOffset,
    bottom,
    onLayout,
  };

  const relativeKeyboardHeight = useCallback(
    async (keyboardFrame: KeyboardMetrics): Promise<number> => {
      const currentFrame = frame.current;
      if (!currentFrame || !keyboardFrame) {
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
        keyboardFrame.screenY - latest.current.keyboardVerticalOffset;

      if (latest.current.behavior === 'height') {
        return Math.max(
          latest.current.bottom +
            currentFrame.y +
            currentFrame.height -
            keyboardY,
          0,
        );
      }

      // Calculate the displacement needed for the view such that it
      // no longer overlaps with the keyboard
      return Math.max(currentFrame.y + currentFrame.height - keyboardY, 0);
    },
    [],
  );

  // Avoid unnecessary renders if the KeyboardAvoidingView is disabled.
  const setBottomValue = useCallback((value: number) => {
    bottomValue.current = value;
    if (latest.current.enabled) {
      setBottom(value);
    }
  }, []);

  const updateBottomIfNecessary = useCallback(async () => {
    if (keyboardEvent.current == null) {
      setBottomValue(0);
      return;
    }

    const {duration, easing, endCoordinates} = keyboardEvent.current;
    const height = await relativeKeyboardHeight(endCoordinates);

    if (bottomValue.current === height) {
      return;
    }

    setBottomValue(height);

    if (latest.current.enabled && duration && easing) {
      LayoutAnimation.configureNext({
        // We have to pass the duration equal to minimal accepted duration defined here: RCTLayoutAnimation.m
        duration: duration > 10 ? duration : 10,
        update: {
          duration: duration > 10 ? duration : 10,
          type: LayoutAnimation.Types[easing] || 'keyboard',
        },
      });
    }
  }, [relativeKeyboardHeight, setBottomValue]);

  const onKeyboardChange = useCallback(
    (event: ?KeyboardEvent) => {
      keyboardEvent.current = event;
      // $FlowFixMe[unused-promise]
      updateBottomIfNecessary();
    },
    [updateBottomIfNecessary],
  );

  const onKeyboardHide = useCallback(
    (_event: ?KeyboardEvent) => {
      keyboardEvent.current = null;
      // $FlowFixMe[unused-promise]
      updateBottomIfNecessary();
    },
    [updateBottomIfNecessary],
  );

  const onLayoutHandler = useCallback(
    async (event: ViewLayoutEvent) => {
      event.persist();

      const oldFrame = frame.current;
      const newFrame = event.nativeEvent.layout;
      frame.current = newFrame;
      if (!initialFrameHeight.current) {
        // save the initial frame height, before the keyboard is visible
        initialFrameHeight.current = newFrame.height;
      }

      // update bottom height for the first time or when the height is changed
      if (!oldFrame || oldFrame.height !== newFrame.height) {
        await updateBottomIfNecessary();
      }

      latest.current.onLayout?.(event);
    },
    [updateBottomIfNecessary],
  );

  // componentDidMount + componentWillUnmount
  useEffect(() => {
    if (!Keyboard.isVisible()) {
      keyboardEvent.current = null;
      setBottomValue(0);
    }

    const subscriptions =
      Platform.OS === 'ios'
        ? [
            // When undocked, split or floating, iOS will emit
            // UIKeyboardWillHideNotification notification.
            // UIKeyboardWillChangeFrameNotification will be emitted before
            // UIKeyboardWillHideNotification, so we need to listen to
            // keyboardWillHide and keyboardWillShow instead of
            // keyboardWillChangeFrame.
            Keyboard.addListener('keyboardWillHide', onKeyboardHide),
            Keyboard.addListener('keyboardWillShow', onKeyboardChange),
          ]
        : [
            Keyboard.addListener('keyboardDidHide', onKeyboardHide),
            Keyboard.addListener('keyboardDidShow', onKeyboardChange),
          ];

    return () => {
      subscriptions.forEach(subscription => {
        subscription.remove();
      });
    };
  }, [onKeyboardChange, onKeyboardHide, setBottomValue]);

  // componentDidUpdate: when enabled, keep the rendered bottom in sync with the
  // latest computed value (e.g. after `enabled` flips from false to true).
  useEffect(() => {
    if ((enabled ?? true) && bottomValue.current !== bottom) {
      setBottom(bottomValue.current);
    }
  }, [enabled, bottom]);

  const bottomHeight = enabled === true ? bottom : 0;
  switch (behavior) {
    case 'height':
      let heightStyle;
      if (frame.current != null && bottom > 0) {
        // Note that we only apply a height change when there is keyboard present,
        // i.e. bottom is greater than 0. If we remove that condition,
        // frame.current.height will never go back to its original value.
        // When height changes, we need to disable flex.
        heightStyle = {
          height: initialFrameHeight.current - bottomHeight,
          flex: 0,
        };
      }
      return (
        <View
          ref={ref}
          style={StyleSheet.compose(style, heightStyle)}
          onLayout={onLayoutHandler}
          {...props}>
          {children}
        </View>
      );

    case 'position':
      return (
        <View ref={ref} style={style} onLayout={onLayoutHandler} {...props}>
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
          ref={ref}
          style={StyleSheet.compose(style, {paddingBottom: bottomHeight})}
          onLayout={onLayoutHandler}
          {...props}>
          {children}
        </View>
      );

    default:
      return (
        <View ref={ref} onLayout={onLayoutHandler} style={style} {...props}>
          {children}
        </View>
      );
  }
};

KeyboardAvoidingView.displayName = 'KeyboardAvoidingView';

export type KeyboardAvoidingViewInstance = React.ElementRef<typeof View>;

export default KeyboardAvoidingView;
