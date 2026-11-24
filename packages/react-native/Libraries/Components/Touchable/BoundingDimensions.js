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

import PooledClass from './PooledClass';

const twoArgumentPooler = PooledClass.twoArgumentPooler;

/**
 * PooledClass representing the bounding rectangle of a region.
 *
 * @param {number} width Width of bounding rectangle.
 * @param {number} height Height of bounding rectangle.
 * @constructor BoundingDimensions
 */
// $FlowFixMe[missing-this-annot]
function BoundingDimensions(width: number, height: number) {
  this.width = width;
  this.height = height;
}

// $FlowFixMe[missing-this-annot]
BoundingDimensions.prototype.destructor = function () {
  this.width = null;
  this.height = null;
};

/**
 * @param {HTMLElement} element Element to return `BoundingDimensions` for.
 * @return {BoundingDimensions} Bounding dimensions of `element`.
 */
BoundingDimensions.getPooledFromElement = function (
  element: HTMLElement,
): typeof BoundingDimensions {
  // $FlowFixMe[prop-missing]
  return BoundingDimensions.getPooled(
    element.offsetWidth,
    element.offsetHeight,
  );
};

PooledClass.addPoolingTo(BoundingDimensions as $FlowFixMe, twoArgumentPooler);

export default BoundingDimensions;
