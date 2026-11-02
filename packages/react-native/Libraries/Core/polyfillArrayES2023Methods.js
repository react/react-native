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

const arrayPrototype = Array.prototype;

if (arrayPrototype.toSorted == null) {
  Object.defineProperty(arrayPrototype, 'toSorted' as string, {
    configurable: true,
    value: function <T>(
      this: Array<T>,
      compareFn?: (a: T, b: T) => number,
    ): Array<T> {
      const copy = Array.from(this);
      copy.sort(compareFn);
      return copy;
    },
    writable: true,
  });
}

if (arrayPrototype.toReversed == null) {
  Object.defineProperty(arrayPrototype, 'toReversed' as string, {
    configurable: true,
    value: function <T>(this: Array<T>): Array<T> {
      const copy = Array.from(this);
      copy.reverse();
      return copy;
    },
    writable: true,
  });
}
