/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

export type Logger = Readonly<{
  error: (...message: Array<string>) => void,
  info: (...message: Array<string>) => void,
  warn: (...message: Array<string>) => void,
  ...
}>;
