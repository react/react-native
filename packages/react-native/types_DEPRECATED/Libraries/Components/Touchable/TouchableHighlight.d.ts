/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {ColorValue, StyleProp} from '../../StyleSheet/StyleSheet';
import {ViewStyle} from '../../StyleSheet/StyleSheetTypes';
import {View} from '../../Components/View/View';
import {TouchableWithoutFeedbackProps} from './TouchableWithoutFeedback';

/**
 * @see https://reactnative.dev/docs/touchablehighlight#props
 */
export interface TouchableHighlightProps extends TouchableWithoutFeedbackProps {
  /**
   * Determines what the opacity of the wrapped view should be when touch is active.
   */
  activeOpacity?: number | undefined;

  /**
   *
   * Called immediately after the underlay is hidden
   */
  onHideUnderlay?: (() => void) | undefined;

  /**
   * Called immediately after the underlay is shown
   */
  onShowUnderlay?: (() => void) | undefined;

  /**
   * @see https://reactnative.dev/docs/view#style
   */
  style?: StyleProp<ViewStyle> | undefined;

  /**
   * The color of the underlay that will show through when the touch is active.
   */
  underlayColor?: ColorValue | undefined;
}

/**
 * A wrapper for making views respond properly to touches.
 * On press down, the opacity of the wrapped view is decreased,
 * which allows the underlay color to show through, darkening or tinting the view.
 * The underlay comes from adding a view to the view hierarchy,
 * which can sometimes cause unwanted visual artifacts if not used correctly,
 * for example if the backgroundColor of the wrapped view isn't explicitly set to an opaque color.
 *
 * NOTE: TouchableHighlight supports only one child
 * If you wish to have several child components, wrap them in a View.
 *
 * @see https://reactnative.dev/docs/touchablehighlight
 */
export const TouchableHighlight: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<TouchableHighlightProps> & React.RefAttributes<View>
>;
