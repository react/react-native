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
 * Position does not expose methods for construction via an `HTMLDOMElement`,
 * because it isn't meaningful to construct such a thing without first defining
 * a frame of reference.
 *
 * @param {number} windowStartKey Key that window starts at.
 * @param {number} windowEndKey Key that window ends at.
 */
// $FlowFixMe[missing-this-annot]
function Position(left: number, top: number) {
  this.left = left;
  this.top = top;
}

// $FlowFixMe[missing-this-annot]
Position.prototype.destructor = function () {
  this.left = null;
  this.top = null;
};

PooledClass.addPoolingTo(Position as $FlowFixMe, twoArgumentPooler);

export default Position;
