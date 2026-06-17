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
import {TimerMixin} from '../../../types/private/TimerMixin';
import {HostInstance} from '../../../types/public/ReactNativeTypes';
import {ColorValue, StyleProp} from '../../StyleSheet/StyleSheet';
import {TextStyle} from '../../StyleSheet/StyleSheetTypes';
import {
  BlurEvent,
  FocusEvent,
  NativeSyntheticEvent,
  NativeTouchEvent,
  TargetedEvent,
} from '../../Types/CoreEventTypes';
import EventEmitter from '../../vendor/emitter/EventEmitter';
import {AccessibilityProps} from '../View/ViewAccessibility';
import {ViewProps} from '../View/ViewPropTypes';

export type KeyboardType =
  | 'default'
  | 'number-pad'
  | 'decimal-pad'
  | 'numeric'
  | 'email-address'
  | 'phone-pad'
  | 'url';
export type KeyboardTypeIOS =
  | 'ascii-capable'
  | 'numbers-and-punctuation'
  | 'name-phone-pad'
  | 'twitter'
  | 'web-search';
export type KeyboardTypeAndroid = 'visible-password';
export type KeyboardTypeOptions =
  | KeyboardType
  | KeyboardTypeAndroid
  | KeyboardTypeIOS;

export type InputModeOptions =
  | 'none'
  | 'text'
  | 'decimal'
  | 'numeric'
  | 'tel'
  | 'search'
  | 'email'
  | 'url';

export type ReturnKeyType = 'done' | 'go' | 'next' | 'search' | 'send';
export type ReturnKeyTypeAndroid = 'none' | 'previous';
export type ReturnKeyTypeIOS =
  | 'default'
  | 'google'
  | 'join'
  | 'route'
  | 'yahoo'
  | 'emergency-call';

export type ReturnKeyTypeOptions =
  | ReturnKeyType
  | ReturnKeyTypeAndroid
  | ReturnKeyTypeIOS;

export type EnterKeyHintTypeAndroid = 'previous';
export type EnterKeyHintTypeIOS = 'enter';
export type EnterKeyHintType = 'done' | 'go' | 'next' | 'search' | 'send';

export type EnterKeyHintTypeOptions =
  | EnterKeyHintType
  | EnterKeyHintTypeAndroid
  | EnterKeyHintTypeIOS;

type DataDetectorTypes =
  | 'phoneNumber'
  | 'link'
  | 'address'
  | 'calendarEvent'
  | 'trackingNumber'
  | 'flightNumber'
  | 'lookupSuggestion'
  | 'none'
  | 'all';

export type SubmitBehavior = 'submit' | 'blurAndSubmit' | 'newline';

/**
 * DocumentSelectionState is responsible for maintaining selection information
 * for a document.
 *
 * It is intended for use by AbstractTextEditor-based components for
 * identifying the appropriate start/end positions to modify the
 * DocumentContent, and for programmatically setting browser selection when
 * components re-render.
 */
export interface DocumentSelectionState extends EventEmitter {
  new (anchor: number, focus: number): DocumentSelectionState;

  /**
   * Apply an update to the state. If either offset value has changed,
   * set the values and emit the `change` event. Otherwise no-op.
   *
   */
  update(anchor: number, focus: number): void;

  /**
   * Given a max text length, constrain our selection offsets to ensure
   * that the selection remains strictly within the text range.
   *
   */
  constrainLength(maxLength: number): void;

  focus(): void;
  blur(): void;
  hasFocus(): boolean;
  isCollapsed(): boolean;
  isBackward(): boolean;

  getAnchorOffset(): number;
  getFocusOffset(): number;
  getStartOffset(): number;
  getEndOffset(): number;
  overlaps(start: number, end: number): boolean;
}

/**
 * IOS Specific properties for TextInput
 * @see https://reactnative.dev/docs/textinput#props
 */
