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

type Point = {
  x: ?number,
  y: ?number,
  ...
};

const dummyPoint: Point = {x: undefined, y: undefined};

function pointsDiffer(one: ?Point, two: ?Point): boolean {
  const onePoint = one || dummyPoint;
  const twoPoint = two || dummyPoint;
  return (
    onePoint !== twoPoint &&
    (onePoint.x !== twoPoint.x || onePoint.y !== twoPoint.y)
  );
}

export default pointsDiffer;
