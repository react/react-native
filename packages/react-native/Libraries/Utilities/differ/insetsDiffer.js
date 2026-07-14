/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

type Inset = {
  top: ?number,
  left: ?number,
  right: ?number,
  bottom: ?number,
  ...
};

const dummyInsets = {
  top: undefined,
  left: undefined,
  right: undefined,
  bottom: undefined,
};

/**
 * Compares two inset objects for equality.
 * Returns true if the insets are different, false if equal.
 *
 * @param {Inset} one - First inset object (top, left, right, bottom)
 * @param {Inset} two - Second inset object
 * @returns {boolean} True if insets differ, false if equal
 * @performance O(1) - Compares only four numeric values
 */
function insetsDiffer(one: Inset, two: Inset): boolean {
  one = one || dummyInsets;
  two = two || dummyInsets;
  return (
    one !== two &&
    (one.top !== two.top ||
      one.left !== two.left ||
      one.right !== two.right ||
      one.bottom !== two.bottom)
  );
}

export default insetsDiffer;
