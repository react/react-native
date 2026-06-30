/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {DialogOptions} from '../NativeModules/specs/NativeDialogManagerAndroid';

import Platform from '../Utilities/Platform';
import {alertWithArgs} from './RCTAlertManager';

/**
 * @platform ios
 */
export type AlertType =
  | 'default'
  | 'plain-text'
  | 'secure-text'
  | 'login-password';

/**
 * @platform ios
 */
export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export type AlertButton = {
  text?: string,
  onPress?: ?((value?: string) => any) | ?Function,
  isPreferred?: boolean,
  style?: AlertButtonStyle,
  ...
};

export type AlertButtons = Array<AlertButton>;

export type AlertOptions = {
  /** @platform android */
  cancelable?: ?boolean,
  userInterfaceStyle?: 'unspecified' | 'light' | 'dark',
  /** @platform android */
  onDismiss?: ?() => void,
  ...
};

/**
 * Launches an alert dialog with the specified title and message.
 *
 * Optionally provide a list of buttons. Tapping any button will fire the
 * respective onPress callback and dismiss the alert. By default, the only
 * button will be an 'OK' button.
 *
 * This is an API that works both on iOS and Android and can show static
 * alerts. On iOS, you can show an alert that prompts the user to enter
 * some information.
 *
 * ## iOS
 *
 * On iOS you can specify any number of buttons. Each button can optionally
 * specify a style, which is one of 'default', 'cancel' or 'destructive'.
 *
 * ## Android
 *
 * On Android at most three buttons can be specified. Android has a concept
 * of a neutral, negative and a positive button:
 *
 *   - If you specify one button, it will be the 'positive' one (such as 'OK')
 *   - Two buttons mean 'negative', 'positive' (such as 'Cancel', 'OK')
 *   - Three buttons mean 'neutral', 'negative', 'positive' (such as 'Later', 'Cancel', 'OK')
 *
 * Example:
 *
 * ```tsx
 * // Works on both iOS and Android
 * Alert.alert(
 *   'Alert Title',
 *   'My Alert Msg',
 *   [
 *     {text: 'Ask me later', onPress: () => console.log('Ask me later pressed')},
 *     {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
 *     {text: 'OK', onPress: () => console.log('OK Pressed')},
 *   ]
 * )
 * ```
 *
 * @see https://reactnative.dev/docs/alert
 */
class Alert {
  /**
   * Display an alert dialog with the specified title, message, and buttons.
   * On Android, at most three buttons can be specified. On iOS, any number of
   * buttons can be used.
   */
  static alert(
    title: ?string,
    message?: ?string,
    buttons?: AlertButtons,
    options?: AlertOptions,
  ): void {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        title,
        message,
        buttons,
        'default',
        undefined,
        undefined,
        options,
      );
    } else if (Platform.OS === 'android') {
      const NativeDialogManagerAndroid =
        require('../NativeModules/specs/NativeDialogManagerAndroid').default;
      if (!NativeDialogManagerAndroid) {
        return;
      }
      const constants = NativeDialogManagerAndroid.getConstants();

      const config: DialogOptions = {
        title: title || '',
        message: message || '',
        cancelable: false,
      };

      if (options && options.cancelable) {
        config.cancelable = options.cancelable;
      }
      // At most three buttons (neutral, negative, positive). Ignore rest.
      // The text 'OK' should be probably localized. iOS Alert does that in native.
      const defaultPositiveText = 'OK';
      const validButtons: AlertButtons = buttons
        ? buttons.slice(0, 3)
        : [{text: defaultPositiveText}];
      const buttonPositive = validButtons.pop();
      const buttonNegative = validButtons.pop();
      const buttonNeutral = validButtons.pop();

      if (buttonNeutral) {
        config.buttonNeutral = buttonNeutral.text || '';
      }
      if (buttonNegative) {
        config.buttonNegative = buttonNegative.text || '';
      }
      if (buttonPositive) {
        config.buttonPositive = buttonPositive.text || defaultPositiveText;
      }

      /* $FlowFixMe[missing-local-annot] The type annotation(s) required by
       * Flow's LTI update could not be added via codemod */
      const onAction = (action, buttonKey) => {
        if (action === constants.buttonClicked) {
          if (buttonKey === constants.buttonNeutral) {
            // $FlowFixMe[incompatible-type]
            // $FlowFixMe[incompatible-use]
            buttonNeutral.onPress && buttonNeutral.onPress();
          } else if (buttonKey === constants.buttonNegative) {
            // $FlowFixMe[incompatible-type]
            // $FlowFixMe[incompatible-use]
            buttonNegative.onPress && buttonNegative.onPress();
          } else if (buttonKey === constants.buttonPositive) {
            // $FlowFixMe[incompatible-type]
            // $FlowFixMe[incompatible-use]
            buttonPositive.onPress && buttonPositive.onPress();
          }
        } else if (action === constants.dismissed) {
          options && options.onDismiss && options.onDismiss();
        }
      };
      const onError = (errorMessage: string) => console.warn(errorMessage);
      NativeDialogManagerAndroid.showAlert(config, onError, onAction);
    }
  }

  /**
   * Create and display a prompt to enter text. Accepts a title, message,
   * callback or buttons, input type, default value, keyboard type, and options.
   *
   * @platform ios
   */
  static prompt(
    title: ?string,
    message?: ?string,
    callbackOrButtons?: ?(((text: string) => void) | AlertButtons),
    type?: ?AlertType = 'plain-text',
    defaultValue?: string,
    keyboardType?: string,
    options?: AlertOptions,
  ): void {
    if (Platform.OS === 'ios') {
      let callbacks: Array<?any> = [];
      const buttons = [];
      let cancelButtonKey;
      let destructiveButtonKey;
      let preferredButtonKey;
      if (typeof callbackOrButtons === 'function') {
        callbacks = [callbackOrButtons];
      } else if (Array.isArray(callbackOrButtons)) {
        callbackOrButtons.forEach((btn, index) => {
          callbacks[index] = btn.onPress;
          if (btn.style === 'cancel') {
            cancelButtonKey = String(index);
          } else if (btn.style === 'destructive') {
            destructiveButtonKey = String(index);
          }
          if (btn.isPreferred) {
            preferredButtonKey = String(index);
          }
          if (btn.text || index < (callbackOrButtons || []).length - 1) {
            const btnDef: {[number]: string} = {};
            btnDef[index] = btn.text || '';
            buttons.push(btnDef);
          }
        });
      }

      alertWithArgs(
        {
          title: title || '',
          message: message || undefined,
          buttons,
          type: type || undefined,
          defaultValue,
          cancelButtonKey,
          destructiveButtonKey,
          preferredButtonKey,
          keyboardType,
          userInterfaceStyle: options?.userInterfaceStyle || undefined,
        },
        (id, value) => {
          const cb = callbacks[id];
          cb && cb(value);
        },
      );
    }
  }
}

export default Alert;
