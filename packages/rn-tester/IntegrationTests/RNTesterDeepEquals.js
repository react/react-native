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

export default function deepEquals(one: unknown, two: unknown): boolean {
  if (one === two) {
    return true;
  }
  if (typeof one === 'function' && typeof two === 'function') {
    return true;
  }
  if (
    typeof one !== 'object' ||
    one === null ||
    typeof two !== 'object' ||
    two === null ||
    one.constructor !== two.constructor
  ) {
    return false;
  }
  if (Array.isArray(one)) {
    if (!Array.isArray(two) || one.length !== two.length) {
      return false;
    }
    for (let ii = 0; ii < one.length; ii++) {
      if (!deepEquals(one[ii], two[ii])) {
        return false;
      }
    }
  } else {
    for (const key in one) {
      if (!deepEquals(one[key], two[key])) {
        return false;
      }
    }
    for (const key in two) {
      if (one[key] === undefined && two[key] !== undefined) {
        return false;
      }
    }
  }
  return true;
}
