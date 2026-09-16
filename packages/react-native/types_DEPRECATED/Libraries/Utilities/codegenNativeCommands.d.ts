/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

interface Options<T extends string> {
  readonly supportedCommands: ReadonlyArray<T>;
}

declare function codegenNativeCommands<T extends object>(
  options: Options<keyof T extends string ? keyof T : never>,
): T;

export default codegenNativeCommands;
