/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ProcessedColorValue} from './processColor';
import type {NativeColorValue} from './StyleSheet';

import parsePlatformColorArgs from './parsePlatformColorArgs';

/** The actual type of the opaque NativeColorValue on Android platform */
type LocalNativeColorValue = {
  resource_paths?: Array<string>,
  fallback?: string,
};

export const PlatformColor = (
  ...args: Array<string | {fallback: string}>
): NativeColorValue => {
  const {names, fallback} = parsePlatformColorArgs(args);
  // Raw fallback (when present) is passed to native untouched and only parsed
  // on a token miss.
  const color: LocalNativeColorValue =
    fallback == null
      ? {resource_paths: names}
      : {resource_paths: names, fallback};
  /* $FlowExpectedError[incompatible-type]
   * LocalNativeColorValue is the actual type of the opaque NativeColorValue on Android platform */
  return color as LocalNativeColorValue;
};

export const normalizeColorObject = (
  color: NativeColorValue,
): ?ProcessedColorValue => {
  /* $FlowExpectedError[incompatible-type]
   * LocalNativeColorValue is the actual type of the opaque NativeColorValue on Android platform */
  if ('resource_paths' in (color as LocalNativeColorValue)) {
    return color;
  }
  return null;
};

export const processColorObject = (
  color: NativeColorValue,
): ?NativeColorValue => {
  return color;
};
