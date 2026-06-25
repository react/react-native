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

import type {BackgroundSizeValue} from './StyleSheetTypes';

export default function processBackgroundSize(
  backgroundSize: ?(ReadonlyArray<BackgroundSizeValue> | string),
): ReadonlyArray<BackgroundSizeValue> {
  let result: ReadonlyArray<BackgroundSizeValue> = [];

  if (backgroundSize == null) {
    // If the size is invalid, return an empty array and do not apply any background size. Same as web.
    return [];
  }

  if (typeof backgroundSize === 'string') {
    result = parseBackgroundSizeCSSString(backgroundSize.replace(/\n/g, ' '));
  } else if (Array.isArray(backgroundSize)) {
    result = backgroundSize;
  }

  return result;
}
// https://www.w3.org/TR/css-backgrounds-3/#typedef-bg-size
// <bg-size> = [ <length-percentage [0,∞]> | auto ]{1,2} | cover | contain
function parseBackgroundSizeCSSString(
  backgroundSize: string,
): ReadonlyArray<BackgroundSizeValue> {
  const result: Array<BackgroundSizeValue> = [];
  const sizes = backgroundSize.split(',').map(s => s.trim());

  for (const size of sizes) {
    if (size.length === 0) {
      return [];
    }

    const parts = size.split(/\s+/).filter(p => p.length > 0);

    if (parts.length === 2) {
      const x = getValidLengthPercentageSizeOrNull(parts[0].toLowerCase());
      const y = getValidLengthPercentageSizeOrNull(parts[1].toLowerCase());
      if (x != null && y != null) {
        result.push({
          x,
          y,
        });
      } else {
        return [];
      }
    } else if (parts.length === 1) {
      const x = getValidLengthPercentageSizeOrNull(parts[0].toLowerCase());
      if (x != null) {
        result.push({
          x,
          y: 'auto',
        });
      } else {
        return [];
      }
    }
  }

  return result;
}

// [ <length-percentage [0,∞]> | auto ]
function getValidLengthPercentageSizeOrNull(size: ?string) {
  if (size == null) {
    return null;
  }

  if (size.endsWith('px')) {
    const num = parseFloat(size);
    if (!Number.isNaN(num) && num >= 0) {
      return num;
    }
  }

  if (size.endsWith('%')) {
    if (parseFloat(size) >= 0) {
      return size;
    }
  }

  if (size === 'auto') {
    return size;
  }

  return null;
}
