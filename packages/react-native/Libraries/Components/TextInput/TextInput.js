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
import type {____TextStyle_Internal as TextStyleInternal} from '../../StyleSheet/StyleSheetTypes';
import type {
  BlurEvent,
  FocusEvent,
  GestureResponderEvent,
  ScrollEvent,
} from '../../Types/CoreEventTypes';
import type {
  AutoCapitalize,
  EnterKeyHintType,
  EnterKeyHintTypeAndroid,
  EnterKeyHintTypeIOS,
  EnterKeyHintTypeOptions,
  InputModeOptions,
  KeyboardType,
  KeyboardTypeAndroid,
  KeyboardTypeIOS,
  KeyboardTypeOptions,
  ReturnKeyType,
  ReturnKeyTypeAndroid,
  ReturnKeyTypeIOS,
  ReturnKeyTypeOptions,
  Selection,
  SubmitBehavior,
  TextContentType,
  TextInputAndroidProps,
  TextInputBlurEvent,
  TextInputChangeEvent,
  TextInputContentSizeChangeEvent,
  TextInputEditingEvent,
  TextInputEndEditingEvent,
  TextInputEvent,
  TextInputFocusEvent,
  TextInputInstance,
  TextInputIOSProps,
  TextInputKeyPressEvent,
  TextInputProps,
  TextInputSelectionChangeEvent,
  TextInputSubmitEditingEvent,
  TextInputType,
} from './TextInput.flow';

import usePressability from '../../Pressability/usePressability';
import flattenStyle from '../../StyleSheet/flattenStyle';
import StyleSheet, {type TextStyleProp} from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import TextAncestorContext from '../../Text/TextAncestorContext';
import Platform from '../../Utilities/Platform';
import useMergeRefs from '../../Utilities/useMergeRefs';
import TextInputState from './TextInputState';
import invariant from 'invariant';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {useCallback, useLayoutEffect, useMemo, useRef, useState} from 'react';

let AndroidTextInput;
let AndroidTextInputCommands;
let RCTSinglelineTextInputView;
let RCTSinglelineTextInputNativeCommands;
let RCTMultilineTextInputView;
let RCTMultilineTextInputNativeCommands;

if (Platform.OS === 'android') {
  AndroidTextInput = require('./AndroidTextInputNativeComponent').default;
  AndroidTextInputCommands =
    require('./AndroidTextInputNativeComponent').Commands;
} else if (Platform.OS === 'ios') {
  RCTSinglelineTextInputView =
    require('./RCTSingelineTextInputNativeComponent').default;
  RCTSinglelineTextInputNativeCommands =
    require('./RCTSingelineTextInputNativeComponent').Commands;
  RCTMultilineTextInputView =
    require('./RCTMultilineTextInputNativeComponent').default;
  RCTMultilineTextInputNativeCommands =
    require('./RCTMultilineTextInputNativeComponent').Commands;
}

export type {
  AutoCapitalize,
  BlurEvent,
  EnterKeyHintType,
  EnterKeyHintTypeAndroid,
  EnterKeyHintTypeIOS,
  EnterKeyHintTypeOptions,
  FocusEvent,
  InputModeOptions,
  KeyboardType,
  KeyboardTypeAndroid,
  KeyboardTypeIOS,
  KeyboardTypeOptions,
  ReturnKeyType,
  ReturnKeyTypeAndroid,
  ReturnKeyTypeIOS,
  ReturnKeyTypeOptions,
  SubmitBehavior,
  TextContentType,
  TextInputAndroidProps,
  TextInputBlurEvent,
  TextInputChangeEvent,
  TextInputContentSizeChangeEvent,
  TextInputEditingEvent,
  TextInputEndEditingEvent,
  TextInputEvent,
  TextInputFocusEvent,
  TextInputIOSProps,
  TextInputKeyPressEvent,
  TextInputProps,
  TextInputSelectionChangeEvent,
  TextInputInstance,
  TextInputSubmitEditingEvent,
};

