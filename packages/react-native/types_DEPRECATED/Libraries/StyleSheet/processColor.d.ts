/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {ColorValue, OpaqueColorValue} from './StyleSheet';

export type ProcessedColorValue = number | OpaqueColorValue;

export function processColor(
  color?: number | ColorValue,
): ProcessedColorValue | null | undefined;