export interface TextInputIOSProps {
  /**
   * If true, the keyboard shortcuts (undo/redo and copy buttons) are disabled. The default value is false.
   */
  disableKeyboardShortcuts?: boolean | undefined;

  /**
   * enum('never', 'while-editing', 'unless-editing', 'always')
   * When the clear button should appear on the right side of the text view
   */
  clearButtonMode?:
    | 'never'
    | 'while-editing'
    | 'unless-editing'
    | 'always'
    | undefined;

  /**
   * If true, clears the text field automatically when editing begins
   */
  clearTextOnFocus?: boolean | undefined;

  /**
   * Determines the types of data converted to clickable URLs in the text input.
   * Only valid if `multiline={true}` and `editable={false}`.
   * By default no data types are detected.
   *
   * You can provide one type or an array of many types.
   *
   * Possible values for `dataDetectorTypes` are:
   *
   * - `'phoneNumber'`
   * - `'link'`
   * - `'address'`
   * - `'calendarEvent'`
   * - `'none'`
   * - `'all'`
   */
  dataDetectorTypes?: DataDetectorTypes | DataDetectorTypes[] | undefined;

  /**
   * If true, the keyboard disables the return key when there is no text and automatically enables it when there is text.
   * The default value is false.
   */
  enablesReturnKeyAutomatically?: boolean | undefined;

  /**
   * Determines the color of the keyboard.
   */
  keyboardAppearance?: 'default' | 'light' | 'dark' | undefined;

  /**
   * Provide rules for your password.
   * For example, say you want to require a password with at least eight characters consisting of a mix of uppercase and lowercase letters, at least one number, and at most two consecutive characters.
   * "required: upper; required: lower; required: digit; max-consecutive: 2; minlength: 8;"
   */
  passwordRules?: string | null | undefined;

  /**
   * If `true`, allows TextInput to pass touch events to the parent component.
   * This allows components to be swipeable from the TextInput on iOS,
   * as is the case on Android by default.
   * If `false`, TextInput always asks to handle the input (except when disabled).
   */
  rejectResponderTermination?: boolean | null | undefined;

  /**
   * See DocumentSelectionState.js, some state that is responsible for maintaining selection information for a document
   */
  selectionState?: DocumentSelectionState | undefined;

  /**
   * If false, disables spell-check style (i.e. red underlines). The default value is inherited from autoCorrect
   */
  spellCheck?: boolean | undefined;

