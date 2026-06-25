/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostComponent} from '../../../src/private/types/HostComponent';
import type {PartialViewConfig} from '../../Renderer/shims/ReactNativeTypes';
import type {ColorValue, TextStyleProp} from '../../StyleSheet/StyleSheet';
import type {
  BubblingEventHandler,
  DirectEventHandler,
  Double,
  Float,
  Int32,
  WithDefault,
} from '../../Types/CodegenTypes';
import type {ViewProps} from '../View/ViewPropTypes';
import type {TextInputNativeCommands} from './TextInputNativeCommands';

import * as NativeComponentRegistry from '../../NativeComponent/NativeComponentRegistry';
import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import {colorAttribute} from '../View/ReactNativeStyleAttributes';

export type KeyboardType =
  // Cross Platform
  | 'default'
  | 'email-address'
  | 'numeric'
  | 'phone-pad'
  | 'number-pad'
  | 'decimal-pad'
  | 'url'
  // iOS-only
  | 'ascii-capable'
  | 'numbers-and-punctuation'
  | 'name-phone-pad'
  | 'twitter'
  | 'web-search'
  // Android-only
  | 'visible-password';

export type ReturnKeyType =
  // Cross Platform
  | 'done'
  | 'go'
  | 'next'
  | 'search'
  | 'send'
  // Android-only
  | 'none'
  | 'previous'
  // iOS-only
  | 'default'
  | 'emergency-call'
  | 'google'
  | 'join'
  | 'route'
  | 'yahoo';

export type SubmitBehavior = 'submit' | 'blurAndSubmit' | 'newline';

