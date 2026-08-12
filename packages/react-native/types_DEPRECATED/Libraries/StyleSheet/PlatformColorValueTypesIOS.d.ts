/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {ColorValue, OpaqueColorValue} from './StyleSheet';

type DynamicColorIOSTuple = {
  light: ColorValue;
  dark: ColorValue;
  highContrastLight?: ColorValue | undefined;
  highContrastDark?: ColorValue | undefined;
};

/**
 * Specify color to display depending on the current system appearance settings
 *
 * @param tuple Colors you want to use for "light mode" and "dark mode"
 * @platform ios
 */
export function DynamicColorIOS(tuple: DynamicColorIOSTuple): OpaqueColorValue;