  /**
   * Give the keyboard and the system information about the expected
   * semantic meaning for the content that users enter.
   *
   * To disable autofill, set textContentType to `none`.
   *
   * Possible values for `textContentType` are:
   *
   *  - `'none'`
   *  - `'URL'`
   *  - `'addressCity'`
   *  - `'addressCityAndState'`
   *  - `'addressState'`
   *  - `'countryName'`
   *  - `'creditCardNumber'`
   *  - `'creditCardExpiration'` (iOS 17+)
   *  - `'creditCardExpirationMonth'` (iOS 17+)
   *  - `'creditCardExpirationYear'` (iOS 17+)
   *  - `'creditCardSecurityCode'` (iOS 17+)
   *  - `'creditCardType'` (iOS 17+)
   *  - `'creditCardName'` (iOS 17+)
   *  - `'creditCardGivenName'` (iOS 17+)
   *  - `'creditCardMiddleName'` (iOS 17+)
   *  - `'creditCardFamilyName'` (iOS 17+)
   *  - `'emailAddress'`
   *  - `'familyName'`
   *  - `'fullStreetAddress'`
   *  - `'givenName'`
   *  - `'jobTitle'`
   *  - `'location'`
   *  - `'middleName'`
   *  - `'name'`
   *  - `'namePrefix'`
   *  - `'nameSuffix'`
   *  - `'nickname'`
   *  - `'organizationName'`
   *  - `'postalCode'`
   *  - `'streetAddressLine1'`
   *  - `'streetAddressLine2'`
   *  - `'sublocality'`
   *  - `'telephoneNumber'`
   *  - `'username'`
   *  - `'password'`
   *  - `'newPassword'`
   *  - `'oneTimeCode'`
   *  - `'birthdate'` (iOS 17+)
   *  - `'birthdateDay'` (iOS 17+)
   *  - `'birthdateMonth'` (iOS 17+)
   *  - `'birthdateYear'` (iOS 17+)
   *  - `'cellularEID'` (iOS 17.4+)
   *  - `'cellularIMEI'` (iOS 17.4+)
   *  - `'dateTime'` (iOS 15+)
   *  - `'flightNumber'` (iOS 15+)
   *  - `'shipmentTrackingNumber'` (iOS 15+)
   *
   */
  textContentType?:
    | 'none'
    | 'URL'
    | 'addressCity'
    | 'addressCityAndState'
    | 'addressState'
    | 'countryName'
    | 'creditCardNumber'
    | 'creditCardExpiration'
    | 'creditCardExpirationMonth'
    | 'creditCardExpirationYear'
    | 'creditCardSecurityCode'
    | 'creditCardType'
    | 'creditCardName'
    | 'creditCardGivenName'
    | 'creditCardMiddleName'
    | 'creditCardFamilyName'
    | 'emailAddress'
    | 'familyName'
    | 'fullStreetAddress'
    | 'givenName'
    | 'jobTitle'
    | 'location'
    | 'middleName'
    | 'name'
    | 'namePrefix'
    | 'nameSuffix'
    | 'nickname'
    | 'organizationName'
    | 'postalCode'
    | 'streetAddressLine1'
    | 'streetAddressLine2'
    | 'sublocality'
    | 'telephoneNumber'
    | 'username'
    | 'password'
    | 'newPassword'
    | 'oneTimeCode'
    | 'birthdate'
    | 'birthdateDay'
    | 'birthdateMonth'
    | 'birthdateYear'
    | 'cellularEID'
    | 'cellularIMEI'
    | 'dateTime'
    | 'flightNumber'
    | 'shipmentTrackingNumber'
    | undefined;

  /**
   * If false, scrolling of the text view will be disabled. The default value is true. Only works with multiline={true}
   */
  scrollEnabled?: boolean | undefined;

  /**
   * Set line break strategy on iOS.
   */
  lineBreakStrategyIOS?:
    | 'none'
    | 'standard'
    | 'hangul-word'
    | 'push-out'
    | undefined;

  /**
   * Set line break mode on iOS.
   * @platform ios
   */
  lineBreakModeIOS?:
    | 'wordWrapping'
    | 'char'
    | 'clip'
    | 'head'
    | 'middle'
    | 'tail'
    | undefined;

  /**
   * If `false`, the iOS system will not insert an extra space after a paste operation
   * neither delete one or two spaces after a cut or delete operation.
   *
   * The default value is `true`.
   */
  smartInsertDelete?: boolean | undefined;
}

/**
 * Android Specific properties for TextInput
 * @see https://reactnative.dev/docs/textinput#props
 */
export interface TextInputAndroidProps {
  /**
   * When provided it will set the color of the cursor (or "caret") in the component.
   * Unlike the behavior of `selectionColor` the cursor color will be set independently
   * from the color of the text selection box.
   * @platform android
   */
  cursorColor?: ColorValue | null | undefined;

  /**
   * When provided it will set the color of the selection handles when highlighting text.
   * Unlike the behavior of `selectionColor` the handle color will be set independently
   * from the color of the text selection box.
   * @platform android
   */
  selectionHandleColor?: ColorValue | null | undefined;

  /**
   * Determines whether the individual fields in your app should be included in a
   * view structure for autofill purposes on Android API Level 26+. Defaults to auto.
   * To disable auto complete, use `off`.
   *
   * *Android Only*
   *
   * The following values work on Android only:
   *
   * - `auto` - let Android decide
   * - `no` - not important for autofill
   * - `noExcludeDescendants` - this view and its children aren't important for autofill
   * - `yes` - is important for autofill
   * - `yesExcludeDescendants` - this view is important for autofill but its children aren't
   */
  importantForAutofill?:
    | 'auto'
    | 'no'
    | 'noExcludeDescendants'
    | 'yes'
    | 'yesExcludeDescendants'
    | undefined;