export type AndroidTextInputNativeProps = Readonly<{
  // This allows us to inherit everything from ViewProps except for style (see below)
  // This must be commented for Fabric codegen to work.
  ...Omit<ViewProps, 'style'>,

  /**
   * Android props after this
   */
  /**
   * Specifies autocomplete hints for the system, so it can provide autofill. On Android, the system will always attempt to offer autofill by using heuristics to identify the type of content.
   * To disable autocomplete, set `autoComplete` to `off`.
   *
   * *Android Only*
   *
   * Possible values for `autoComplete` are:
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
   * - `cc-number`
   * - `2fa-app-otp`
   * - `email`
   * - `email-otp`
   * - `flight-confirmation-code`
   * - `flight-number`
   * - `gender`
   * - `gift-card-number`
   * - `gift-card-pin`
   * - `loyalty-account-number`
   * - `name`
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
   * - `postal-code`
   * - `promo-code`
   * - `street-address`
   * - `sms-otp`
   * - `tel`
   * - `tel-country-code`
   * - `tel-national`
   * - `tel-device`
   * - `upi-vpa`
   * - `wifi-password`
   * - `username`
   * - `username-new`
   * - `off`
   *
   * @platform android
   */
  autoComplete?: WithDefault<
    | '2fa-app-otp'
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
    | 'email'
    | 'email-otp'
    | 'flight-confirmation-code'
    | 'flight-number'
    | 'gender'
    | 'gift-card-number'
    | 'gift-card-pin'
    | 'loyalty-account-number'
    | 'name'
    | 'name-family'
    | 'name-given'
    | 'name-middle'
    | 'name-middle-initial'
    | 'name-prefix'
    | 'name-suffix'
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
    | 'wifi-password'
    | 'username'
    | 'username-new'
    | 'off',
    'off',
  >,

  /**
   * Sets the return key to the label. Use it instead of `returnKeyType`.
   * @platform android
   */
  returnKeyLabel?: ?string,

  /**
   * Sets the number of lines for a `TextInput`. Use it with multiline set to
   * `true` to be able to fill the lines.
   * @platform android
   */
  numberOfLines?: ?Int32,

  /**
   * When `false`, if there is a small amount of space available around a text input
   * (e.g. landscape orientation on a phone), the OS may choose to have the user edit
   * the text inside of a full screen text input mode. When `true`, this feature is
   * disabled and users will always edit the text directly inside of the text input.
   * Defaults to `false`.
   * @platform android
   */
  disableFullscreenUI?: ?boolean,

  /**
   * Set text break strategy on Android API Level 23+, possible values are `simple`, `highQuality`, `balanced`
   * The default value is `simple`.
   * @platform android
   */
  textBreakStrategy?: WithDefault<
    'simple' | 'highQuality' | 'balanced',
    'simple',
  >,

  /**
   * The color of the `TextInput` underline.
   * @platform android
   */
  underlineColorAndroid?: ?ColorValue,

  /**
   * If defined, the provided image resource will be rendered on the left.
   * The image resource must be inside `/android/app/src/main/res/drawable` and referenced
   * like
   * ```
   * <TextInput
   *  inlineImageLeft='search_icon'
   * />
   * ```
   * @platform android
   */
  inlineImageLeft?: ?string,

  /**
   * Padding between the inline image, if any, and the text input itself.
   * @platform android
   */
  inlineImagePadding?: ?Int32,

  importantForAutofill?: string /*?(
    | 'auto'
    | 'no'
    | 'noExcludeDescendants'
    | 'yes'
    | 'yesExcludeDescendants'
  ),*/,

  /**
   * When `false`, it will prevent the soft keyboard from showing when the field is focused.
   * Defaults to `true`.
   */
  showSoftInputOnFocus?: ?boolean,

  /**
   * TextInput props after this
   */
  /**
   * Can tell `TextInput` to automatically capitalize certain characters.
   *
   * - `characters`: all characters.
   * - `words`: first letter of each word.
   * - `sentences`: first letter of each sentence (*default*).
   * - `none`: don't auto capitalize anything.
   */
  autoCapitalize?: WithDefault<
    'none' | 'sentences' | 'words' | 'characters',
    'none',
  >,

  /**
   * If `false`, disables auto-correct. The default value is `true`.
   */
  autoCorrect?: ?boolean,

  /**
   * If `true`, focuses the input on `componentDidMount`.
   * The default value is `false`.
   */
  autoFocus?: ?boolean,

  /**
   * Specifies whether fonts should scale to respect Text Size accessibility settings. The
   * default is `true`.
   */
  allowFontScaling?: ?boolean,

  /**
   * Specifies largest possible scale a font can reach when `allowFontScaling` is enabled.
   * Possible values:
   * `null/undefined` (default): inherit from the parent node or the global default (0)
   * `0`: no max, ignore parent/global default
   * `>= 1`: sets the maxFontSizeMultiplier of this node to this value
   */
  maxFontSizeMultiplier?: ?Float,

  /**
   * If `false`, text is not editable. The default value is `true`.
   */
  editable?: ?boolean,

  /**
   * Determines which keyboard to open, e.g.`numeric`.
   *
   * The following values work across platforms:
   *
   * - `default`
   * - `numeric`
   * - `number-pad`
   * - `decimal-pad`
   * - `email-address`
   * - `phone-pad`
   * - `url`
   *
   * *Android Only*
   *
   * The following values work on Android only:
   *
   * - `visible-password`
   */
  keyboardType?: WithDefault<KeyboardType, 'default'>,

  /**
   * Determines how the return key should look. On Android you can also use
   * `returnKeyLabel`.
   *
   * *Cross platform*
   *
   * The following values work across platforms:
   *
   * - `done`
   * - `go`
   * - `next`
   * - `search`
   * - `send`
   *
   * *Android Only*
   *
   * The following values work on Android only:
   *
   * - `none`
   * - `previous`
   */
  returnKeyType?: WithDefault<ReturnKeyType, 'done'>,

  /**
   * Limits the maximum number of characters that can be entered. Use this
   * instead of implementing the logic in JS to avoid flicker.
   */
  maxLength?: ?Int32,

  /**
   * If `true`, the text input can be multiple lines.
   * The default value is `false`.
   */
  multiline?: ?boolean,

  /**
   * Callback that is called when the text input is blurred.
   * `target` is the reactTag of the element
   */
  onBlur?: ?BubblingEventHandler<Readonly<{target: Int32}>>,

  /**
   * Callback that is called when the text input is focused.
   * `target` is the reactTag of the element
   */
  onFocus?: ?BubblingEventHandler<Readonly<{target: Int32}>>,

  /**
   * Callback that is called when the text input's text changes.
   * `target` is the reactTag of the element
   * TODO: differentiate between onChange and onChangeText
   */
  onChange?: ?BubblingEventHandler<
    Readonly<{target: Int32, eventCount: Int32, text: string}>,
  >,

  /**
   * Callback that is called when the text input's text changes.
   * Changed text is passed as an argument to the callback handler.
   * TODO: differentiate between onChange and onChangeText
   */
  onChangeText?: ?BubblingEventHandler<
    Readonly<{target: Int32, eventCount: Int32, text: string}>,
  >,

  /**
   * Callback that is called when the text input's content size changes.
   * This will be called with
   * `{ nativeEvent: { contentSize: { width, height } } }`.
   *
   * Only called for multiline text inputs.
   */
  onContentSizeChange?: ?DirectEventHandler<
    Readonly<{
      target: Int32,
      contentSize: Readonly<{width: Double, height: Double}>,
    }>,
  >,

  /**
   * Callback that is called when text input ends.
   */
  onEndEditing?: ?BubblingEventHandler<Readonly<{target: Int32, text: string}>>,

  /**
   * Callback that is called when the text input selection is changed.
   * This will be called with
   * `{ nativeEvent: { selection: { start, end } } }`.
   */
  onSelectionChange?: ?DirectEventHandler<
    Readonly<{
      target: Int32,
      selection: Readonly<{start: Double, end: Double}>,
    }>,
  >,

  /**
   * Callback that is called when the text input's submit button is pressed.
   * Invalid if `multiline={true}` is specified.
   */
  onSubmitEditing?: ?BubblingEventHandler<
    Readonly<{target: Int32, text: string}>,
  >,

  /**
   * Callback that is called when a key is pressed.
   * This will be called with `{ nativeEvent: { key: keyValue } }`
   * where `keyValue` is `'Enter'` or `'Backspace'` for respective keys and
   * the typed-in character otherwise including `' '` for space.
   * Fires before `onChange` callbacks.
   */
  onKeyPress?: ?BubblingEventHandler<Readonly<{target: Int32, key: string}>>,

  /**
   * Invoked on content scroll with `{ nativeEvent: { contentOffset: { x, y } } }`.
   * May also contain other properties from ScrollEvent but on Android contentSize
   * is not provided for performance reasons.
   */
  onScroll?: ?DirectEventHandler<
    Readonly<{
      target: Int32,
      responderIgnoreScroll: boolean,
      contentInset: Readonly<{
        top: Double, // always 0 on Android
        bottom: Double, // always 0 on Android
        left: Double, // always 0 on Android
        right: Double, // always 0 on Android
      }>,
      contentOffset: Readonly<{
        x: Double,
        y: Double,
      }>,
      contentSize: Readonly<{
        width: Double, // always 0 on Android
        height: Double, // always 0 on Android
      }>,
      layoutMeasurement: Readonly<{
        width: Double,
        height: Double,
      }>,
      velocity: Readonly<{
        x: Double, // always 0 on Android
        y: Double, // always 0 on Android
      }>,
    }>,
  >,

  /**
   * The string that will be rendered before text input has been entered.
   */
  placeholder?: ?Stringish,

  /**
   * The text color of the placeholder string.
   */
  placeholderTextColor?: ?ColorValue,

  /**
   * If `true`, the text input obscures the text entered so that sensitive text
   * like passwords stay secure. The default value is `false`. Does not work with 'multiline={true}'.
   */
  secureTextEntry?: ?boolean,

  /**
   * The highlight and cursor color of the text input.
   */
  selectionColor?: ?ColorValue,

  /**
   * The text selection handle color.
   */
  selectionHandleColor?: ?ColorValue,

  /**
   * The start and end of the text input's selection. Set start and end to
   * the same value to position the cursor.
   */
  selection?: ?Readonly<{
    start: Int32,
    end?: ?Int32,
  }>,

  /**
   * The value to show for the text input. `TextInput` is a controlled
   * component, which means the native value will be forced to match this
   * value prop if provided. For most uses, this works great, but in some
   * cases this may cause flickering - one common cause is preventing edits
   * by keeping value the same. In addition to simply setting the same value,
   * either set `editable={false}`, or set/update `maxLength` to prevent
   * unwanted edits without flicker.
   */
  value?: ?string,

  /**
   * Provides an initial value that will change when the user starts typing.
   * Useful for simple use-cases where you do not want to deal with listening
   * to events and updating the value prop to keep the controlled state in sync.
   */
  defaultValue?: ?string,

  /**
   * If `true`, all text will automatically be selected on focus.
   */
  selectTextOnFocus?: ?boolean,

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
  blurOnSubmit?: ?boolean,

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
  submitBehavior?: ?SubmitBehavior,

  /**
   * Note that not all Text styles are supported, an incomplete list of what is not supported includes:
   *
   * - `borderLeftWidth`
   * - `borderTopWidth`
   * - `borderRightWidth`
   * - `borderBottomWidth`
   * - `borderTopLeftRadius`
   * - `borderTopRightRadius`
   * - `borderBottomRightRadius`
   * - `borderBottomLeftRadius`
   *
   * see [Issue#7070](https://github.com/facebook/react-native/issues/7070)
   * for more detail.
   *
   * [Styles](docs/style.html)
   */
  // TODO: figure out what to do with this style prop for codegen/Fabric purposes
  // This must be commented for Fabric codegen to work; it's currently not possible
  // to override the default View style prop in codegen.
  style?: ?TextStyleProp,

  /**
   * If `true`, caret is hidden. The default value is `false`.
   * This property is supported only for single-line TextInput component on iOS.
   */
  caretHidden?: ?boolean,

  /*
   * If `true`, contextMenuHidden is hidden. The default value is `false`.
   */
  contextMenuHidden?: ?boolean,

  /**
   * The following are props that `BaseTextShadowNode` takes. It is unclear if they
   * are used by TextInput.
   */
  textShadowColor?: ?ColorValue,
  textShadowRadius?: ?Float,
  textDecorationLine?: ?string,
  fontStyle?: ?string,
  textShadowOffset?: ?Readonly<{width?: ?Double, height?: ?Double}>,
  lineHeight?: ?Float,
  textTransform?: ?string,
  color?: ?Int32,
  letterSpacing?: ?Float,
  fontSize?: ?Float,
  textAlign?: ?string,
  includeFontPadding?: ?boolean,
  fontWeight?: ?string,
  fontFamily?: ?string,

  /**
   * I cannot find where these are defined but JS complains without them.
   */
  textAlignVertical?: ?string,
  cursorColor?: ?ColorValue,

  /**
   * "Private" fields used by TextInput.js and not users of this component directly
   */
  mostRecentEventCount: Int32,
  text?: ?string,
}>;

