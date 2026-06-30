/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TextStyleProp, ViewStyleProp} from '../StyleSheet/StyleSheet';
import type {GestureResponderEvent} from '../Types/CoreEventTypes';
import type {
  AccessibilityActionEvent,
  AccessibilityActionInfo,
  AccessibilityState,
} from './View/ViewAccessibility';

import StyleSheet, {type ColorValue} from '../StyleSheet/StyleSheet';
import Text from '../Text/Text';
import Platform from '../Utilities/Platform';
import TouchableNativeFeedback from './Touchable/TouchableNativeFeedback';
import TouchableOpacity from './Touchable/TouchableOpacity';
import View from './View/View';
import invariant from 'invariant';
import * as React from 'react';

/** @build-types emit-as-interface Uniwind compatibility */
export type ButtonProps = Readonly<{
  /**
   * Text to display inside the button. On Android the given title will be
   * converted to the uppercased form.
   */
  title: string,

  /**
   * Handler called when the user taps the button.
   */
  onPress?: (event?: GestureResponderEvent) => unknown,

  /**
   * If `true`, doesn't play system sound on touch.
   *
   * @platform android
   *
   * @default `false`
   */
  touchSoundDisabled?: ?boolean,

  /**
   * Color of the text (iOS), or background color of the button (Android).
   *
   * @default {@platform android} `'#2196F3'`
   * @default {@platform ios} `'#007AFF'`
   */
  color?: ?ColorValue,

  /**
   * TV preferred focus.
   *
   * @platform tv
   *
   * @default `false`
   * @deprecated Use `focusable` instead
   */
  hasTVPreferredFocus?: ?boolean,

  /**
   * Designates the next view to receive focus when the user navigates down. See
   * the [Android documentation][android:nextFocusDown].
   *
   * [android:nextFocusDown]:
   * https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusDown
   *
   * @platform android, tv
   */
  nextFocusDown?: ?number,

  /**
   * Designates the next view to receive focus when the user navigates forward.
   * See the [Android documentation][android:nextFocusForward].
   *
   * [android:nextFocusForward]:
   * https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusForward
   *
   * @platform android, tv
   */
  nextFocusForward?: ?number,

  /**
   * Designates the next view to receive focus when the user navigates left. See
   * the [Android documentation][android:nextFocusLeft].
   *
   * [android:nextFocusLeft]:
   * https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusLeft
   *
   * @platform android, tv
   */
  nextFocusLeft?: ?number,

  /**
   * Designates the next view to receive focus when the user navigates right. See
   * the [Android documentation][android:nextFocusRight].
   *
   * [android:nextFocusRight]:
   * https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusRight
   *
   * @platform android, tv
   */
  nextFocusRight?: ?number,

  /**
   * Designates the next view to receive focus when the user navigates up. See
   * the [Android documentation][android:nextFocusUp].
   *
   * [android:nextFocusUp]:
   * https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusUp
   *
   * @platform android, tv
   */
  nextFocusUp?: ?number,

  /**
   * Text to display for blindness accessibility features.
   */
  accessibilityLabel?: ?string,

  /**
   * Alias for `accessibilityLabel`.
   */
  'aria-label'?: ?string,

  /**
   * If `true`, disable all interactions for this component.
   *
   * @default `false`
   */
  disabled?: ?boolean,

  testID?: ?string,

  accessible?: ?boolean,
  accessibilityActions?: ?ReadonlyArray<AccessibilityActionInfo>,
  onAccessibilityAction?: ?(event: AccessibilityActionEvent) => unknown,
  accessibilityState?: ?AccessibilityState,

  /**
   * Alias for `accessibilityState`.
   */
  'aria-busy'?: ?boolean,
  'aria-checked'?: ?boolean | 'mixed',
  'aria-disabled'?: ?boolean,
  'aria-expanded'?: ?boolean,
  'aria-selected'?: ?boolean,

  importantForAccessibility?: ?('auto' | 'yes' | 'no' | 'no-hide-descendants'),
  accessibilityHint?: ?string,

  /**
   * A BCP 47 language tag for the screen reader to use when reading text
   * content.
   *
   * @platform ios
   */
  accessibilityLanguage?: ?Stringish,
}>;

const NativeTouchable:
  | typeof TouchableNativeFeedback
  | typeof TouchableOpacity =
  Platform.OS === 'android' ? TouchableNativeFeedback : TouchableOpacity;

export type ButtonInstance = React.ElementRef<typeof NativeTouchable>;

