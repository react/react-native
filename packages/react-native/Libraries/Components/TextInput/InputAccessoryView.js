/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import SafeAreaView from '../../Components/SafeAreaView/SafeAreaView';
import StyleSheet, {
  type ColorValue,
  type ViewStyleProp,
} from '../../StyleSheet/StyleSheet';
import Platform from '../../Utilities/Platform';
import useWindowDimensions from '../../Utilities/useWindowDimensions';
import RCTInputAccessoryViewNativeComponent from './RCTInputAccessoryViewNativeComponent';
import * as React from 'react';

/**
 * InputAccessoryView is deprecated and will be removed in a future release.
 * @deprecated
 * @build-types emit-as-interface Expo compatibility
 */
export type InputAccessoryViewProps = Readonly<{
  readonly children: React.Node,
  /**
   * An ID used to associate this `InputAccessoryView` to specified `TextInput`(s).
   */
  nativeID?: ?string,
  style?: ?ViewStyleProp,
  backgroundColor?: ?ColorValue,
}>;

/**
 * A component which enables customization of the keyboard input accessory view on iOS. The input accessory view is displayed above the keyboard whenever a `TextInput` has focus. This component can be used to create custom toolbars.
 *
 * To use this component, wrap your custom toolbar with `InputAccessoryView` and set a `nativeID`. Then, pass that `nativeID` as the `inputAccessoryViewID` of whatever `TextInput` you desire.
 *
 * This component can also be used to create sticky text inputs (text inputs which are anchored to the top of the keyboard). To do this, wrap a `TextInput` with `InputAccessoryView` and don't set a `nativeID`.
 *
 * InputAccessoryView is deprecated and will be removed in a future release.
 *
 * @platform ios
 * @deprecated
 */
const InputAccessoryView: React.ComponentType<InputAccessoryViewProps> = (
  props: InputAccessoryViewProps,
) => {
  const {width} = useWindowDimensions();

  if (Platform.OS === 'ios') {
    if (React.Children.count(props.children) === 0) {
      return null;
    }

    return (
      <RCTInputAccessoryViewNativeComponent
        style={[props.style, styles.container]}
        nativeID={props.nativeID}
        backgroundColor={props.backgroundColor}>
        <SafeAreaView style={[styles.safeAreaView, {width}]}>
          {props.children}
        </SafeAreaView>
      </RCTInputAccessoryViewNativeComponent>
    );
  } else {
    console.warn('<InputAccessoryView> is only supported on iOS.');
    return null;
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  safeAreaView: {
    flex: 1,
  },
});

export default InputAccessoryView;
