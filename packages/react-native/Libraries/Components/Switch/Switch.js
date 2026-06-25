/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from '../../../src/private/types/HostInstance';
import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {NativeSyntheticEvent} from '../../Types/CoreEventTypes';
import type {AccessibilityState} from '../View/ViewAccessibility';
import type {ViewProps} from '../View/ViewPropTypes';

import StyleSheet from '../../StyleSheet/StyleSheet';
import Platform from '../../Utilities/Platform';
import useMergeRefs from '../../Utilities/useMergeRefs';
import AndroidSwitchNativeComponent, {
  Commands as AndroidSwitchCommands,
} from './AndroidSwitchNativeComponent';
import SwitchNativeComponent, {
  Commands as SwitchCommands,
} from './SwitchNativeComponent';
import * as React from 'react';
import {useLayoutEffect, useRef, useState} from 'react';

export type SwitchInstance = HostInstance;

export type SwitchPropsIOS = {
  /**
   * Background color when the switch is turned on.
   *
   * @deprecated use trackColor instead
   */
  onTintColor?: ?ColorValue,

  /**
   * Color of the foreground switch grip.
   *
   * @deprecated use thumbColor instead
   */
  thumbTintColor?: ?ColorValue,

  /**
   * Background color when the switch is turned off.
   *
   * @deprecated use trackColor instead
   */
  tintColor?: ?ColorValue,
};

type SwitchChangeEventData = Readonly<{
  target: number,
  value: boolean,
}>;

export type SwitchChangeEvent = NativeSyntheticEvent<SwitchChangeEventData>;

type SwitchPropsBase = {
  /**
    If true the user won't be able to toggle the switch.

    @default false
   */
  disabled?: ?boolean,

  /**
      The value of the switch. If true the switch will be turned on.

      @default false
     */
  value?: ?boolean,

  /**
      Color of the foreground switch grip. If this is set on iOS, the switch grip will lose its drop shadow.
     */
  thumbColor?: ?ColorValue,

  /**
      Custom colors for the switch track.

      _iOS_: When the switch value is false, the track shrinks into the border. If you want to change the
      color of the background exposed by the shrunken track, use
       [`ios_backgroundColor`](https://reactnative.dev/docs/switch#ios_backgroundColor).
     */
  trackColor?: ?Readonly<{
    false?: ?ColorValue,
    true?: ?ColorValue,
  }>,

  /**
      On iOS, custom color for the background. This background color can be
      seen either when the switch value is false or when the switch is
      disabled (and the switch is translucent).
     */
  ios_backgroundColor?: ?ColorValue,

  /**
      Invoked when the user tries to change the value of the switch. Receives
      the change event as an argument. If you want to only receive the new
      value, use `onValueChange` instead.
     */
  onChange?: ?(event: SwitchChangeEvent) => Promise<void> | void,

  /**
      Invoked when the user tries to change the value of the switch. Receives
      the new value as an argument. If you want to instead receive an event,
      use `onChange`.
     */
  onValueChange?: ?(value: boolean) => Promise<void> | void,
};

/** @build-types emit-as-interface Expo compatibility */
export type SwitchProps = Readonly<{
  ...ViewProps,
  ...SwitchPropsIOS,
  ...SwitchPropsBase,
}>;

const returnsFalse = () => false;
const returnsTrue = () => true;

/**
  Renders a boolean input.

  This is a controlled component that requires an `onValueChange`
  callback that updates the `value` prop in order for the component to
  reflect user actions. If the `value` prop is not updated, the
  component will continue to render the supplied `value` prop instead of
  the expected result of any user actions.

  ```SnackPlayer name=Switch
  import React, { useState } from "react";
  import { View, Switch, StyleSheet } from "react-native";

  const App = () => {
    const [isEnabled, setIsEnabled] = useState(false);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);

    return (
      <View style={styles.container}>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center"
    }
  });

  export default App;
  ```
 */
