/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/* eslint no-bitwise: 0 */

'use strict';

/**
 * number should be a color processed by `normalizeColor`
 * alpha should be number between 0 and 1
 */
function setNormalizedColorAlpha(input: number, alpha: number): number {
  let normalizedAlpha = alpha;
  if (normalizedAlpha < 0) {
    normalizedAlpha = 0;
  } else if (normalizedAlpha > 1) {
    normalizedAlpha = 1;
  }

  normalizedAlpha = Math.round(normalizedAlpha * 255);
  // magic bitshift guarantees we return an unsigned int
  return ((input & 0xffffff00) | normalizedAlpha) >>> 0;
}

export default setNormalizedColorAlpha;
