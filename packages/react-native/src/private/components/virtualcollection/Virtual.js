/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/**
 * An item to virtualize must be an item. It can optionally have a string `id`
 * parameter, but that is not currently represented because it makes the Flow
 * types more complicated.
 */
export interface Item {}

/**
 * An interface for a collection of items, without requiring that each item be
 * eagerly (or lazily) allocated.
 */
export interface VirtualCollection<out T extends Item> {
  /**
   * The number of items in the collection. This can either be a numeric scalar
   * or a getter function that is computed on access. However, it should remain
   * constant for the lifetime of this object.
   */
  readonly size: number;

  /**
   * If an item exists at the supplied index, this should return a consistent
   * item for the lifetime of this object. If an item does not exist at the
   * supplied index, this should throw an error.
   */
  at(index: number): T;
}

/**
 * An implementation of `VirtualCollection` that wraps an array. Although easy to
 * use, this is not recommended for larger arrays because each element of an
 * array is eagerly allocated.
 */
export class VirtualArray<out T extends Item> implements VirtualCollection<T> {
  readonly size: number;
  readonly at: (index: number) => T;

  constructor(input: Readonly<$ArrayLike<T>>) {
    const array = [...input];

    // NOTE: This is implemented this way because Flow does not permit `input`
    // to be a read-only instance property (even a private one).
    this.size = array.length;
    this.at = (index: number): T => {
      if (index < 0 || index >= this.size) {
        throw new RangeError(
          `Cannot get index ${index} from a collection of size ${this.size}`,
        );
      }
      return array[index];
    };
  }
}
