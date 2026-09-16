/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {
  AccessibilityActionEvent,
  AccessibilityProps,
  Role,
} from '../Components/View/ViewAccessibility';
import type {ColorValue, TextStyleProp} from '../StyleSheet/StyleSheet';
import type {
  GestureResponderEvent,
  LayoutChangeEvent,
  PointerEvent,
  TextLayoutEvent,
} from '../Types/CoreEventTypes';

import * as React from 'react';

export type PressRetentionOffset = Readonly<{
  top: number,
  left: number,
  bottom: number,
  right: number,
}>;

type TextPointerEventProps = Readonly<{
  onPointerEnter?: (event: PointerEvent) => void,
  onPointerLeave?: (event: PointerEvent) => void,
  onPointerMove?: (event: PointerEvent) => void,
}>;

export type TextPropsIOS = {
  /**
   * Whether fonts should be scaled down to fit style constraints.
   *
   * @default `false`
   * @platform ios
   */
  adjustsFontSizeToFit?: ?boolean,

  /**
   * The [Dynamic Type](https://developer.apple.com/documentation/uikit/uifont/textstyle)
   * ramp to apply.
   *
   * @default `'body'`
   * @platform ios
   */
  dynamicTypeRamp?: ?(
    | 'caption2'
    | 'caption1'
    | 'footnote'
    | 'subheadline'
    | 'callout'
    | 'body'
    | 'headline'
    | 'title3'
    | 'title2'
    | 'title1'
    | 'largeTitle'
  ),

  /**
   * When `true`, no visual change is made when text is pressed down. By
   * default, a gray oval highlights the text on press down.
   *
   * @default `false`
   * @platform ios
   */
  suppressHighlighting?: ?boolean,

  /**
   * Line break strategy on iOS.
   *
   * @default `'none'`
   * @platform ios
   */
  lineBreakStrategyIOS?: ?('none' | 'standard' | 'hangul-word' | 'push-out'),
};

export type TextPropsAndroid = {
  /**
   * Specifies the disabled state of the text view for testing purposes.
   *
   * @platform android
   */
  disabled?: ?boolean,

  /**
   * Highlight color of the text when selected.
   *
   * @platform android
   */
  selectionColor?: ?ColorValue,

  /**
   * Types of data converted to clickable URLs in the text element.
   *
   * @default `'none'`
   * @platform android
   */
  dataDetectorType?: ?('phoneNumber' | 'link' | 'email' | 'none' | 'all'),

  /**
   * Text break strategy on Android.
   *
   * @default `'highQuality'`
   * @platform android
   */
  textBreakStrategy?: ?('balanced' | 'highQuality' | 'simple'),

  adjustsFontSizeToFit?: ?boolean,

  /**
   * Smallest possible font scale when `adjustsFontSizeToFit` is enabled
   * (values 0.01-1.0).
   *
   * @platform ios
   */
  minimumFontScale?: ?number,
};

type TextBaseProps = Readonly<{
  onAccessibilityAction?: ?(event: AccessibilityActionEvent) => unknown,

  /**
   * Controls whether the `Text` can be the target of touch events.
   */
  pointerEvents?: ?('auto' | 'box-none' | 'box-only' | 'none'),

  /**
   * Whether fonts should scale to respect Text Size accessibility settings.
   *
   * @default `true`
   */
  allowFontScaling?: ?boolean,

  /**
   * Sets automatic hyphenation frequency.
   *
   * @default `'none'`
   * @platform android
   */
  android_hyphenationFrequency?: ?('normal' | 'none' | 'full'),

  children?: ?React.Node,

  /**
   * How text is truncated when `numberOfLines` is set. On Android with
   * `numberOfLines` greater than 1, only `'tail'` works correctly.
   *
   * @default `'tail'`
   */
  ellipsizeMode?: ?('clip' | 'head' | 'middle' | 'tail'),

  id?: string,

  /**
   * Largest possible font scale when `allowFontScaling` is enabled.
   * `null`/`undefined` inherits from the parent node or the global default (0).
   * `0` means no max (ignores parent/global default). `>= 1` sets the
   * `maxFontSizeMultiplier` of this node to this value.
   */
  maxFontSizeMultiplier?: ?number,

  nativeID?: ?string,

  /**
   * Truncate text with an ellipsis after this many lines. `0` means no
   * restriction.
   *
   * @default `0`
   */
  numberOfLines?: ?number,

  onLayout?: ?(event: LayoutChangeEvent) => unknown,

  /** Called on long press. */
  onLongPress?: ?(event: GestureResponderEvent) => unknown,

  /** Called on press, triggered after `onPressOut`. */
  onPress?: ?(event: GestureResponderEvent) => unknown,

  /** Called immediately when a touch is engaged. */
  onPressIn?: ?(event: GestureResponderEvent) => unknown,

  /** Called when a touch is released. */
  onPressOut?: ?(event: GestureResponderEvent) => unknown,

  onResponderGrant?: ?(event: GestureResponderEvent) => void,
  onResponderMove?: ?(event: GestureResponderEvent) => void,
  onResponderRelease?: ?(event: GestureResponderEvent) => void,
  onResponderTerminate?: ?(event: GestureResponderEvent) => void,
  onResponderTerminationRequest?: ?() => boolean,
  onStartShouldSetResponder?: ?() => boolean,
  onMoveShouldSetResponder?: ?() => boolean,

  /** Invoked on text layout change. */
  onTextLayout?: ?(event: TextLayoutEvent) => unknown,

  /**
   * Defines how far your touch may move off of the button, before
   * deactivating the button.
   */
  pressRetentionOffset?: ?PressRetentionOffset,

  /**
   * Indicates to accessibility services to treat UI component like a specific role.
   */
  role?: ?Role,

  /**
   * Lets the user select text for native copy and paste.
   *
   * @default `false`
   */
  selectable?: ?boolean,

  style?: ?TextStyleProp,

  testID?: ?string,
}>;

/**
 * @see https://reactnative.dev/docs/text#reference
 *
 * @build-types emit-as-interface Uniwind compatibility
 */
export type TextProps = Readonly<{
  ...TextPointerEventProps,
  ...TextPropsIOS,
  ...TextPropsAndroid,
  ...TextBaseProps,
  ...AccessibilityProps,
}>;
