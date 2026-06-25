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

import type {
  BackgroundRepeatKeyword,
  BackgroundRepeatValue,
} from './StyleSheetTypes';

function isBackgroundRepeatKeyword(
  value: string,
): value is BackgroundRepeatKeyword {
  return (
    value === 'repeat' ||
    value === 'space' ||
    value === 'round' ||
    value === 'no-repeat'
  );
}

export default function processBackgroundRepeat(
  backgroundRepeat: ?(ReadonlyArray<BackgroundRepeatValue> | string),
): ReadonlyArray<BackgroundRepeatValue> {
  let result: ReadonlyArray<BackgroundRepeatValue> = [];
  if (backgroundRepeat == null) {
    return [];
  }

  if (Array.isArray(backgroundRepeat)) {
    return backgroundRepeat;
  }

  if (typeof backgroundRepeat === 'string') {
    result = parseBackgroundRepeatCSSString(
      backgroundRepeat.replace(/\n/g, ' '),
    );
  }

  return result;
}

// https://www.w3.org/TR/css-backgrounds-3/#typedef-repeat-style
function parseBackgroundRepeatCSSString(
  backgroundRepeat: string,
): ReadonlyArray<BackgroundRepeatValue> {
  const result: Array<BackgroundRepeatValue> = [];
  const bgRepeatArray = backgroundRepeat.split(',').map(s => s.trim());

  for (const bgRepeat of bgRepeatArray) {
    if (bgRepeat.length === 0) {
      return [];
    }

    const parts = bgRepeat.split(/\s+/).filter(p => p.length > 0);
    if (parts.length === 1) {
      const part1 = parts[0];
      if (part1 == null) {
        return [];
      }
      const token1 = part1.toLowerCase();
      if (token1 === 'repeat-x') {
        result.push({x: 'repeat', y: 'no-repeat'});
      } else if (token1 === 'repeat-y') {
        result.push({x: 'no-repeat', y: 'repeat'});
      } else if (token1 === 'repeat') {
        result.push({x: 'repeat', y: 'repeat'});
      } else if (token1 === 'space') {
        result.push({x: 'space', y: 'space'});
      } else if (token1 === 'round') {
        result.push({x: 'round', y: 'round'});
      } else if (token1 === 'no-repeat') {
        result.push({x: 'no-repeat', y: 'no-repeat'});
      } else {
        return [];
      }
    } else if (parts.length === 2) {
      const part1 = parts[0];
      const part2 = parts[1];
      if (part1 == null || part2 == null) {
        return [];
      }
      const token1 = part1.toLowerCase();
      const token2 = part2.toLowerCase();

      if (
        isBackgroundRepeatKeyword(token1) &&
        isBackgroundRepeatKeyword(token2)
      ) {
        result.push({x: token1, y: token2});
      } else {
        return [];
      }
    }
  }

  return result;
}
