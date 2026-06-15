/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {ColorValue, NativeColorValue} from './StyleSheet';

const Platform = require('../Utilities/Platform').default;
const normalizeColor = require('./normalizeColor').default;

export type ProcessedColorValue = number | NativeColorValue;

type CacheableColorValue = number | string;

const MAX_PRIMITIVE_COLOR_CACHE_SIZE = 1024;
const primitiveColorCache: Map<CacheableColorValue, ?ProcessedColorValue> =
  new Map();

/* eslint no-bitwise: 0 */
function processColor(color?: ?(number | ColorValue)): ?ProcessedColorValue {
  if (color === undefined || color === null) {
    return color;
  }

  if (typeof color === 'string' || typeof color === 'number') {
    const cachedColor = primitiveColorCache.get(color);
    if (cachedColor !== undefined || primitiveColorCache.has(color)) {
      return cachedColor;
    }
  }

  let normalizedColor = normalizeColor(color);
  if (normalizedColor === null || normalizedColor === undefined) {
    if (typeof color === 'string' || typeof color === 'number') {
      cachePrimitiveColor(color, undefined);
    }
    return undefined;
  }

  if (typeof normalizedColor === 'object') {
    const processColorObject =
      require('./PlatformColorValueTypes').processColorObject;

    const processedColorObj = processColorObject(normalizedColor);

    if (processedColorObj != null) {
      return processedColorObj;
    }
  }

  if (typeof normalizedColor !== 'number') {
    return null;
  }

  // Converts 0xrrggbbaa into 0xaarrggbb
  normalizedColor = ((normalizedColor << 24) | (normalizedColor >>> 8)) >>> 0;

  if (Platform.OS === 'android') {
    // Android use 32 bit *signed* integer to represent the color
    // We utilize the fact that bitwise operations in JS also operates on
    // signed 32 bit integers, so that we can use those to convert from
    // *unsigned* to *signed* 32bit int that way.
    normalizedColor = normalizedColor | 0x0;
  }
  if (typeof color === 'string' || typeof color === 'number') {
    cachePrimitiveColor(color, normalizedColor);
  }
  return normalizedColor;
}

function cachePrimitiveColor(
  color: CacheableColorValue,
  processedColor: ?ProcessedColorValue,
): void {
  if (primitiveColorCache.size < MAX_PRIMITIVE_COLOR_CACHE_SIZE) {
    primitiveColorCache.set(color, processedColor);
  }
}

export default processColor;