type TextInputStateType = Readonly<{
  /**
   * @deprecated Use currentlyFocusedInput
   * Returns the ID of the currently focused text field, if one exists
   * If no text field is focused it returns null
   */
  currentlyFocusedField: () => ?number,

  /**
   * Returns the ref of the currently focused text field, if one exists
   * If no text field is focused it returns null
   */
  currentlyFocusedInput: () => ?HostInstance,

  /**
   * @param textField ref of the text field to focus
   * Focuses the specified text field
   * noop if the text field was already focused
   */
  focusTextInput: (textField: ?HostInstance) => void,

  /**
   * @param textField ref of the text field to focus
   * Unfocuses the specified text field
   * noop if it wasn't focused
   */
  blurTextInput: (textField: ?HostInstance) => void,
}>;

type ViewCommands = NonNullable<
  | typeof AndroidTextInputCommands
  | typeof RCTMultilineTextInputNativeCommands
  | typeof RCTSinglelineTextInputNativeCommands,
>;

type LastNativeSelection = {
  selection: Selection,
  mostRecentEventCount: number,
};

const emptyFunctionThatReturnsTrue = () => true;

/**
 * This hook handles the synchronization between the state of the text input
 * in native and in JavaScript. This is necessary due to the asynchronous nature
 * of text input events.
 */
function useTextInputStateSynchronization({
  props,
  mostRecentEventCount,
  selection,
  inputRef,
  text,
  viewCommands,
}: {
  props: TextInputProps,
  mostRecentEventCount: number,
  selection: ?Selection,
  inputRef: React.RefObject<null | TextInputInstance>,
  text?: string,
  viewCommands: ViewCommands,
}): {
  setLastNativeText: string => void,
  setLastNativeSelection: LastNativeSelection => void,
} {
  const [lastNativeText, setLastNativeText] = useState<?Stringish>(props.value);
  const [lastNativeSelectionState, setLastNativeSelection] =
    useState<LastNativeSelection>({
      mostRecentEventCount,
      selection: {end: -1, start: -1},
    });

  const lastNativeSelection = lastNativeSelectionState.selection;

  // This is necessary in case native updates the text and JS decides
  // that the update should be ignored and we should stick with the value
  // that we have in JS.
  useLayoutEffect(() => {
    const nativeUpdate: {text?: string, selection?: Selection} = {};

    if (lastNativeText !== props.value && typeof props.value === 'string') {
      nativeUpdate.text = props.value;
      setLastNativeText(props.value);
    }

    if (
      selection &&
      lastNativeSelection &&
      (lastNativeSelection.start !== selection.start ||
        lastNativeSelection.end !== selection.end)
    ) {
      nativeUpdate.selection = selection;
      setLastNativeSelection({mostRecentEventCount, selection});
    }

    if (Object.keys(nativeUpdate).length === 0) {
      return;
    }

    if (inputRef.current != null) {
      viewCommands.setTextAndSelection(
        inputRef.current,
        mostRecentEventCount,
        text,
        selection?.start ?? -1,
        selection?.end ?? -1,
      );
    }
  }, [
    mostRecentEventCount,
    inputRef,
    props.value,
    props.defaultValue,
    lastNativeText,
    selection,
    lastNativeSelection,
    text,
    viewCommands,
  ]);

  return {setLastNativeSelection, setLastNativeText};
}