const Switch: component(
  ref?: React.RefSetter<SwitchInstance>,
  ...props: SwitchProps
) = function Switch({
  ref: forwardedRef,
  ...props
}: {
  ref?: React.RefSetter<SwitchInstance>,
  ...SwitchProps,
}): React.Node {
  const {
    disabled,
    ios_backgroundColor,
    onChange,
    onValueChange,
    style,
    thumbColor,
    trackColor,
    value,
    ...restProps
  } = props;
  const trackColorForFalse = trackColor?.false;
  const trackColorForTrue = trackColor?.true;

  const nativeSwitchRef = useRef<SwitchInstance | null>(null);

  const ref = useMergeRefs(nativeSwitchRef, forwardedRef);

  // We wrap the native state in an object to force the layout-effect
  // below to re-run whenever we get an update from native, even if it's
  // not different from the previous native state.
  const [native, setNative] = useState({value: null as ?boolean});

  const handleChange = (event: SwitchChangeEvent) => {
    // $FlowFixMe[unused-promise]
    onChange?.(event);
    // $FlowFixMe[unused-promise]
    onValueChange?.(event.nativeEvent.value);
    setNative({value: event.nativeEvent.value});
  };

  useLayoutEffect(() => {
    // This is necessary in case native updates the switch and JS decides
    // that the update should be ignored and we should stick with the value
    // that we have in JS.
    const jsValue = value === true;
    const shouldUpdateNativeSwitch =
      native.value != null && native.value !== jsValue;
    if (
      shouldUpdateNativeSwitch &&
      // $FlowFixMe[method-unbinding]
      nativeSwitchRef.current?.setNativeProps != null
    ) {
      if (Platform.OS === 'android') {
        AndroidSwitchCommands.setNativeValue(nativeSwitchRef.current, jsValue);
      } else {
        SwitchCommands.setValue(nativeSwitchRef.current, jsValue);
      }
    }
  }, [value, native]);

  if (Platform.OS === 'android') {
    const {onTintColor, tintColor, ...androidProps} = restProps;
    const {accessibilityState} = androidProps;
    const _disabled =
      disabled != null ? disabled : accessibilityState?.disabled;

    const _accessibilityState: ?AccessibilityState =
      _disabled !== accessibilityState?.disabled
        ? {...accessibilityState, disabled: _disabled}
        : accessibilityState;

    const platformProps = {
      accessibilityState: _accessibilityState,
      enabled: _disabled !== true,
      on: value === true,
      style,
      thumbTintColor: thumbColor,
      trackColorForFalse: trackColorForFalse,
      trackColorForTrue: trackColorForTrue,
      trackTintColor: value === true ? trackColorForTrue : trackColorForFalse,
    };

    return (
      <AndroidSwitchNativeComponent
        {...androidProps}
        {...platformProps}
        accessibilityRole={props.accessibilityRole ?? 'switch'}
        onChange={handleChange}
        onResponderTerminationRequest={returnsFalse}
        onStartShouldSetResponder={returnsTrue}
        ref={ref}
      />
    );
  } else {
    const platformProps = {
      disabled,
      onTintColor: trackColorForTrue,
      style: StyleSheet.compose(
        {alignSelf: 'flex-start' as const},
        StyleSheet.compose(
          style,
          ios_backgroundColor == null
            ? null
            : {
                backgroundColor: ios_backgroundColor,
                borderRadius: 16,
              },
        ),
      ),
      thumbTintColor: thumbColor,
      tintColor: trackColorForFalse,
      value: value === true,
    };

    return (
      <SwitchNativeComponent
        {...restProps}
        {...platformProps}
        accessibilityRole={props.accessibilityRole ?? 'switch'}
        onChange={handleChange}
        onResponderTerminationRequest={returnsFalse}
        onStartShouldSetResponder={returnsTrue}
        ref={ref}
      />
    );
  }
};

export default Switch;
