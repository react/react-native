/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

/**
 * Unrolls an array comparison specially for matrices (4x4 transformation matrices).
 *
 * Prioritizes checking of indices that are most likely to change so that the
 * comparison bails as early as possible. This optimizes for common transformations.
 * 
 * Index check order: [12,13,14,5,10,0,1,2,3,4,6,7,8,9,11,15]
 *
 * @param {?Array<number>} one - First matrix (16 elements)
 * @param {?Array<number>} two - Second matrix (16 elements)
 * @returns {boolean} True if matrices differ, false if equal
 * @performance O(1) - Fixed size comparison, early exit on first difference
 */
function matricesDiffer(one: ?Array<number>, two: ?Array<number>): boolean {
  if (one === two) {
    return false;
  }
  return (
    !one ||
    !two ||
    one[12] !== two[12] ||
    one[13] !== two[13] ||
    one[14] !== two[14] ||
    one[5] !== two[5] ||
    one[10] !== two[10] ||
    one[0] !== two[0] ||
    one[1] !== two[1] ||
    one[2] !== two[2] ||
    one[3] !== two[3] ||
    one[4] !== two[4] ||
    one[6] !== two[6] ||
    one[7] !== two[7] ||
    one[8] !== two[8] ||
    one[9] !== two[9] ||
    one[11] !== two[11] ||
    one[15] !== two[15]
  );
}

export default matricesDiffer;
