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
import {HostInstance} from '../../../types/public/ReactNativeTypes';
import {ColorValue, StyleProp} from '../../StyleSheet/StyleSheet';
import {ViewStyle} from '../../StyleSheet/StyleSheetTypes';
import {ViewProps} from '../View/ViewPropTypes';
import {NativeSyntheticEvent, TargetedEvent} from '../../Types/CoreEventTypes';

export interface SwitchPropsIOS extends ViewProps {
  /**
   * Background color when the switch is turned on.
   *
   * @deprecated use trackColor instead
   */
  onTintColor?: ColorValue | undefined;

  /**
   * Color of the foreground switch grip.
   *
   * @deprecated use thumbColor instead
   */
  thumbTintColor?: ColorValue | undefined;

  /**
   * Background color when the switch is turned off.
   *
   * @deprecated use trackColor instead
   */
  tintColor?: ColorValue | undefined;
}

/**
 * @deprecated Use `SwitchChangeEvent` instead.
 */
export interface SwitchChangeEventData extends TargetedEvent {
  value: boolean;
}

export interface SwitchChangeEvent extends NativeSyntheticEvent<SwitchChangeEventData> {}

export interface SwitchProps extends SwitchPropsIOS {
  /**
   * Color of the foreground switch grip.
   */
  thumbColor?: ColorValue | undefined;

  /**
   * Custom colors for the switch track
   *
   * Color when false and color when true
   */
  trackColor?:
    | {
        false?: ColorValue | null | undefined;
        true?: ColorValue | null | undefined;
      }
    | undefined;

  /**
   * If true the user won't be able to toggle the switch.
   * Default value is false.
   */
  disabled?: boolean | undefined;

  /**
   * Invoked with the change event as an argument when the value changes.
   */
  onChange?:
    ((event: SwitchChangeEvent) => Promise<void> | void) | null | undefined;

  /**
   * Invoked with the new value when the value changes.
   */
  onValueChange?: ((value: boolean) => Promise<void> | void) | null | undefined;

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: string | undefined;

  /**
   * The value of the switch. If true the switch will be turned on.
   * Default value is false.
   */
  value?: boolean | undefined;

  /**
   * On iOS, custom color for the background.
   * Can be seen when the switch value is false or when the switch is disabled.
   */
  ios_backgroundColor?: ColorValue | undefined;

  style?: StyleProp<ViewStyle> | undefined;
}

/**
 * Renders a boolean input.
 *
 * This is a controlled component that requires an `onValueChange` callback that
 * updates the `value` prop in order for the component to reflect user actions.
 * If the `value` prop is not updated, the component will continue to render
 * the supplied `value` prop instead of the expected result of any user actions.
 */
declare class SwitchComponent extends React.Component<SwitchProps> {}
declare const SwitchBase: Constructor<HostInstance> & typeof SwitchComponent;
export class Switch extends SwitchBase {}
