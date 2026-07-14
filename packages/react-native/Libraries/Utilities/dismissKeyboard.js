/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const TextInputState =
  require('../Components/TextInput/TextInputState').default;

/**
 * Programmatically dismisses the currently-open keyboard on the device.
 *
 * This function finds the currently focused text input and blurs it, which triggers
 * the keyboard dismissal on iOS and Android.
 *
 * @example
 *   import { dismissKeyboard } from 'react-native';
 *   dismissKeyboard(); // Hide the keyboard
 *
 * @returns {void}
 * @note This is a no-op if no text input is currently focused.
 */
function dismissKeyboard() {
  TextInputState.blurTextInput(TextInputState.currentlyFocusedInput());
}

export default dismissKeyboard;