function InternalTextInput(props: TextInputProps): React.Node {
  const {
    'aria-busy': ariaBusy,
    'aria-checked': ariaChecked,
    'aria-disabled': ariaDisabled,
    'aria-expanded': ariaExpanded,
    'aria-selected': ariaSelected,
    accessibilityState,
    id,
    tabIndex,
    selection: propsSelection,
    selectionColor,
    selectionHandleColor,
    cursorColor,
    ...otherProps
  } = props;

  const inputRef = useRef<null | TextInputInstance>(null);

  const selection: ?Selection =
    propsSelection == null
      ? null
      : {
          end: propsSelection.end ?? propsSelection.start,
          start: propsSelection.start,
        };

  const text =
    typeof props.value === 'string'
      ? props.value
      : typeof props.defaultValue === 'string'
        ? props.defaultValue
        : undefined;

  const viewCommands =
    AndroidTextInputCommands ||
    (props.multiline === true
      ? RCTMultilineTextInputNativeCommands
      : RCTSinglelineTextInputNativeCommands);

  const [mostRecentEventCount, setMostRecentEventCount] = useState<number>(0);
  const {setLastNativeText, setLastNativeSelection} =
    useTextInputStateSynchronization({
      inputRef,
      mostRecentEventCount,
      props,
      selection,
      text,
      viewCommands,
    });

  useLayoutEffect(() => {
    const inputRefValue = inputRef.current;

    if (inputRefValue != null) {
      TextInputState.registerInput(inputRefValue);

      return () => {
        if (TextInputState.currentlyFocusedInput() === inputRefValue) {
          nullthrows(inputRefValue).blur();
        }

        TextInputState.unregisterInput(inputRefValue);
      };
    }
  }, []);

  const setLocalRef = useCallback(
    (instance: HostInstance | null) => {
      // $FlowExpectedError[incompatible-type]
      inputRef.current = instance;

      /*
      Hi reader from the future. I'm sorry for this.

      This is a hack. Ideally we would forwardRef to the underlying
      host component. However, since TextInput has it's own methods that can be
      called as well, if we used the standard forwardRef then these
      methods wouldn't be accessible and thus be a breaking change.

      We have a couple of options of how to handle this:
      - Return a new ref with everything we methods from both. This is problematic
        because we need React to also know it is a host component which requires
        internals of the class implementation of the ref.
      - Break the API and have some other way to call one set of the methods or
        the other. This is our long term approach as we want to eventually
        get the methods on host components off the ref. So instead of calling
        ref.measure() you might call ReactNative.measure(ref). This would hopefully
        let the ref for TextInput then have the methods like `.clear`. Or we do it
        the other way and make it TextInput.clear(textInputRef) which would be fine
        too. Either way though is a breaking change that is longer term.
      - Mutate this ref. :( Gross, but accomplishes what we need in the meantime
        before we can get to the long term breaking change.
      */
      if (instance != null) {
        // Register the input immediately when the ref is set so that focus()
        // can be called from ref callbacks
        // Double registering during useLayoutEffect is fine, because the underlying
        // state is a Set.
        TextInputState.registerInput(instance);

        // $FlowFixMe[prop-missing] - See the explanation above.
        // $FlowFixMe[unsafe-object-assign]
        Object.assign(instance, {
          clear(): void {
            if (inputRef.current != null) {
              viewCommands.setTextAndSelection(
                inputRef.current,
                mostRecentEventCount,
                '',
                0,
                0,
              );
            }
          },
          getNativeRef(): ?TextInputInstance {
            return inputRef.current;
          },
          isFocused(): boolean {
            const currentlyFocusedInput =
              TextInputState.currentlyFocusedInput();
            return (
              currentlyFocusedInput != null &&
              currentlyFocusedInput === inputRef.current
            );
          },
          setSelection(start: number, end: number): void {
            if (inputRef.current != null) {
              viewCommands.setTextAndSelection(
                inputRef.current,
                mostRecentEventCount,
                null,
                start,
                end,
              );
            }
          },
        });
      }
    },
    [mostRecentEventCount, viewCommands],
  );

  // $FlowExpectedError[incompatible-type]
  const ref = useMergeRefs<HostInstance>(setLocalRef, props.forwardedRef);

  const _onChange = (event: TextInputChangeEvent) => {
    const currentText = event.nativeEvent.text;
    props.onChange && props.onChange(event);
    props.onChangeText && props.onChangeText(currentText);

    if (inputRef.current == null) {
      // calling `props.onChange` or `props.onChangeText`
      // may clean up the input itself. Exits here.
      return;
    }

    setLastNativeText(currentText);
    // This must happen last, after we call setLastNativeText.
    // Different ordering can cause bugs when editing AndroidTextInputs
    // with multiple Fragments.
    // We must update this so that controlled input updates work.
    setMostRecentEventCount(event.nativeEvent.eventCount);
  };

  const _onSelectionChange = (event: TextInputSelectionChangeEvent) => {
    props.onSelectionChange && props.onSelectionChange(event);

    if (inputRef.current == null) {
      // calling `props.onSelectionChange`
      // may clean up the input itself. Exits here.
      return;
    }

    setLastNativeSelection({
      mostRecentEventCount,
      selection: event.nativeEvent.selection,
    });
  };

  const _onFocus = (event: FocusEvent) => {
    TextInputState.focusInput(inputRef.current);
    if (props.onFocus) {
      props.onFocus(event);
    }
  };

  const _onBlur = (event: BlurEvent) => {
    TextInputState.blurInput(inputRef.current);
    if (props.onBlur) {
      props.onBlur(event);
    }
  };

  const _onScroll = (event: ScrollEvent) => {
    props.onScroll && props.onScroll(event);
  };

  let textInput = null;

  const multiline = props.multiline ?? false;

  let submitBehavior: SubmitBehavior;
  if (props.submitBehavior != null) {
    // `submitBehavior` is set explicitly
    if (!multiline && props.submitBehavior === 'newline') {
      // For single line text inputs, `'newline'` is not a valid option
      submitBehavior = 'blurAndSubmit';
    } else {
      submitBehavior = props.submitBehavior;
    }
  } else if (multiline) {
    if (props.blurOnSubmit === true) {
      submitBehavior = 'blurAndSubmit';
    } else {
      submitBehavior = 'newline';
    }
  } else {
    // Single line
    if (props.blurOnSubmit !== false) {
      submitBehavior = 'blurAndSubmit';
    } else {
      submitBehavior = 'submit';
    }
  }

  const accessible = props.accessible !== false;
  const focusable = props.focusable !== false;

  const {
    editable,
    hitSlop,
    onPress,
    onPressIn,
    onPressOut,
    rejectResponderTermination,
  } = props;

  const config = useMemo(
    () => ({
      cancelable: Platform.OS === 'ios' ? !rejectResponderTermination : null,
      hitSlop,
      onPress: (event: GestureResponderEvent) => {
        onPress?.(event);
        if (editable !== false) {
          if (inputRef.current != null) {
            inputRef.current.focus();
          }
        }
      },
      onPressIn,
      onPressOut,
    }),
    [
      editable,
      hitSlop,
      onPress,
      onPressIn,
      onPressOut,
      rejectResponderTermination,
    ],
  );

  // Hide caret during test runs due to a flashing caret
  // makes screenshot tests flakey
  let caretHidden = props.caretHidden;
  if (Platform.isTesting) {
    caretHidden = true;
  }

  // TextInput handles onBlur and onFocus events
  // so omitting onBlur and onFocus pressability handlers here.
  const {onBlur, onFocus, ...eventHandlers} = usePressability(config);

  const _accessibilityLabel =
    props?.['aria-label'] ?? props?.accessibilityLabel;

  let _accessibilityState;
  if (
    accessibilityState != null ||
    ariaBusy != null ||
    ariaChecked != null ||
    ariaDisabled != null ||
    ariaExpanded != null ||
    ariaSelected != null
  ) {
    _accessibilityState = {
      busy: ariaBusy ?? accessibilityState?.busy,
      checked: ariaChecked ?? accessibilityState?.checked,
      disabled: ariaDisabled ?? accessibilityState?.disabled,
      expanded: ariaExpanded ?? accessibilityState?.expanded,
      selected: ariaSelected ?? accessibilityState?.selected,
    };
  }

  // Keep the original (potentially nested) style when possible, as React can diff these more efficiently
  let _style = props.style;
  const flattenedStyle = flattenStyle<TextStyleProp>(props.style);
  if (flattenedStyle != null) {
    let overrides: ?{...TextStyleInternal} = null;
    if (typeof flattenedStyle?.fontWeight === 'number') {
      overrides = overrides || ({} as {...TextStyleInternal});
      overrides.fontWeight =
        // $FlowFixMe[incompatible-type]
        flattenedStyle.fontWeight.toString() as TextStyleInternal['fontWeight'];
    }

    if (flattenedStyle.verticalAlign != null) {
      overrides = overrides || ({} as {...TextStyleInternal});
      overrides.textAlignVertical =
        verticalAlignToTextAlignVerticalMap[flattenedStyle.verticalAlign];
      overrides.verticalAlign = undefined;
    }

    if (overrides != null) {
      // $FlowFixMe[incompatible-type]
      _style = [_style, overrides];
    }
  }

  if (Platform.OS === 'ios') {
    const RCTTextInputView =
      props.multiline === true
        ? RCTMultilineTextInputView
        : RCTSinglelineTextInputView;

    const useMultilineDefaultStyle =
      props.multiline === true &&
      (flattenedStyle == null ||
        (flattenedStyle.padding == null &&
          flattenedStyle.paddingVertical == null &&
          flattenedStyle.paddingTop == null));

    const _accessibilityElementsHidden =
      props['aria-hidden'] ?? props.accessibilityElementsHidden;

    textInput = (
      <RCTTextInputView
        // Figure out imperative + forward refs.
        ref={ref as $FlowFixMe}
        {...otherProps}
        {...eventHandlers}
        acceptDragAndDropTypes={props.experimental_acceptDragAndDropTypes}
        accessibilityLabel={_accessibilityLabel}
        accessibilityState={_accessibilityState}
        accessibilityElementsHidden={_accessibilityElementsHidden}
        accessible={accessible}
        submitBehavior={submitBehavior}
        caretHidden={caretHidden}
        dataDetectorTypes={props.dataDetectorTypes}
        focusable={tabIndex !== undefined ? !tabIndex : focusable}
        mostRecentEventCount={mostRecentEventCount}
        nativeID={id ?? props.nativeID}
        numberOfLines={props.rows ?? props.numberOfLines}
        onBlur={_onBlur}
        onChange={_onChange}
        onContentSizeChange={props.onContentSizeChange}
        onFocus={_onFocus}
        onScroll={_onScroll}
        onSelectionChange={_onSelectionChange}
        onSelectionChangeShouldSetResponder={emptyFunctionThatReturnsTrue}
        selection={selection}
        selectionColor={selectionColor}
        style={StyleSheet.compose(
          useMultilineDefaultStyle ? styles.multilineDefault : null,
          _style,
        )}
        text={text}
      />
    );
  } else if (Platform.OS === 'android') {
    const autoCapitalize = props.autoCapitalize || 'sentences';
    const _accessibilityLabelledBy =
      props?.['aria-labelledby'] ?? props?.accessibilityLabelledBy;
    const _importantForAccessibility =
      props['aria-hidden'] === true
        ? ('no-hide-descendants' as const)
        : undefined;
    const placeholder = props.placeholder ?? '';
    let children = props.children;
    const childCount = React.Children.count(children);
    invariant(
      !(props.value != null && childCount),
      'Cannot specify both value and children.',
    );
    if (childCount > 1) {
      children = <Text>{children}</Text>;
    }
    // For consistency with iOS set cursor/selectionHandle color as selectionColor
    const colorProps = {
      cursorColor: cursorColor === undefined ? selectionColor : cursorColor,
      selectionColor,
      selectionHandleColor:
        selectionHandleColor === undefined
          ? selectionColor
          : selectionHandleColor,
    };
    textInput =
      (
        /* $FlowFixMe[prop-missing] the types for AndroidTextInput don't match up
         * exactly with the props for TextInput. This will need to get fixed */
        /* $FlowFixMe[incompatible-type] the types for AndroidTextInput don't
         * match up exactly with the props for TextInput. This will need to get
         * fixed */
        /* $FlowFixMe[incompatible-type-arg] the types for AndroidTextInput don't
         * match up exactly with the props for TextInput. This will need to get
         * fixed */
        <AndroidTextInput
          // Figure out imperative + forward refs.
          ref={ref as $FlowFixMe}
          {...otherProps}
          {...colorProps}
          {...eventHandlers}
          accessibilityLabel={_accessibilityLabel}
          accessibilityLabelledBy={_accessibilityLabelledBy}
          accessibilityState={_accessibilityState}
          accessible={accessible}
          acceptDragAndDropTypes={props.experimental_acceptDragAndDropTypes}
          autoCapitalize={autoCapitalize}
          submitBehavior={submitBehavior}
          caretHidden={caretHidden}
          children={children}
          disableFullscreenUI={props.disableFullscreenUI}
          focusable={tabIndex !== undefined ? !tabIndex : focusable}
          importantForAccessibility={_importantForAccessibility}
          mostRecentEventCount={mostRecentEventCount}
          nativeID={id ?? props.nativeID}
          numberOfLines={props.rows ?? props.numberOfLines}
          onBlur={_onBlur}
          onChange={_onChange}
          onFocus={_onFocus}
          /* $FlowFixMe[prop-missing] the types for AndroidTextInput don't match
           * up exactly with the props for TextInput. This will need to get fixed
           */
          /* $FlowFixMe[incompatible-type] the types for AndroidTextInput
           * don't match up exactly with the props for TextInput. This will need
           * to get fixed */
          onScroll={_onScroll}
          onSelectionChange={_onSelectionChange}
          placeholder={placeholder}
          style={_style}
          text={text}
          textBreakStrategy={props.textBreakStrategy}
        />
      );
  }
  return <TextAncestorContext value={true}>{textInput}</TextAncestorContext>;
}

