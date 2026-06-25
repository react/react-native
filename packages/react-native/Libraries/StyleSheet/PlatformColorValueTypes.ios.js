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
import type {ColorValue, NativeColorValue} from './StyleSheet';

/** The actual type of the opaque NativeColorValue on iOS platform */
type LocalNativeColorValue = {
  semantic?: Array<string>,
  dynamic?: {
    light: ?(ColorValue | ProcessedColorValue),
    dark: ?(ColorValue | ProcessedColorValue),
    highContrastLight?: ?(ColorValue | ProcessedColorValue),
    highContrastDark?: ?(ColorValue | ProcessedColorValue),
  },
};

export const PlatformColor = (...names: Array<string>): NativeColorValue => {
  // $FlowExpectedError[incompatible-type] LocalNativeColorValue is the iOS LocalNativeColorValue type
  return {semantic: names} as LocalNativeColorValue;
};

export type DynamicColorIOSTuplePrivate = {
  light: ColorValue,
  dark: ColorValue,
  highContrastLight?: ColorValue,
  highContrastDark?: ColorValue,
};

export const DynamicColorIOSPrivate = (
  tuple: DynamicColorIOSTuplePrivate,
): ColorValue => {
  return {
    dynamic: {
      light: tuple.light,
      dark: tuple.dark,
      highContrastLight: tuple.highContrastLight,
      highContrastDark: tuple.highContrastDark,
    },
    /* $FlowExpectedError[incompatible-type]
     * LocalNativeColorValue is the actual type of the opaque NativeColorValue on iOS platform */
  } as LocalNativeColorValue;
};

const _normalizeColorObject = (
  color: LocalNativeColorValue,
): ?LocalNativeColorValue => {
  if ('semantic' in color) {
    // an ios semantic color
    return color;
  } else if ('dynamic' in color && color.dynamic !== undefined) {
    const normalizeColor = require('./normalizeColor').default;

    // a dynamic, appearance aware color
    const dynamic = color.dynamic;
    const dynamicColor: LocalNativeColorValue = {
      dynamic: {
        // $FlowFixMe[incompatible-use]
        light: normalizeColor(dynamic.light),
        // $FlowFixMe[incompatible-use]
        dark: normalizeColor(dynamic.dark),
        // $FlowFixMe[incompatible-use]
        highContrastLight: normalizeColor(dynamic.highContrastLight),
        // $FlowFixMe[incompatible-use]
        highContrastDark: normalizeColor(dynamic.highContrastDark),
      },
    };
    return dynamicColor;
  }
  return null;
};

export const normalizeColorObject: (
  color: NativeColorValue,
  /* $FlowExpectedError[incompatible-type]
   * LocalNativeColorValue is the actual type of the opaque NativeColorValue on iOS platform */
) => ?ProcessedColorValue = _normalizeColorObject;

const _processColorObject = (
  color: LocalNativeColorValue,
): ?LocalNativeColorValue => {
  if ('dynamic' in color && color.dynamic != null) {
    const processColor = require('./processColor').default;
    const dynamic = color.dynamic;
    const dynamicColor: LocalNativeColorValue = {
      dynamic: {
        // $FlowFixMe[incompatible-use]
        light: processColor(dynamic.light),
        // $FlowFixMe[incompatible-use]
        dark: processColor(dynamic.dark),
        // $FlowFixMe[incompatible-use]
        highContrastLight: processColor(dynamic.highContrastLight),
        // $FlowFixMe[incompatible-use]
        highContrastDark: processColor(dynamic.highContrastDark),
      },
    };
    return dynamicColor;
  }
  return color;
};

export const processColorObject: (
  color: NativeColorValue,
  /* $FlowExpectedError[incompatible-type]
   * LocalNativeColorValue is the actual type of the opaque NativeColorValue on iOS platform */
) => ?NativeColorValue = _processColorObject;