/**
 * A basic button component that should render nicely on any platform. Supports a
 * minimal level of customization.
 *
 * If this button doesn't look right for your app, you can build your own button
 * using `Pressable`.
 *
 * Example:
 *
 * ```tsx
 * <Button
 *   onPress={onPressLearnMore}
 *   title="Learn More"
 *   color="#841584"
 *   accessibilityLabel="Learn more about this purple button"
 * />
 * ```
 *
 * @see https://reactnative.dev/docs/button
 */
const Button: component(
  ref?: React.RefSetter<ButtonInstance>,
  ...props: ButtonProps
) = ({
  ref,
  ...props
}: {
  ref?: React.RefSetter<ButtonInstance>,
  ...ButtonProps,
}) => {
  const {
    accessibilityLabel,
    accessibilityState,
    'aria-busy': ariaBusy,
    'aria-checked': ariaChecked,
    'aria-disabled': ariaDisabled,
    'aria-expanded': ariaExpanded,
    'aria-label': ariaLabel,
    'aria-selected': ariaSelected,
    importantForAccessibility,
    color,
    onPress,
    touchSoundDisabled,
    title,
    hasTVPreferredFocus,
    nextFocusDown,
    nextFocusForward,
    nextFocusLeft,
    nextFocusRight,
    nextFocusUp,
    testID,
    accessible,
    accessibilityActions,
    accessibilityHint,
    accessibilityLanguage,
    onAccessibilityAction,
  } = props;
  const buttonStyles: Array<ViewStyleProp> = [styles.button];
  const textStyles: Array<TextStyleProp> = [styles.text];
  if (color) {
    if (Platform.OS === 'ios') {
      textStyles.push({color: color});
    } else {
      buttonStyles.push({backgroundColor: color});
    }
  }

  let _accessibilityState = {
    busy: ariaBusy ?? accessibilityState?.busy,
    checked: ariaChecked ?? accessibilityState?.checked,
    disabled: ariaDisabled ?? accessibilityState?.disabled,
    expanded: ariaExpanded ?? accessibilityState?.expanded,
    selected: ariaSelected ?? accessibilityState?.selected,
  };

  const disabled =
    props.disabled != null ? props.disabled : _accessibilityState?.disabled;

  _accessibilityState =
    disabled !== _accessibilityState?.disabled
      ? {..._accessibilityState, disabled}
      : _accessibilityState;

  if (disabled) {
    buttonStyles.push(styles.buttonDisabled);
    textStyles.push(styles.textDisabled);
  }

  invariant(
    typeof title === 'string',
    'The title prop of a Button must be a string',
  );
  const formattedTitle =
    Platform.OS === 'android' ? title.toUpperCase() : title;

  // If `no` is specified for `importantForAccessibility`, it will be changed to `no-hide-descendants` because the text inside should not be focused.
  const _importantForAccessibility =
    importantForAccessibility === 'no'
      ? 'no-hide-descendants'
      : importantForAccessibility;

  return (
    <NativeTouchable
      accessible={accessible}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
      accessibilityLabel={ariaLabel || accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityLanguage={accessibilityLanguage}
      accessibilityRole="button"
      accessibilityState={_accessibilityState}
      importantForAccessibility={_importantForAccessibility}
      hasTVPreferredFocus={hasTVPreferredFocus}
      nextFocusDown={nextFocusDown}
      nextFocusForward={nextFocusForward}
      nextFocusLeft={nextFocusLeft}
      nextFocusRight={nextFocusRight}
      nextFocusUp={nextFocusUp}
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      touchSoundDisabled={touchSoundDisabled}
      // $FlowFixMe[incompatible-exact]
      // $FlowFixMe[prop-missing]
      // $FlowFixMe[incompatible-type]
      ref={ref}>
      <View style={buttonStyles}>
        <Text style={textStyles} disabled={disabled}>
          {formattedTitle}
        </Text>
      </View>
    </NativeTouchable>
  );
};

Button.displayName = 'Button';

const styles = StyleSheet.create({
  button: Platform.select({
    ios: {},
    android: {
      elevation: 4,
      // Material design blue from https://material.google.com/style/color.html#color-color-palette
      backgroundColor: '#2196F3',
      borderRadius: 2,
    },
  }),
  text: {
    textAlign: 'center',
    margin: 8,
    ...Platform.select({
      ios: {
        // iOS blue from https://developer.apple.com/ios/human-interface-guidelines/visual-design/color/
        color: '#007AFF',
        fontSize: 18,
      },
      android: {
        color: 'white',
        fontWeight: '500',
      },
    }),
  },
  buttonDisabled: Platform.select({
    ios: {},
    android: {
      elevation: 0,
      backgroundColor: '#dfdfdf',
    },
  }),
  textDisabled: Platform.select({
    ios: {
      color: '#cdcdcd',
    },
    android: {
      color: '#a1a1a1',
    },
  }),
});

export default Button;