const enterKeyHintToReturnTypeMap = {
  done: 'done',
  enter: 'default',
  go: 'go',
  next: 'next',
  previous: 'previous',
  search: 'search',
  send: 'send',
} as const;

const inputModeToKeyboardTypeMap = {
  decimal: 'decimal-pad',
  email: 'email-address',
  none: 'default',
  numeric: 'number-pad',
  search:
    Platform.OS === 'ios' ? ('web-search' as const) : ('default' as const),
  tel: 'phone-pad',
  text: 'default',
  url: 'url',
} as const;

// Map HTML autocomplete values to Android autoComplete values
const autoCompleteWebToAutoCompleteAndroidMap = {
  'additional-name': 'name-middle',
  'address-line1': 'postal-address-region',
  'address-line2': 'postal-address-locality',
  bday: 'birthdate-full',
  'bday-day': 'birthdate-day',
  'bday-month': 'birthdate-month',
  'bday-year': 'birthdate-year',
  'cc-csc': 'cc-csc',
  'cc-exp': 'cc-exp',
  'cc-exp-month': 'cc-exp-month',
  'cc-exp-year': 'cc-exp-year',
  'cc-number': 'cc-number',
  country: 'postal-address-country',
  'current-password': 'password',
  email: 'email',
  'family-name': 'name-family',
  'given-name': 'name-given',
  'honorific-prefix': 'name-prefix',
  'honorific-suffix': 'name-suffix',
  name: 'name',
  'new-password': 'password-new',
  off: 'off',
  'one-time-code': 'sms-otp',
  'postal-code': 'postal-code',
  sex: 'gender',
  'street-address': 'street-address',
  tel: 'tel',
  'tel-country-code': 'tel-country-code',
  'tel-national': 'tel-national',
  username: 'username',
} as const;

