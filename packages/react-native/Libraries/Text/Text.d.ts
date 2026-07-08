/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {Constructor} from '../../types/private/Utilities';
import {AccessibilityProps} from '../Components/View/ViewAccessibility';
import {HostInstance} from '../../types/public/ReactNativeTypes';
import {ColorValue, StyleProp} from '../StyleSheet/StyleSheet';
import {TextStyle, ViewStyle} from '../StyleSheet/StyleSheetTypes';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  TextLayoutEvent,
} from '../Types/CoreEventTypes';

export interface TextPropsIOS {
  /**
   * Specifies whether font should be scaled down automatically to fit given style constraints.
   */
  adjustsFontSizeToFit?: boolean | undefined;

  /**
   * The Dynamic Type scale ramp to apply to this element on iOS.
   */
  dynamicTypeRamp?:
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
    | undefined;

  /**
   * When `true`, no visual change is made when text is pressed down. By
   * default, a gray oval highlights the text on press down.
   */
  suppressHighlighting?: boolean | undefined;

  /**
   * Set line break strategy on iOS.
   */
  lineBreakStrategyIOS?:
    'none' | 'standard' | 'hangul-word' | 'push-out' | undefined;
}

export interface TextPropsAndroid {
  /**
   * Specifies the disabled state of the text view for testing purposes.
   */
  disabled?: boolean | undefined;

  /**
   * Lets the user select text, to use the native copy and paste functionality.
   */
  selectable?: boolean | undefined;

  /**
   * The highlight color of the text.
   */
  selectionColor?: ColorValue | undefined;

  /**
   * Set text break strategy on Android API Level 23+
   * default is `highQuality`.
   */
  textBreakStrategy?: 'simple' | 'highQuality' | 'balanced' | undefined;

  /**
   * Determines the types of data converted to clickable URLs in the text element.
   * By default no data types are detected.
   */
  dataDetectorType?:
    null | 'phoneNumber' | 'link' | 'email' | 'none' | 'all' | undefined;

  /**
   * Hyphenation strategy
   */
  android_hyphenationFrequency?: 'normal' | 'none' | 'full' | undefined;
}

// https://reactnative.dev/docs/text#props
export interface TextProps
  extends TextPropsIOS, TextPropsAndroid, AccessibilityProps {
  /**
   * Specifies whether fonts should scale to respect Text Size accessibility settings.
   * The default is `true`.
   */
  allowFontScaling?: boolean | undefined;

  children?: React.ReactNode | undefined;

  /**
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
   */
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip' | undefined;

  /**
   * Used to reference react managed views from native code.
   */
  id?: string | undefined;

  /**
   * Line Break mode. Works only with numberOfLines.
   * clip is working only for iOS
   */
  lineBreakMode?: 'head' | 'middle' | 'tail' | 'clip' | undefined;

  /**
   * Used to truncate the text with an ellipsis after computing the text
   * layout, including line wrapping, such that the total number of lines
   * does not exceed this number.
   *
   * This prop is commonly used with `ellipsizeMode`.
   */
  numberOfLines?: number | undefined;

  /**
   * Invoked on mount and layout changes with
   *
   * {nativeEvent: { layout: {x, y, width, height}}}.
   */
  onLayout?: ((event: LayoutChangeEvent) => void) | undefined;

  /**
   * Invoked on Text layout
   */
  onTextLayout?: ((event: TextLayoutEvent) => void) | undefined;

  /**
   * This function is called on press.
   * Text intrinsically supports press handling with a default highlight state (which can be disabled with suppressHighlighting).
   */
  onPress?: ((event: GestureResponderEvent) => void) | undefined;

  onPressIn?: ((event: GestureResponderEvent) => void) | undefined;
  onPressOut?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * This function is called on long press.
   * e.g., `onLongPress={this.increaseSize}>`
   */
  onLongPress?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * @see https://reactnative.dev/docs/text#style
   */
  style?: StyleProp<TextStyle> | undefined;

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: string | undefined;

  /**
   * Used to reference react managed views from native code.
   */
  nativeID?: string | undefined;

  /**
   * Specifies largest possible scale a font can reach when allowFontScaling is enabled. Possible values:
   * - null/undefined (default): inherit from the parent node or the global default (0)
   * - 0: no max, ignore parent/global default
   * - >= 1: sets the maxFontSizeMultiplier of this node to this value
   */
  maxFontSizeMultiplier?: number | null | undefined;

  /**
   * Specifies smallest possible scale a font can reach when adjustsFontSizeToFit is enabled. (values 0.01-1.0).
   */
  minimumFontScale?: number | undefined;

  /**
   * Controls how touch events are handled. Similar to `View`'s `pointerEvents`.
   */
  pointerEvents?: ViewStyle['pointerEvents'] | undefined;

  /**
   * Defines how far your touch may move off of the button, before deactivating the button.
   */
  pressRetentionOffset?:
    {top: number; left: number; bottom: number; right: number} | undefined;
}

/**
 * A React component for displaying text which supports nesting, styling, and touch handling.
 */
declare class TextComponent extends React.Component<TextProps> {}
declare const TextBase: Constructor<HostInstance> & typeof TextComponent;
export class Text extends TextBase {}

export const unstable_TextAncestorContext: React.Context<boolean>;
