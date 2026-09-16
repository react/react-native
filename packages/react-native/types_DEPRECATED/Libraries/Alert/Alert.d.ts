/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * @see https://reactnative.dev/docs/alert#content
 */
export interface AlertButton {
  text?: string | undefined;
  onPress?:
    | ((value?: string) => void)
    | ((value?: {login: string; password: string}) => void)
    | undefined;
  isPreferred?: boolean | undefined;
  style?: 'default' | 'cancel' | 'destructive' | undefined;
}

interface AlertOptions {
  /** @platform android */
  cancelable?: boolean | undefined;
  userInterfaceStyle?: 'unspecified' | 'light' | 'dark' | undefined;
  /** @platform android */
  onDismiss?: (() => void) | undefined;
}

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
 * ```
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
 */
export interface AlertStatic {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
  ) => void;
  prompt: (
    title: string,
    message?: string,
    callbackOrButtons?: ((text: string) => void) | AlertButton[],
    type?: AlertType,
    defaultValue?: string,
    keyboardType?: string,
    options?: AlertOptions,
  ) => void;
}

export type AlertType =
  'default' | 'plain-text' | 'secure-text' | 'login-password';

export const Alert: AlertStatic;
export type Alert = AlertStatic;