// Map HTML autocomplete values to iOS textContentType values
const autoCompleteWebToTextContentTypeMap = {
  'additional-name': 'middleName',
  'address-line1': 'streetAddressLine1',
  'address-line2': 'streetAddressLine2',
  bday: 'birthdate',
  'bday-day': 'birthdateDay',
  'bday-month': 'birthdateMonth',
  'bday-year': 'birthdateYear',
  'cc-additional-name': 'creditCardMiddleName',
  'cc-csc': 'creditCardSecurityCode',
  'cc-exp': 'creditCardExpiration',
  'cc-exp-month': 'creditCardExpirationMonth',
  'cc-exp-year': 'creditCardExpirationYear',
  'cc-family-name': 'creditCardFamilyName',
  'cc-given-name': 'creditCardGivenName',
  'cc-name': 'creditCardName',
  'cc-number': 'creditCardNumber',
  'cc-type': 'creditCardType',
  country: 'countryName',
  'current-password': 'password',
  email: 'emailAddress',
  'family-name': 'familyName',
  'given-name': 'givenName',
  'honorific-prefix': 'namePrefix',
  'honorific-suffix': 'nameSuffix',
  name: 'name',
  'new-password': 'newPassword',
  nickname: 'nickname',
  off: 'none',
  'one-time-code': 'oneTimeCode',
  organization: 'organizationName',
  'organization-title': 'jobTitle',
  'postal-code': 'postalCode',
  'street-address': 'fullStreetAddress',
  tel: 'telephoneNumber',
  url: 'URL',
  username: 'username',
} as const;

