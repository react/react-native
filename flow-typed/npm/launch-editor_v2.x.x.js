/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

declare module 'launch-editor' {
  declare type ErrorCallback = (
    fileName: string,
    errorMessage: string | null,
  ) => void;

  /**
   * Launch an editor to open a file, with an optional line and column
   * (`/path/to/file.js:10:2`). `specifiedEditor` is parsed with `shell-quote`.
   */
  declare module.exports: (
    file: string,
    specifiedEditor?: ?string | ErrorCallback,
    onErrorCallback?: ErrorCallback,
  ) => void;
}
