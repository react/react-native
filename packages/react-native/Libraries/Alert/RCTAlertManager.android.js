/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Args} from './NativeAlertManager';

import NativeDialogManagerAndroid from '../NativeModules/specs/NativeDialogManagerAndroid';

function emptyCallback() {}

/**
 * Shows an alert dialog on Android using the native DialogManagerAndroid module.
 * Falls back gracefully if the native module is not available.
 *
 * @param {Args} args - The alert configuration (title, message, buttons, etc.)
 * @param {Function} callback - Callback function invoked with (id, value) when user selects an option
 * @returns {void}
 * @note NativeDialogManagerAndroid provides better Android-specific UI/UX than the
 * standard AlertManager. If unavailable, the alert silently fails to prevent crashes.
 * See TODO(5998984) for improved polyfill implementation.
 */
export function alertWithArgs(
  args: Args,
  callback: (id: number, value: string) => void,
) {
  if (!NativeDialogManagerAndroid) {
    console.warn(
      'NativeDialogManagerAndroid is not available. Alert may not be displayed.',
    );
    return;
  }

  NativeDialogManagerAndroid.showAlert(
    // $FlowFixMe[incompatible-type] - Mismatched platform interfaces.
    args,
    emptyCallback,
    // $FlowFixMe[incompatible-type] - Mismatched platform interfaces.
    /* $FlowFixMe[constant-condition] Error discovered during Constant
     * Condition roll out. See https://fburl.com/workplace/1v97vimq. */
    callback || emptyCallback,
  );
}