/**
 * A foundational component for inputting text into the app via a
 * keyboard. Props provide configurability for several features, such as
 * auto-correction, auto-capitalization, placeholder text, and different keyboard
 * types, such as a numeric keypad.
 *
 * The simplest use case is to plop down a `TextInput` and subscribe to the
 * `onChangeText` events to read the user input. There are also other events,
 * such as `onSubmitEditing` and `onFocus` that can be subscribed to.
 *
 * Example:
 *
 * ```tsx
 * import React, { Component } from 'react';
 * import { AppRegistry, TextInput } from 'react-native';
 *
 * export default class UselessTextInput extends Component {
 *   constructor(props) {
 *     super(props);
 *     this.state = { text: 'Useless Placeholder' };
 *   }
 *
 *   render() {
 *     return (
 *       <TextInput
 *         style={{height: 40, borderColor: 'gray', borderWidth: 1}}
 *         onChangeText={(text) => this.setState({text})}
 *         value={this.state.text}
 *       />
 *     );
 *   }
 * }
 *
 * // skip this line if using Create React Native App
 * AppRegistry.registerComponent('AwesomeProject', () => UselessTextInput);
 * ```
 *
 * Two methods exposed via the native element are .focus() and .blur() that
 * will focus or blur the TextInput programmatically.
 *
 * Note that some props are only available with `multiline={true/false}`.
 * Additionally, border styles that apply to only one side of the element
 * (e.g., `borderBottomColor`, `borderLeftWidth`, etc.) will not be applied if
 * `multiline=false`. To achieve the same effect, you can wrap your `TextInput`
 * in a `View`:
 *
 * Example:
 *
 * ```tsx
 * import React, { Component } from 'react';
 * import { AppRegistry, View, TextInput } from 'react-native';
 *
 * class UselessTextInput extends Component {
 *   render() {
 *     return (
 *       <TextInput
 *         {...this.props} // Inherit any props passed to it; e.g., multiline, numberOfLines below
 *         editable={true}
 *         maxLength={40}
 *       />
 *     );
 *   }
 * }
 *
 * export default class UselessTextInputMultiline extends Component {
 *   constructor(props) {
 *     super(props);
 *     this.state = {
 *       text: 'Useless Multiline Placeholder',
 *     };
 *   }
 *
 *   // If you type something in the text box that is a color, the background will change to that
 *   // color.
 *   render() {
 *     return (
 *      <View style={{
 *        backgroundColor: this.state.text,
 *        borderBottomColor: '#000000',
 *        borderBottomWidth: 1 }}
 *      >
 *        <UselessTextInput
 *          multiline={true}
 *          numberOfLines={4}
 *          onChangeText={(text) => this.setState({text})}
 *          value={this.state.text}
 *        />
 *      </View>
 *     );
 *   }
 * }
 *
 * // skip these lines if using Create React Native App
 * AppRegistry.registerComponent(
 *  'AwesomeProject',
 *  () => UselessTextInputMultiline
 * );
 * ```
 *
 * `TextInput` has by default a border at the bottom of its view. This border
 * has its padding set by the background image provided by the system, and it
 * cannot be changed. Solutions to avoid this is to either not set height
 * explicitly, case in which the system will take care of displaying the border
 * in the correct position, or to not display the border by setting
 * `underlineColorAndroid` to transparent.
 *
 * Note that on Android performing text selection in input can change
 * app's activity `windowSoftInputMode` param to `adjustResize`.
 * This may cause issues with components that have position: 'absolute'
 * while keyboard is active. To avoid this behavior either specify `windowSoftInputMode`
 * in AndroidManifest.xml ( https://developer.android.com/guide/topics/manifest/activity-element.html )
 * or control this param programmatically with native code.
 *
 * @see https://reactnative.dev/docs/textinput
 */
