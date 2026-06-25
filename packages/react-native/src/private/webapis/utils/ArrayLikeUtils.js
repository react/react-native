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
 * This definition is different from the current built-in type `$ArrayLike`
 * provided by Flow, in that this is an interface and that one is an object.
 *
 * The difference is important because, when using objects, Flow thinks
 * a `length` property would be copied over when using the spread operator,
 * which is incorrect.
 */
export interface ArrayLike<T> extends Iterable<T> {
  // This property should've been read-only as well, but Flow doesn't handle
  // read-only indexers correctly (thinks reads are writes and fails).
  [indexer: number]: T;
  readonly length: number;
}

export function* createValueIterator<T>(arrayLike: ArrayLike<T>): Iterator<T> {
  for (let i = 0; i < arrayLike.length; i++) {
    yield arrayLike[i];
  }
}

export function* createKeyIterator<T>(
  arrayLike: ArrayLike<T>,
): Iterator<number> {
  for (let i = 0; i < arrayLike.length; i++) {
    yield i;
  }
}

export function* createEntriesIterator<T>(
  arrayLike: ArrayLike<T>,
): Iterator<[number, T]> {
  for (let i = 0; i < arrayLike.length; i++) {
    yield [i, arrayLike[i]];
  }
}