  /**
   * When false, if there is a small amount of space available around a text input (e.g. landscape orientation on a phone),
   *   the OS may choose to have the user edit the text inside of a full screen text input mode.
   * When true, this feature is disabled and users will always edit the text directly inside of the text input.
   * Defaults to false.
   */
  disableFullscreenUI?: boolean | undefined;

  /**
   * If defined, the provided image resource will be rendered on the left.
   */
  inlineImageLeft?: string | undefined;

  /**
   * Padding between the inline image, if any, and the text input itself.
   */
  inlineImagePadding?: number | undefined;

  /**
   * Sets the number of lines for a TextInput.
   * Use it with multiline set to true to be able to fill the lines.
   */
  numberOfLines?: number | undefined;

  /**
   * Sets the return key to the label. Use it instead of `returnKeyType`.
   * @platform android
   */
  returnKeyLabel?: string | undefined;

  /**
   * Set text break strategy on Android API Level 23+, possible values are simple, highQuality, balanced
   * The default value is simple.
   */
  textBreakStrategy?: 'simple' | 'highQuality' | 'balanced' | undefined;

  /**
   * The color of the textInput underline.
   */
  underlineColorAndroid?: ColorValue | undefined;

  /**
   * Vertically align text when `multiline` is set to true
   */
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center' | undefined;

  /**
   * When false, it will prevent the soft keyboard from showing when the field is focused. The default value is true
   */
  showSoftInputOnFocus?: boolean | undefined;

  /**
   * Vertically align text when `multiline` is set to true
   */
  verticalAlign?: 'auto' | 'top' | 'bottom' | 'middle' | undefined;
}

/**
 * @deprecated Use `FocusEvent` instead
 */
export interface TextInputFocusEventData extends TargetedEvent {
  text: string;
  eventCount: number;
}

/**
 * @see TextInputProps.onFocus
 * @deprecated Use `FocusEvent` instead
 */
export type TextInputFocusEvent = NativeSyntheticEvent<TextInputFocusEventData>;

/**
 * @deprecated Use `TextInputScrollEvent` instead
 */
export interface TextInputScrollEventData {
  contentOffset: {x: number; y: number};
}

/**
 * @see TextInputProps.onScroll
 */
export type TextInputScrollEvent =
  NativeSyntheticEvent<TextInputScrollEventData>;

/**
 * @deprecated Use `TextInputSelectionChangeEvent` instead
 */
export interface TextInputSelectionChangeEventData extends TargetedEvent {
  selection: {
    start: number;
    end: number;
  };
}

/**
 * @see TextInputProps.onSelectionChange
 */
export type TextInputSelectionChangeEvent =
  NativeSyntheticEvent<TextInputSelectionChangeEventData>;

/**
 * @deprecated Use `TextInputKeyPressEvent` instead
 */
export interface TextInputKeyPressEventData {
  key: string;
  eventCount: number;
}

/**
 * @see TextInputProps.onKeyPress
 */
export type TextInputKeyPressEvent =
  NativeSyntheticEvent<TextInputKeyPressEventData>;

/**
 * @deprecated Use `TextInputChangeEvent` instead
 */
export interface TextInputChangeEventData extends TargetedEvent {
  eventCount: number;
  text: string;
}

/**
 * @see TextInputProps.onChange
 */
export type TextInputChangeEvent =
  NativeSyntheticEvent<TextInputChangeEventData>;

/**
 * @deprecated Use `TextInputContentSizeChangeEvent` instead
 */
export interface TextInputContentSizeChangeEventData {
  contentSize: {width: number; height: number};
}

/**
 * @see TextInputProps.onContentSizeChange
 */
