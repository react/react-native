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

const dummySize = {width: undefined, height: undefined};
type Size = {width: ?number, height: ?number};

/**
 * Compares two size objects for equality.
 * Returns true if the sizes are different, false if equal.
 *
 * @param {Size} one - First size object with width, height
 * @param {Size} two - Second size object with width, height
 * @returns {boolean} True if sizes differ, false if equal
 * @performance O(1) - Compares only two numeric values
 */
function sizesDiffer(one: Size, two: Size): boolean {
  const defaultedOne = one || dummySize;
  const defaultedTwo = two || dummySize;
  return (
    defaultedOne !== defaultedTwo &&
    (defaultedOne.width !== defaultedTwo.width ||
      defaultedOne.height !== defaultedTwo.height)
  );
}

export default sizesDiffer;
