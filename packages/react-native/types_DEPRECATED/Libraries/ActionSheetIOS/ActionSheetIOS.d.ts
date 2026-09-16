/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {ProcessedColorValue} from '../StyleSheet/processColor';
import {ColorValue} from '../StyleSheet/StyleSheet';

/**
 * @see: https://reactnative.dev/docs/actionsheetios#content
 */
export interface ActionSheetIOSOptions {
  title?: string | undefined;
  options: string[];
  cancelButtonIndex?: number | undefined;
  destructiveButtonIndex?: number | number[] | undefined | null;
  message?: string | undefined;
  anchor?: number | undefined;
  tintColor?: ColorValue | ProcessedColorValue | undefined;
  cancelButtonTintColor?: ColorValue | ProcessedColorValue | undefined;
  disabledButtonTintColor?: ColorValue | ProcessedColorValue | undefined;
  userInterfaceStyle?: 'light' | 'dark' | undefined;
  disabledButtonIndices?: number[] | undefined;
}

export interface ShareActionSheetIOSOptions {
  message?: string | undefined;
  url?: string | undefined;
  subject?: string | undefined;
  anchor?: number | undefined;
  /** The activities to exclude from the ActionSheet.
   * For example: ['com.apple.UIKit.activity.PostToTwitter']
   */
  excludedActivityTypes?: string[] | undefined;
}

/**
 * @see https://reactnative.dev/docs/actionsheetios#content
 */
export interface ActionSheetIOSStatic {
  /**
   * Display an iOS action sheet. The `options` object must contain one or more
   * of:
   * - `options` (array of strings) - a list of button titles (required)
   * - `cancelButtonIndex` (int) - index of cancel button in `options`
   * - `destructiveButtonIndex` (int) - index of destructive button in `options`
   * - `title` (string) - a title to show above the action sheet
   * - `message` (string) - a message to show below the title
   */
  showActionSheetWithOptions: (
    options: ActionSheetIOSOptions,
    callback: (buttonIndex: number) => void,
  ) => void;

  /**
   * Display the iOS share sheet. The `options` object should contain
   * one or both of `message` and `url` and can additionally have
   * a `subject` or `excludedActivityTypes`:
   *
   * - `url` (string) - a URL to share
   * - `message` (string) - a message to share
   * - `subject` (string) - a subject for the message
   * - `excludedActivityTypes` (array) - the activities to exclude from the ActionSheet
   *
   * NOTE: if `url` points to a local file, or is a base64-encoded
   * uri, the file it points to will be loaded and shared directly.
   * In this way, you can share images, videos, PDF files, etc.
   */
  showShareActionSheetWithOptions: (
    options: ShareActionSheetIOSOptions,
    failureCallback: (error: Error) => void,
    successCallback: (success: boolean, method: string) => void,
  ) => void;

  /**
   * Dismisses the most upper iOS action sheet presented, if no action sheet is
   * present a warning is displayed.
   */
  dismissActionSheet: () => void;
}

export const ActionSheetIOS: ActionSheetIOSStatic;
export type ActionSheetIOS = ActionSheetIOSStatic;