const TextInput: component(
  ref?: React.RefSetter<TextInputInstance>,
  ...props: React.ElementConfig<typeof InternalTextInput>
) = function TextInput({
  ref: forwardedRef,
  allowFontScaling = true,
  rejectResponderTermination = true,
  underlineColorAndroid = 'transparent',
  autoComplete,
  textContentType,
  readOnly,
  editable,
  enterKeyHint,
  returnKeyType,
  inputMode,
  showSoftInputOnFocus,
  keyboardType,
  ...restProps
}: {
  ref?: React.RefSetter<TextInputInstance>,
  ...React.ElementConfig<typeof InternalTextInput>,
}) {
  return (
    <InternalTextInput
      allowFontScaling={allowFontScaling}
      rejectResponderTermination={rejectResponderTermination}
      underlineColorAndroid={underlineColorAndroid}
      editable={readOnly !== undefined ? !readOnly : editable}
      returnKeyType={
        enterKeyHint ? enterKeyHintToReturnTypeMap[enterKeyHint] : returnKeyType
      }
      keyboardType={
        inputMode ? inputModeToKeyboardTypeMap[inputMode] : keyboardType
      }
      showSoftInputOnFocus={
        inputMode == null ? showSoftInputOnFocus : inputMode !== 'none'
      }
      autoComplete={
        Platform.OS === 'android'
          ? // $FlowFixMe[invalid-computed-prop]
            // $FlowFixMe[prop-missing]
            (autoCompleteWebToAutoCompleteAndroidMap[autoComplete] ??
            autoComplete)
          : undefined
      }
      textContentType={
        textContentType != null
          ? textContentType
          : Platform.OS === 'ios' &&
              autoComplete &&
              autoComplete in autoCompleteWebToTextContentTypeMap
            ? // $FlowFixMe[prop-missing]
              autoCompleteWebToTextContentTypeMap[autoComplete]
            : textContentType
      }
      {...restProps}
      forwardedRef={forwardedRef}
    />
  );
};

TextInput.displayName = 'TextInput';

// $FlowFixMe[prop-missing]
TextInput.State = {
  blurTextInput: TextInputState.blurTextInput,
  currentlyFocusedField: TextInputState.currentlyFocusedField,
  currentlyFocusedInput: TextInputState.currentlyFocusedInput,
  focusTextInput: TextInputState.focusTextInput,
};

export type TextInputComponentStatics = Readonly<{
  State: TextInputStateType,
}>;

const styles = StyleSheet.create({
  multilineDefault: {
    // This default top inset makes RCTMultilineTextInputView seem as close as possible
    // to single-line RCTSinglelineTextInputView defaults, using the system defaults
    // of font size 17 and a height of 31 points.
    paddingTop: 5,
  },
});

const verticalAlignToTextAlignVerticalMap = {
  auto: 'auto',
  bottom: 'bottom',
  middle: 'center',
  top: 'top',
} as const;

// $FlowFixMe[unclear-type] Unclear type. Using `any` type is not safe.
export default TextInput as any as TextInputType;
