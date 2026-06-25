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

/** The actual type of the opaque NativeColorValue on Android platform */
type LocalNativeColorValue = {
  resource_paths?: Array<string>,
};

export const PlatformColor = (...names: Array<string>): NativeColorValue => {
  /* $FlowExpectedError[incompatible-type]
   * LocalNativeColorValue is the actual type of the opaque NativeColorValue on Android platform */
  return {resource_paths: names} as LocalNativeColorValue;
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
