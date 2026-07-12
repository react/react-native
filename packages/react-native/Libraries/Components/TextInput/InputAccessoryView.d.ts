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

/**
 * A component which enables customization of the keyboard input accessory view on iOS. The input accessory view is
 * displayed above the keyboard whenever a TextInput has focus. This component can be used to create custom toolbars.
 *
 * To use this component wrap your custom toolbar with the InputAccessoryView component, and set a nativeID. Then, pass
 * that nativeID as the inputAccessoryViewID of whatever TextInput you desire.
 *
 * InputAccessoryView is deprecated and will be removed in a future release.
 * @deprecated
 */
export class InputAccessoryView extends React.Component<InputAccessoryViewProps> {}

/**
 * InputAccessoryView is deprecated and will be removed in a future release.
 * @deprecated
 */
export interface InputAccessoryViewProps {
  backgroundColor?: ColorValue | undefined;

  children?: React.ReactNode | undefined;

  /**
   * An ID which is used to associate this InputAccessoryView to specified TextInput(s).
   */
  nativeID?: string | undefined;

  style?: StyleProp<ViewStyle> | undefined;
}
