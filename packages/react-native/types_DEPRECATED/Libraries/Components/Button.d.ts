/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {ColorValue} from '../StyleSheet/StyleSheet';
import {TouchableNativeFeedbackProps} from './Touchable/TouchableNativeFeedback';
import {TouchableOpacityProps} from './Touchable/TouchableOpacity';

export interface ButtonProps extends Pick<
  TouchableNativeFeedbackProps & TouchableOpacityProps,
  | 'accessibilityLabel'
  | 'accessibilityState'
  | 'hasTVPreferredFocus'
  | 'nextFocusDown'
  | 'nextFocusForward'
  | 'nextFocusLeft'
  | 'nextFocusRight'
  | 'nextFocusUp'
  | 'testID'
  | 'disabled'
  | 'onPress'
  | 'touchSoundDisabled'
> {
  /**
   * Text to display inside the button. On Android the given title will be converted to the uppercased form.
   */
  title: string;

  /**
   * Color of the text (iOS), or background color of the button (Android).
   */
  color?: ColorValue | undefined;
}

export class Button extends React.Component<ButtonProps> {}
