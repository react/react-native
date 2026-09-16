/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

export interface ClipboardStatic {
  getString(): Promise<string>;
  setString(content: string): void;
}

/**
 * Clipboard has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-clipboard/clipboard` instead of 'react-native'.
 * @see https://github.com/react-native-clipboard/clipboard
 * @deprecated
 */
export const Clipboard: ClipboardStatic;
/**
 * Clipboard has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-clipboard/clipboard` instead of 'react-native'.
 * @see https://github.com/react-native-clipboard/clipboard
 * @deprecated
 */
export type Clipboard = ClipboardStatic;
