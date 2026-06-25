/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ProcessedColorValue} from '../StyleSheet/processColor';
import type {ColorValue} from '../StyleSheet/StyleSheet';

import RCTActionSheetManager from './NativeActionSheetManager';

const processColor = require('../StyleSheet/processColor').default;
const invariant = require('invariant');

export type ActionSheetIOSOptions = Readonly<{
  title?: ?string,
  message?: ?string,
  options: Array<string>,
  destructiveButtonIndex?: ?number | ?Array<number>,
  cancelButtonIndex?: ?number,
  anchor?: ?number,
  tintColor?: ColorValue | ProcessedColorValue,
  cancelButtonTintColor?: ColorValue | ProcessedColorValue,
  disabledButtonTintColor?: ColorValue | ProcessedColorValue,
  userInterfaceStyle?: string,
  disabledButtonIndices?: Array<number>,
}>;

export type ShareActionSheetIOSOptions = Readonly<{
  message?: ?string,
  url?: ?string,
  subject?: ?string,
  anchor?: ?number,
  tintColor?: ?number,
  cancelButtonTintColor?: ?number,
  disabledButtonTintColor?: ?number,
  excludedActivityTypes?: ?Array<string>,
  userInterfaceStyle?: ?string,
}>;

export type ShareActionSheetError = Readonly<{
  domain: string,
  code: string,
  userInfo?: ?Object,
  message: string,
}>;

/**
 * Display action sheets and share sheets on iOS.
 *
 * See https://reactnative.dev/docs/actionsheetios
 */
const ActionSheetIOS = {
  /**
   * Display an iOS action sheet.
   *
   * The `options` object must contain one or more of:
   *
   * - `options` (array of strings) - a list of button titles (required)
   * - `cancelButtonIndex` (int) - index of cancel button in `options`
   * - `destructiveButtonIndex` (int or array of ints) - index or indices of destructive buttons in `options`
   * - `title` (string) - a title to show above the action sheet
   * - `message` (string) - a message to show below the title
   * - `disabledButtonIndices` (array of numbers) - a list of button indices which should be disabled
   *
   * The 'callback' function takes one parameter, the zero-based index
   * of the selected item.
   *
   * See https://reactnative.dev/docs/actionsheetios#showactionsheetwithoptions
   */
  showActionSheetWithOptions(
    options: ActionSheetIOSOptions,
    callback: (buttonIndex: number) => void,
  ) {
    invariant(
      /* $FlowFixMe[invalid-compare] Error discovered during Constant Condition
       * roll out. See https://fburl.com/workplace/5whu3i34. */
      typeof options === 'object' && options !== null,
      'Options must be a valid object',
    );
    invariant(typeof callback === 'function', 'Must provide a valid callback');
    invariant(RCTActionSheetManager, "ActionSheetManager doesn't exist");

    const {
      tintColor,
      cancelButtonTintColor,
      disabledButtonTintColor,
      destructiveButtonIndex,
      ...remainingOptions
    } = options;
    let destructiveButtonIndices = null;

    if (Array.isArray(destructiveButtonIndex)) {
      destructiveButtonIndices = destructiveButtonIndex;
    } else if (typeof destructiveButtonIndex === 'number') {
      destructiveButtonIndices = [destructiveButtonIndex];
    }

    const processedTintColor = processColor(tintColor);
    const processedCancelButtonTintColor = processColor(cancelButtonTintColor);
    const processedDisabledButtonTintColor = processColor(
      disabledButtonTintColor,
    );

    invariant(
      processedTintColor == null || typeof processedTintColor === 'number',
      'Unexpected color given for ActionSheetIOS.showActionSheetWithOptions tintColor',
    );
    invariant(
      processedCancelButtonTintColor == null ||
        typeof processedCancelButtonTintColor === 'number',
      'Unexpected color given for ActionSheetIOS.showActionSheetWithOptions cancelButtonTintColor',
    );
    invariant(
      processedDisabledButtonTintColor == null ||
        typeof processedDisabledButtonTintColor === 'number',
      'Unexpected color given for ActionSheetIOS.showActionSheetWithOptions disabledButtonTintColor',
    );
    RCTActionSheetManager.showActionSheetWithOptions(
      {
        ...remainingOptions,
        // $FlowFixMe[incompatible-type]
        tintColor: processedTintColor,
        // $FlowFixMe[incompatible-type]
        cancelButtonTintColor: processedCancelButtonTintColor,
        // $FlowFixMe[incompatible-type]
        disabledButtonTintColor: processedDisabledButtonTintColor,
        destructiveButtonIndices,
      },
      callback,
    );
  },

  /**
   * Display the iOS share sheet. The `options` object should contain
   * one or both of `message` and `url` and can additionally have
   * a `subject` or `excludedActivityTypes`:
   *
   * - `url` (string) - a URL to share
   * - `message` (string) - a message to share
   * - `subject` (string) - a subject for the message
   * - `excludedActivityTypes` (array) - the activities to exclude from
   *   the ActionSheet
   * - `tintColor` (color) - tint color of the buttons
   *
   * The 'failureCallback' function takes one parameter, an error object.
   * The only property defined on this object is an optional `stack` property
   * of type `string`.
   *
   * The 'successCallback' function takes two parameters:
   *
   * - a boolean value signifying success or failure
   * - a string that, in the case of success, indicates the method of sharing
   *
   * See https://reactnative.dev/docs/actionsheetios#showshareactionsheetwithoptions
   */
  showShareActionSheetWithOptions(
    options: ShareActionSheetIOSOptions,
    failureCallback: Function | ((error: ShareActionSheetError) => void),
    successCallback: Function | ((success: boolean, method: ?string) => void),
  ) {
    invariant(
      /* $FlowFixMe[invalid-compare] Error discovered during Constant Condition
       * roll out. See https://fburl.com/workplace/5whu3i34. */
      typeof options === 'object' && options !== null,
      'Options must be a valid object',
    );
    invariant(
      typeof failureCallback === 'function',
      'Must provide a valid failureCallback',
    );
    invariant(
      typeof successCallback === 'function',
      'Must provide a valid successCallback',
    );
    invariant(RCTActionSheetManager, "ActionSheetManager doesn't exist");
    RCTActionSheetManager.showShareActionSheetWithOptions(
      {...options, tintColor: processColor(options.tintColor) as $FlowFixMe},
      failureCallback,
      successCallback,
    );
  },

  /**
   * Dismisses the most upper iOS action sheet presented, if no action sheet is
   * present a warning is displayed.
   */
  dismissActionSheet: () => {
    invariant(RCTActionSheetManager, "ActionSheetManager doesn't exist");
    if (typeof RCTActionSheetManager.dismissActionSheet === 'function') {
      RCTActionSheetManager.dismissActionSheet();
    }
  },
};

export default ActionSheetIOS;