export type TextInputContentSizeChangeEvent =
  NativeSyntheticEvent<TextInputContentSizeChangeEventData>;

/**
 * @deprecated Use `TextInputEndEditingEvent` instead
 */
export interface TextInputEndEditingEventData {
  text: string;
}

/**
 * @see TextInputProps.onEndEditing
 */
export type TextInputEndEditingEvent =
  NativeSyntheticEvent<TextInputEndEditingEventData>;

/**
 * @deprecated Use `TextInputSubmitEditingEvent` instead
 */
export interface TextInputSubmitEditingEventData {
  text: string;
}

/**
 * @see TextInputProps.onSubmitEditing
 */
export type TextInputSubmitEditingEvent =
  NativeSyntheticEvent<TextInputSubmitEditingEventData>;

/**
 * @see https://reactnative.dev/docs/textinput#props
 */
export interface TextInputProps
  extends ViewProps,
    TextInputIOSProps,
    TextInputAndroidProps,
    AccessibilityProps {
  /**
   * Specifies whether fonts should scale to respect Text Size accessibility settings.
   * The default is `true`.
   */
  allowFontScaling?: boolean | undefined;

  /**
   * Can tell TextInput to automatically capitalize certain characters.
   *      characters: all characters,
   *      words: first letter of each word
   *      sentences: first letter of each sentence (default)
   *      none: don't auto capitalize anything
   *
   * https://reactnative.dev/docs/textinput#autocapitalize
   */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters' | undefined;

  /**
   * Specifies autocomplete hints for the system, so it can provide autofill.
   * On Android, the system will always attempt to offer autofill by using heuristics to identify the type of content.
   * To disable autocomplete, set autoComplete to off.
   *
   * The following values work across platforms:
   *
   * - `additional-name`
   * - `address-line1`
   * - `address-line2`
   * - `cc-number`
   * - `country`
   * - `current-password`
   * - `email`
   * - `family-name`
   * - `given-name`
   * - `honorific-prefix`
   * - `honorific-suffix`
   * - `name`
   * - `new-password`
   * - `off`
   * - `one-time-code`
   * - `postal-code`
   * - `street-address`
   * - `tel`
   * - `username`
   *
   * The following values work on iOS only:
   *
   * - `nickname`
   * - `organization`
   * - `organization-title`
   * - `url`
   *
   * The following values work on Android only:
   *
   * - `birthdate-day`
   * - `birthdate-full`
   * - `birthdate-month`
   * - `birthdate-year`
   * - `cc-csc`
   * - `cc-exp`
   * - `cc-exp-day`
   * - `cc-exp-month`
   * - `cc-exp-year`
   * - `2fa-app-otp`
   * - `email-otp`
   * - `flight-confirmation-code`
   * - `flight-number`
   * - `gender`
   * - `gift-card-number`
   * - `gift-card-pin`
   * - `loyalty-account-number`
   * - `name-family`
   * - `name-given`
   * - `name-middle`
   * - `name-middle-initial`
   * - `name-prefix`
   * - `name-suffix`
   * - `password`
   * - `password-new`
   * - `postal-address`
   * - `postal-address-country`
   * - `postal-address-dependent-locality`
   * - `postal-address-extended`
   * - `postal-address-extended-postal-code`
   * - `postal-address-locality`
   * - `postal-address-region`
   * - `postal-address-unit`
   * - `promo-code`
   * - `sms-otp`
   * - `tel-country-code`
   * - `tel-national`
   * - `tel-device`
   * - `upi-vpa`
   * - `wifi-password`
   * - `username-new`
   */
  autoComplete?:
    | '2fa-app-otp'
    | 'additional-name'
    | 'address-line1'
    | 'address-line2'
    | 'birthdate-day'
    | 'birthdate-full'
    | 'birthdate-month'
    | 'birthdate-year'
    | 'cc-csc'
    | 'cc-exp'
    | 'cc-exp-day'
    | 'cc-exp-month'
    | 'cc-exp-year'
    | 'cc-number'
    | 'cc-name'
    | 'cc-given-name'
    | 'cc-middle-name'
    | 'cc-family-name'
    | 'cc-type'
    | 'country'
    | 'current-password'
    | 'email'
    | 'email-otp'
    | 'flight-confirmation-code'
    | 'flight-number'
    | 'family-name'
    | 'gender'
    | 'gift-card-number'
    | 'gift-card-pin'
    | 'given-name'
    | 'honorific-prefix'
    | 'honorific-suffix'
    | 'loyalty-account-number'
    | 'name'
    | 'name-family'
    | 'name-given'
    | 'name-middle'
    | 'name-middle-initial'
    | 'name-prefix'
    | 'name-suffix'
    | 'new-password'
    | 'nickname'
    | 'one-time-code'
    | 'organization'
    | 'organization-title'
    | 'password'
    | 'password-new'
    | 'postal-address'
    | 'postal-address-country'
    | 'postal-address-dependent-locality'
    | 'postal-address-extended'
    | 'postal-address-extended-postal-code'
    | 'postal-address-locality'
    | 'postal-address-region'
    | 'postal-address-unit'
    | 'postal-code'
    | 'promo-code'
    | 'street-address'
    | 'sms-otp'
    | 'tel'
    | 'tel-country-code'
    | 'tel-national'
    | 'tel-device'
    | 'upi-vpa'
    | 'url'
    | 'wifi-password'
    | 'username'
    | 'username-new'
    | 'off'
    | undefined;

  /**
   * If false, disables auto-correct.
   * The default value is true.
   */
  autoCorrect?: boolean | undefined;

  /**
   * If true, focuses the input on componentDidMount.
   * The default value is false.
   */
  autoFocus?: boolean | undefined;

  /**
   * If `true`, the text field will blur when submitted.
   * The default value is true for single-line fields and false for
   * multiline fields. Note that for multiline fields, setting `blurOnSubmit`
   * to `true` means that pressing return will blur the field and trigger the
   * `onSubmitEditing` event instead of inserting a newline into the field.
   *
   * @deprecated
   * Note that `submitBehavior` now takes the place of `blurOnSubmit` and will
   * override any behavior defined by `blurOnSubmit`.
   * @see submitBehavior
   */
  blurOnSubmit?: boolean | undefined;

  /**
   * When the return key is pressed,
   *
   * For single line inputs:
   *
   * - `'newline`' defaults to `'blurAndSubmit'`
   * - `undefined` defaults to `'blurAndSubmit'`
   *
   * For multiline inputs:
   *
   * - `'newline'` adds a newline
   * - `undefined` defaults to `'newline'`
   *
   * For both single line and multiline inputs:
   *
   * - `'submit'` will only send a submit event and not blur the input
   * - `'blurAndSubmit`' will both blur the input and send a submit event
   */
  submitBehavior?: SubmitBehavior | undefined;

  /**
   * If true, caret is hidden. The default value is false.
   */
  caretHidden?: boolean | undefined;

  /**
   * If true, context menu is hidden. The default value is false.
   */
  contextMenuHidden?: boolean | undefined;

  /**
   * Provides an initial value that will change when the user starts typing.
   * Useful for simple use-cases where you don't want to deal with listening to events
   * and updating the value prop to keep the controlled state in sync.
   */
  defaultValue?: string | undefined;

  /**
   * If false, text is not editable. The default value is true.
   */
  editable?: boolean | undefined;

  /**
   * enum("default", 'numeric', 'email-address', "ascii-capable", 'numbers-and-punctuation', 'url', 'number-pad', 'phone-pad', 'name-phone-pad',
   * 'decimal-pad', 'twitter', 'web-search', 'visible-password')
   * Determines which keyboard to open, e.g.numeric.
   * The following values work across platforms: - default - numeric - email-address - phone-pad
   * The following values work on iOS: - ascii-capable - numbers-and-punctuation - url - number-pad - name-phone-pad - decimal-pad - twitter - web-search
   * The following values work on Android: - visible-password
   */
  keyboardType?: KeyboardTypeOptions | undefined;

  /**
   * Works like the inputmode attribute in HTML, it determines which keyboard to open, e.g. numeric and has precedence over keyboardType.
   */
  inputMode?: InputModeOptions | undefined;

  /**
   * Limits the maximum number of characters that can be entered.
   * Use this instead of implementing the logic in JS to avoid flicker.
   */
  maxLength?: number | undefined;

  /**
   * If true, the text input can be multiple lines. The default value is false.
   */
  multiline?: boolean | undefined;

  /**
   * Callback that is called when the text input is blurred
   *
   * Note: If you are trying to find the last value of TextInput, you can use the `onEndEditing`
   * event, which is fired upon completion of editing.
   */
  onBlur?: ((e: BlurEvent) => void) | undefined;

  /**
   * Callback that is called when the text input's text changes.
   */
  onChange?: ((e: TextInputChangeEvent) => void) | undefined;

  /**
   * Callback that is called when the text input's text changes.
   * Changed text is passed as an argument to the callback handler.
   */
  onChangeText?: ((text: string) => void) | undefined;

  /**
   * Callback that is called when the text input's content size changes.
   * This will be called with
   * `{ nativeEvent: { contentSize: { width, height } } }`.
   *
   * Only called for multiline text inputs.
   */
  onContentSizeChange?:
    | ((e: TextInputContentSizeChangeEvent) => void)
    | undefined;

  /**
   * Callback that is called when text input ends.
   */
  onEndEditing?: ((e: TextInputEndEditingEvent) => void) | undefined;

  /**
   * Called when a single tap gesture is detected.
   */
  onPress?: ((e: NativeSyntheticEvent<NativeTouchEvent>) => void) | undefined;

  /**
   * Callback that is called when a touch is engaged.
   */
  onPressIn?: ((e: NativeSyntheticEvent<NativeTouchEvent>) => void) | undefined;

  /**
   * Callback that is called when a touch is released.
   */
  onPressOut?:
    | ((e: NativeSyntheticEvent<NativeTouchEvent>) => void)
    | undefined;

  /**
   * Callback that is called when the text input is focused
   */
  onFocus?: ((e: FocusEvent) => void) | undefined;

  /**
   * Callback that is called when the text input selection is changed.
   */
  onSelectionChange?: ((e: TextInputSelectionChangeEvent) => void) | undefined;

  /**
   * Callback that is called when the text input's submit button is pressed.
   */
  onSubmitEditing?: ((e: TextInputSubmitEditingEvent) => void) | undefined;

  /**
   * Invoked on content scroll with
   *  `{ nativeEvent: { contentOffset: { x, y } } }`.
   *
   * May also contain other properties from ScrollEvent but on Android contentSize is not provided for performance reasons.
   */
  onScroll?: ((e: TextInputScrollEvent) => void) | undefined;

  /**
   * Callback that is called when a key is pressed.
   * This will be called with
   *  `{ nativeEvent: { key: keyValue } }`
   * where keyValue is 'Enter' or 'Backspace' for respective keys and the typed-in character otherwise including ' ' for space.
   *
   * Fires before onChange callbacks.
   * Note: on Android only the inputs from soft keyboard are handled, not the hardware keyboard inputs.
   */
  onKeyPress?: ((e: TextInputKeyPressEvent) => void) | undefined;

  /**
   * The string that will be rendered before text input has been entered
   */
  placeholder?: string | undefined;

  /**
   * The text color of the placeholder string
   */
  placeholderTextColor?: ColorValue | undefined;

  /**
   * If `true`, text is not editable. The default value is `false`.
   */
  readOnly?: boolean | undefined;

  /**
   * enum('default', 'go', 'google', 'join', 'next', 'route', 'search', 'send', 'yahoo', 'done', 'emergency-call')
   * Determines how the return key should look.
   */
  returnKeyType?: ReturnKeyTypeOptions | undefined;

  /**
   * Determines what text should be shown to the return key on virtual keyboards.
   * Has precedence over the returnKeyType prop.
   */
  enterKeyHint?: EnterKeyHintTypeOptions | undefined;

  /**
   * If true, the text input obscures the text entered so that sensitive text like passwords stay secure.
   * The default value is false.
   */
  secureTextEntry?: boolean | undefined;

  /**
   * If true, all text will automatically be selected on focus
   */
  selectTextOnFocus?: boolean | undefined;

  /**
   * The start and end of the text input's selection. Set start and end to
   * the same value to position the cursor.
   */
  selection?: {start: number; end?: number | undefined} | undefined;

  /**
   * The highlight (and cursor on ios) color of the text input
   */
  selectionColor?: ColorValue | undefined;

  /**
   * Styles
   */
  style?: StyleProp<TextStyle> | undefined;

  /**
   * Align the input text to the left, center, or right sides of the input field.
   */
  textAlign?: 'left' | 'center' | 'right' | undefined;

  /**
   * Used to locate this view in end-to-end tests
   */
  testID?: string | undefined;

  /**
   * Used to connect to an InputAccessoryView. Not part of react-natives documentation, but present in examples and
   * code.
   * See https://reactnative.dev/docs/inputaccessoryview for more information.
   */
  inputAccessoryViewID?: string | undefined;

  /**
   * An optional label that overrides the default input accessory view button label.
   * @platform ios
   */
  inputAccessoryViewButtonLabel?: string | undefined;

  /**
   * The value to show for the text input. TextInput is a controlled component,
   * which means the native value will be forced to match this value prop if provided.
   * For most uses this works great, but in some cases this may cause flickering - one common cause is preventing edits by keeping value the same.
   * In addition to simply setting the same value, either set editable={false},
   * or set/update maxLength to prevent unwanted edits without flicker.
   */
  value?: string | undefined;

  /**
   * Specifies largest possible scale a font can reach when allowFontScaling is enabled. Possible values:
   * - null/undefined (default): inherit from the parent node or the global default (0)
   * - 0: no max, ignore parent/global default
   * - >= 1: sets the maxFontSizeMultiplier of this node to this value
   */
  maxFontSizeMultiplier?: number | null | undefined;
}

