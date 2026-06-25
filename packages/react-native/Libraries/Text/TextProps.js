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
   * Specifies whether font should be scaled down automatically to fit given style constraints.
   *
   * See https://reactnative.dev/docs/text#adjustsfontsizetofit
   */
  adjustsFontSizeToFit?: ?boolean,

  /**
   * The Dynamic Type scale ramp to apply to this element on iOS.
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
   * See https://reactnative.dev/docs/text#supperhighlighting
   */
  suppressHighlighting?: ?boolean,

  /**
   * Set line break strategy on iOS.
   *
   * See https://reactnative.dev/docs/text.html#linebreakstrategyios
   */
  lineBreakStrategyIOS?: ?('none' | 'standard' | 'hangul-word' | 'push-out'),
};

export type TextPropsAndroid = {
  /**
   * Specifies the disabled state of the text view for testing purposes.
   *
   * See https://reactnative.dev/docs/text#disabled
   */
  disabled?: ?boolean,

  /**
   * The highlight color of the text.
   *
   * See https://reactnative.dev/docs/text#selectioncolor
   */
  selectionColor?: ?ColorValue,

  /**
   * Determines the types of data converted to clickable URLs in the text element.
   * By default no data types are detected.
   */
  dataDetectorType?: ?('phoneNumber' | 'link' | 'email' | 'none' | 'all'),

  /**
   * Set text break strategy on Android API Level 23+
   * default is `highQuality`.
   *
   * See https://reactnative.dev/docs/text#textbreakstrategy
   */
  textBreakStrategy?: ?('balanced' | 'highQuality' | 'simple'),

  /**
   * iOS Only
   */
  adjustsFontSizeToFit?: ?boolean,

  /**
   * Specifies smallest possible scale a font can reach when adjustsFontSizeToFit is enabled. (values 0.01-1.0).
   *
   * See https://reactnative.dev/docs/text#minimumfontscale
   */
  minimumFontScale?: ?number,
};

type TextBaseProps = Readonly<{
  onAccessibilityAction?: ?(event: AccessibilityActionEvent) => unknown,

  /**
   * Controls whether the `Text` can be the target of touch events.
   *
   * See https://reactnative.dev/docs/view#pointerevents
   */
  pointerEvents?: ?('auto' | 'box-none' | 'box-only' | 'none'),

  /**
   * Whether fonts should scale to respect Text Size accessibility settings.
   * The default is `true`.
   *
   * See https://reactnative.dev/docs/text#allowfontscaling
   */
  allowFontScaling?: ?boolean,

  /**
   * Set hyphenation strategy on Android.
   *
   */
  android_hyphenationFrequency?: ?('normal' | 'none' | 'full'),
  children?: ?React.Node,

  /**
   * When `numberOfLines` is set, this prop defines how text will be
   * truncated.
   *
   * This can be one of the following values:
   *
   * - `head` - The line is displayed so that the end fits in the container and the missing text
   * at the beginning of the line is indicated by an ellipsis glyph. e.g., "...wxyz"
   * - `middle` - The line is displayed so that the beginning and end fit in the container and the
   * missing text in the middle is indicated by an ellipsis glyph. "ab...yz"
   * - `tail` - The line is displayed so that the beginning fits in the container and the
   * missing text at the end of the line is indicated by an ellipsis glyph. e.g., "abcd..."
   * - `clip` - Lines are not drawn past the edge of the text container.
   *
   * The default is `tail`.
   *
   * `numberOfLines` must be set in conjunction with this prop.
   *
   * > `clip` is working only for iOS
   *
   * See https://reactnative.dev/docs/text#ellipsizemode
   */
  ellipsizeMode?: ?('clip' | 'head' | 'middle' | 'tail'),

  /**
   * Used to reference react managed views from native code.
   *
   * See https://reactnative.dev/docs/text#nativeid
   */
  id?: string,

  /**
   * Specifies largest possible scale a font can reach when `allowFontScaling` is enabled.
   * Possible values:
   * `null/undefined` (default): inherit from the parent node or the global default (0)
   * `0`: no max, ignore parent/global default
   * `>= 1`: sets the maxFontSizeMultiplier of this node to this value
   */
  maxFontSizeMultiplier?: ?number,

  /**
   * Used to locate this view from native code.
   *
   * See https://reactnative.dev/docs/text#nativeid
   */
  nativeID?: ?string,

  /**
   * Used to truncate the text with an ellipsis after computing the text
   * layout, including line wrapping, such that the total number of lines
   * does not exceed this number.
   *
   * This prop is commonly used with `ellipsizeMode`.
   *
   * See https://reactnative.dev/docs/text#numberoflines
   */
  numberOfLines?: ?number,

  /**
   * Invoked on mount and layout changes.
   *
   * {nativeEvent: { layout: {x, y, width, height}}}.
   *
   * See https://reactnative.dev/docs/text#onlayout
   */
  onLayout?: ?(event: LayoutChangeEvent) => unknown,

  /**
   * This function is called on long press.
   * e.g., `onLongPress={this.increaseSize}>`
   *
   * See https://reactnative.dev/docs/text#onlongpress
   */
  onLongPress?: ?(event: GestureResponderEvent) => unknown,

  /**
   * This function is called on press.
   * Text intrinsically supports press handling with a default highlight state (which can be disabled with suppressHighlighting).
   *
   * See https://reactnative.dev/docs/text#onpress
   */
  onPress?: ?(event: GestureResponderEvent) => unknown,
  onPressIn?: ?(event: GestureResponderEvent) => unknown,
  onPressOut?: ?(event: GestureResponderEvent) => unknown,
  onResponderGrant?: ?(event: GestureResponderEvent) => void,
  onResponderMove?: ?(event: GestureResponderEvent) => void,
  onResponderRelease?: ?(event: GestureResponderEvent) => void,
  onResponderTerminate?: ?(event: GestureResponderEvent) => void,
  onResponderTerminationRequest?: ?() => boolean,
  onStartShouldSetResponder?: ?() => boolean,
  onMoveShouldSetResponder?: ?() => boolean,
  onTextLayout?: ?(event: TextLayoutEvent) => unknown,

  /**
   * Defines how far your touch may move off of the button, before
   * deactivating the button.
   *
   * See https://reactnative.dev/docs/text#pressretentionoffset
   */
  pressRetentionOffset?: ?PressRetentionOffset,

  /**
   * Indicates to accessibility services to treat UI component like a specific role.
   */
  role?: ?Role,

  /**
   * Lets the user select text.
   *
   * See https://reactnative.dev/docs/text#selectable
   */
  selectable?: ?boolean,

  /**
   * @see https://reactnative.dev/docs/text#style
   */
  style?: ?TextStyleProp,

  /**
   * Used to locate this view in end-to-end tests.
   *
   * See https://reactnative.dev/docs/text#testid
   */
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
