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

import type {ArrayLike} from '../../utils/ArrayLikeUtils';

import {createValueIterator} from '../../utils/ArrayLikeUtils';
import {setPlatformObject} from '../../webidl/PlatformObjects';

// IMPORTANT: The type definition for this module is defined in `HTMLCollection.js.flow`
// because Flow only supports indexers in classes in declaration files.

const REUSABLE_PROPERTY_DESCRIPTOR: {...PropertyDescriptor<unknown>, ...} = {
  value: {},
  enumerable: true,
  configurable: false,
  writable: false,
};

// $FlowFixMe[incompatible-type] Flow doesn't understand [Symbol.iterator]() {} and thinks this class doesn't implement the Iterable<T> interface.
export default class HTMLCollection<T> implements Iterable<T>, ArrayLike<T> {
  _length: number;

  /**
   * Use `createHTMLCollection` to create instances of this class.
   *
   * @private This is not defined in the declaration file, so users will not see
   *          the signature of the constructor.
   */
  constructor(elements: ReadonlyArray<T>) {
    for (let i = 0; i < elements.length; i++) {
      REUSABLE_PROPERTY_DESCRIPTOR.value = elements[i];
      Object.defineProperty(this, i, REUSABLE_PROPERTY_DESCRIPTOR);
    }

    this._length = elements.length;
  }

  get length(): number {
    return this._length;
  }

  item(index: number): T | null {
    if (index < 0 || index >= this._length) {
      return null;
    }

    // assigning to the interface allows us to access the indexer property in a
    // type-safe way.
    // eslint-disable-next-line consistent-this
    const arrayLike: ArrayLike<T> = this;
    return arrayLike[index];
  }

  /**
   * @deprecated Unused in React Native.
   */
  namedItem(name: string): T | null {
    return null;
  }

  // $FlowFixMe[unsupported-syntax] Flow does not support computed properties in classes.
  [Symbol.iterator](): Iterator<T> {
    return createValueIterator(this);
  }
}

setPlatformObject(HTMLCollection);

/**
 * This is an internal method to create instances of `HTMLCollection`,
 * which avoids leaking its constructor to end users.
 * We can do that because the external definition of `HTMLCollection` lives in
 * `HTMLCollection.js.flow`, not here.
 */
export function createHTMLCollection<T>(
  elements: ReadonlyArray<T>,
): HTMLCollection<T> {
  return new HTMLCollection(elements);
}

export const HTMLCollection_public: typeof HTMLCollection =
  /* eslint-disable no-shadow */
  // $FlowExpectedError[incompatible-type]
  function HTMLCollection() {
    throw new TypeError(
      "Failed to construct 'HTMLCollection': Illegal constructor",
    );
  };

// $FlowExpectedError[prop-missing]
HTMLCollection_public.prototype = HTMLCollection.prototype;
