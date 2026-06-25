/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// flowlint unsafe-getters-setters:off

import type {ArrayLike} from '../utils/ArrayLikeUtils';
import type DOMRectReadOnly from './DOMRectReadOnly';

import {createValueIterator} from '../utils/ArrayLikeUtils';
import {setPlatformObject} from '../webidl/PlatformObjects';

// IMPORTANT: The Flow type definition for this module is defined in `DOMRectList.js.flow`
// because Flow only supports indexers in classes in declaration files.

// $FlowFixMe[incompatible-type] Flow doesn't understand [Symbol.iterator]() {} and thinks this class doesn't implement the Iterable interface.
export default class DOMRectList implements Iterable<DOMRectReadOnly> {
  #length: number;

  /**
   * Use `createDOMRectList` to create instances of this class.
   *
   * @private This is not defined in the declaration file, so users will not see
   *          the signature of the constructor.
   */
  constructor(elements: ReadonlyArray<DOMRectReadOnly>) {
    for (let i = 0; i < elements.length; i++) {
      Object.defineProperty(this, i, {
        value: elements[i],
        enumerable: true,
        configurable: false,
        writable: false,
      });
    }

    this.#length = elements.length;
  }

  get length(): number {
    return this.#length;
  }

  item(index: number): DOMRectReadOnly | null {
    if (index < 0 || index >= this.#length) {
      return null;
    }

    // assigning to the interface allows us to access the indexer property in a
    // type-safe way.
    // eslint-disable-next-line consistent-this
    const arrayLike: ArrayLike<DOMRectReadOnly> = this;
    return arrayLike[index];
  }

  // $FlowFixMe[unsupported-syntax] Flow does not support computed properties in classes.
  [Symbol.iterator](): Iterator<DOMRectReadOnly> {
    return createValueIterator(this);
  }
}

setPlatformObject(DOMRectList);

/**
 * This is an internal method to create instances of `DOMRectList`,
 * which avoids leaking its constructor to end users.
 * We can do that because the external definition of `DOMRectList` lives in
 * `DOMRectList.js.flow`, not here.
 */
export function createDOMRectList(
  elements: ReadonlyArray<DOMRectReadOnly>,
): DOMRectList {
  return new DOMRectList(elements);
}

export const DOMRectList_public: typeof DOMRectList =
  /* eslint-disable no-shadow */
  // $FlowExpectedError[incompatible-type]
  function DOMRectList() {
    throw new TypeError(
      "Failed to construct 'DOMRectList': Illegal constructor",
    );
  };

// $FlowExpectedError[prop-missing]
DOMRectList_public.prototype = DOMRectList.prototype;