type NativeType = HostComponent<AndroidTextInputNativeProps>;

type NativeCommands = TextInputNativeCommands<NativeType>;

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['focus', 'blur', 'setTextAndSelection'],
});

export const __INTERNAL_VIEW_CONFIG: PartialViewConfig = {
  uiViewClassName: 'AndroidTextInput',
  bubblingEventTypes: {
    topEndEditing: {
      phasedRegistrationNames: {
        bubbled: 'onEndEditing',
        captured: 'onEndEditingCapture',
      },
    },
    topKeyPress: {
      phasedRegistrationNames: {
        bubbled: 'onKeyPress',
        captured: 'onKeyPressCapture',
      },
    },
    topSubmitEditing: {
      phasedRegistrationNames: {
        bubbled: 'onSubmitEditing',
        captured: 'onSubmitEditingCapture',
      },
    },
  },
  directEventTypes: {
    topScroll: {
      registrationName: 'onScroll',
    },
  },
  validAttributes: {
    acceptDragAndDropTypes: true,
    maxFontSizeMultiplier: true,
    adjustsFontSizeToFit: true,
    minimumFontScale: true,
    autoFocus: true,
    placeholder: true,
    inlineImagePadding: true,
    contextMenuHidden: true,
    textShadowColor: colorAttribute,
    maxLength: true,
    selectTextOnFocus: true,
    textShadowRadius: true,
    underlineColorAndroid: colorAttribute,
    textDecorationLine: true,
    submitBehavior: true,
    textAlignVertical: true,
    fontStyle: true,
    textShadowOffset: true,
    selectionColor: colorAttribute,
    selectionHandleColor: colorAttribute,
    placeholderTextColor: colorAttribute,
    importantForAutofill: true,
    lineHeight: true,
    textTransform: true,
    returnKeyType: true,
    keyboardType: true,
    multiline: true,
    color: colorAttribute,
    autoComplete: true,
    numberOfLines: true,
    letterSpacing: true,
    returnKeyLabel: true,
    fontSize: true,
    onKeyPress: true,
    cursorColor: colorAttribute,
    text: true,
    showSoftInputOnFocus: true,
    textAlign: true,
    autoCapitalize: true,
    autoCorrect: true,
    caretHidden: true,
    secureTextEntry: true,
    textBreakStrategy: true,
    onScroll: true,
    onContentSizeChange: true,
    disableFullscreenUI: true,
    includeFontPadding: true,
    fontWeight: true,
    fontFamily: true,
    allowFontScaling: true,
    onSelectionChange: true,
    mostRecentEventCount: true,
    inlineImageLeft: true,
    editable: true,
    fontVariant: true,
    borderBottomRightRadius: true,
    borderBottomColor: colorAttribute,
    borderRadius: true,
    borderRightColor: colorAttribute,
    borderColor: colorAttribute,
    borderTopRightRadius: true,
    borderStyle: true,
    borderBottomLeftRadius: true,
    borderLeftColor: colorAttribute,
    borderTopLeftRadius: true,
    borderTopColor: colorAttribute,
  },
};

let AndroidTextInputNativeComponent =
  NativeComponentRegistry.get<AndroidTextInputNativeProps>(
    'AndroidTextInput',
    () => __INTERNAL_VIEW_CONFIG,
  );

// flowlint-next-line unclear-type:off
export default AndroidTextInputNativeComponent as any as HostComponent<AndroidTextInputNativeProps>;
