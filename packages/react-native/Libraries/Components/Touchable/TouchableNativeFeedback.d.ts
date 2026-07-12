/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {Constructor} from '../../../types/private/Utilities';
import {ColorValue} from '../../StyleSheet/StyleSheet';
import {TouchableMixin} from './Touchable';

import type {TVProps} from './TouchableOpacity';
import {TouchableWithoutFeedbackProps} from './TouchableWithoutFeedback';

interface BaseBackgroundPropType {
  type: string;
  rippleRadius?: number | null | undefined;
}

interface RippleBackgroundPropType extends BaseBackgroundPropType {
  type: 'RippleAndroid';
  borderless: boolean;
  color?: number | null | undefined;
}

interface ThemeAttributeBackgroundPropType extends BaseBackgroundPropType {
  type: 'ThemeAttrAndroid';
  attribute: string;
}

type BackgroundPropType =
  RippleBackgroundPropType | ThemeAttributeBackgroundPropType;

/**
 * @see https://reactnative.dev/docs/touchablenativefeedback#props
 */
export interface TouchableNativeFeedbackProps
  extends TouchableWithoutFeedbackProps, TVProps {
  /**
   * Determines the type of background drawable that's going to be used to display feedback.
   * It takes an object with type property and extra data depending on the type.
   * It's recommended to use one of the following static methods to generate that dictionary:
   *      1) TouchableNativeFeedback.SelectableBackground() - will create object that represents android theme's
   *         default background for selectable elements (?android:attr/selectableItemBackground)
   *      2) TouchableNativeFeedback.SelectableBackgroundBorderless() - will create object that represent android
   *         theme's default background for borderless selectable elements
   *         (?android:attr/selectableItemBackgroundBorderless). Available on android API level 21+
   *      3) TouchableNativeFeedback.Ripple(color, borderless) - will create object that represents ripple drawable
   *         with specified color (as a string). If property borderless evaluates to true the ripple will render
   *         outside of the view bounds (see native actionbar buttons as an example of that behavior). This background
   *         type is available on Android API level 21+
   */
  background?: BackgroundPropType | undefined;
  useForeground?: boolean | undefined;
}

/**
 * A wrapper for making views respond properly to touches (Android only).
 * On Android this component uses native state drawable to display touch feedback.
 * At the moment it only supports having a single View instance as a child node,
 * as it's implemented by replacing that View with another instance of RCTView node with some additional properties set.
 *
 * Background drawable of native feedback touchable can be customized with background property.
 *
 * @see https://reactnative.dev/docs/touchablenativefeedback#content
 */
declare class TouchableNativeFeedbackComponent extends React.Component<TouchableNativeFeedbackProps> {}
declare const TouchableNativeFeedbackBase: Constructor<TouchableMixin> &
  typeof TouchableNativeFeedbackComponent;
export class TouchableNativeFeedback extends TouchableNativeFeedbackBase {
  /**
   * Creates an object that represents android theme's default background for
   * selectable elements (?android:attr/selectableItemBackground).
   *
   * @param rippleRadius The radius of ripple effect
   */
  static SelectableBackground(
    rippleRadius?: number | null,
  ): ThemeAttributeBackgroundPropType;

  /**
   * Creates an object that represent android theme's default background for borderless
   * selectable elements (?android:attr/selectableItemBackgroundBorderless).
   * Available on android API level 21+.
   *
   * @param rippleRadius The radius of ripple effect
   */
  static SelectableBackgroundBorderless(
    rippleRadius?: number | null,
  ): ThemeAttributeBackgroundPropType;

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
  static Ripple(
    color: ColorValue,
    borderless: boolean,
    rippleRadius?: number | null,
  ): RippleBackgroundPropType;
  static canUseNativeForeground(): boolean;
}
