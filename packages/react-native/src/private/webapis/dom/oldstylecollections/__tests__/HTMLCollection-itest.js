/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import {createHTMLCollection} from '../HTMLCollection';

describe('HTMLCollection', () => {
  it('provides an array-like interface', () => {
    const collection = createHTMLCollection(['a', 'b', 'c']);

    expect(collection[0]).toBe('a');
    expect(collection[1]).toBe('b');
    expect(collection[2]).toBe('c');
    expect(collection[3]).toBe(undefined);
    expect(collection.length).toBe(3);
  });

  it('is immutable (loose mode)', () => {
    const collection = createHTMLCollection(['a', 'b', 'c']);

    collection[0] = 'replacement';
    expect(collection[0]).toBe('a');

    // $FlowExpectedError[cannot-write]
    collection.length = 100;
    expect(collection.length).toBe(3);
  });

  it('is immutable (strict mode)', () => {
    'use strict';

    const collection = createHTMLCollection(['a', 'b', 'c']);

    let writeIndexError;
    try {
      collection[0] = 'replacement';
    } catch (e) {
      writeIndexError = e;
    }
    expect(writeIndexError).toBeInstanceOf(TypeError);
    expect(collection[0]).toBe('a');

    let writeLengthError;
    try {
      // $FlowExpectedError[cannot-write]
      collection.length = 100;
    } catch (e) {
      writeLengthError = e;
    }
    expect(writeLengthError).toBeInstanceOf(TypeError);
    expect(collection.length).toBe(3);
  });

  it('can be converted to an array through common methods', () => {
    const collection = createHTMLCollection(['a', 'b', 'c']);

    expect(Array.from(collection)).toEqual(['a', 'b', 'c']);
    expect([...collection]).toEqual(['a', 'b', 'c']);
  });

  it('can be traversed with for-of', () => {
    const collection = createHTMLCollection(['a', 'b', 'c']);

    let i = 0;
    for (const value of collection) {
      expect(value).toBe(collection[i]);
      i++;
    }
  });

  describe('item()', () => {
    it('returns elements at the specified position, or null', () => {
      const collection = createHTMLCollection(['a', 'b', 'c']);

      expect(collection.item(0)).toBe('a');
      expect(collection.item(1)).toBe('b');
      expect(collection.item(2)).toBe('c');
      expect(collection.item(3)).toBe(null);
    });
  });

  describe('global constructor', () => {
    it('throws when called', () => {
      expect(() => new HTMLCollection()).toThrow(
        "Failed to construct 'HTMLCollection': Illegal constructor",
      );
    });
  });
});
