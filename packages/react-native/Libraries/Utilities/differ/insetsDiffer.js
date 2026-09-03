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

function insetsDiffer(one: Inset, two: Inset): boolean {
  const insetOne = one || dummyInsets;
  const insetTwo = two || dummyInsets;
  return (
    insetOne !== insetTwo &&
    (insetOne.top !== insetTwo.top ||
      insetOne.left !== insetTwo.left ||
      insetOne.right !== insetTwo.right ||
      insetOne.bottom !== insetTwo.bottom)
  );
}

export default insetsDiffer;