/**
 * This class is responsible for coordinating the "focused"
 * state for TextInputs. All calls relating to the keyboard
 * should be funneled through here
 */
interface TextInputState {
  /**
   * @deprecated Use currentlyFocusedInput
   * Returns the ID of the currently focused text field, if one exists
   * If no text field is focused it returns null
   */
  currentlyFocusedField(): number;

  /**
   * Returns the ref of the currently focused text field, if one exists
   * If no text field is focused it returns null
   */
  currentlyFocusedInput(): HostInstance;

  /**
   * @param textField ref of the text field to focus
   * Focuses the specified text field
   * noop if the text field was already focused
   */
  focusTextInput(textField?: HostInstance): void;

  /**
   * @param textField ref of the text field to focus
   * Unfocuses the specified text field
   * noop if it wasn't focused
   */
  blurTextInput(textField?: HostInstance): void;
}

/**
 * @see https://reactnative.dev/docs/textinput#methods
 */
declare class TextInputComponent extends React.Component<TextInputProps> {}
declare const TextInputBase: Constructor<HostInstance> &
  Constructor<TimerMixin> &
  typeof TextInputComponent;
export class TextInput extends TextInputBase {
  /**
   * Access the current focus state.
   */
  static State: TextInputState;

  /**
   * Returns if the input is currently focused.
   */
  isFocused: () => boolean;

  /**
   * Removes all text from the input.
   */
  clear: () => void;

  /**
   * Sets the start and end positions of text selection.
   */
  setSelection: (start: number, end: number) => void;
}
