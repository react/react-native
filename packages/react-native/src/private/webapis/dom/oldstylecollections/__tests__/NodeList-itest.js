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

import {createNodeList} from '../NodeList';

describe('NodeList', () => {
  it('provides an array-like interface', () => {
    const collection = createNodeList(['a', 'b', 'c']);

    expect(collection[0]).toBe('a');
    expect(collection[1]).toBe('b');
    expect(collection[2]).toBe('c');
    expect(collection[3]).toBe(undefined);
    expect(collection.length).toBe(3);
  });

  it('provides indexed access through the item method', () => {
    const collection = createNodeList(['a', 'b', 'c']);

    expect(collection.item(0)).toBe('a');
    expect(collection.item(1)).toBe('b');
    expect(collection.item(2)).toBe('c');
    expect(collection.item(3)).toBe(null);
  });

  it('is immutable (loose mode)', () => {
    const collection = createNodeList(['a', 'b', 'c']);

    collection[0] = 'replacement';
    expect(collection[0]).toBe('a');

    // $FlowExpectedError[cannot-write]
    collection.length = 100;
    expect(collection.length).toBe(3);
  });

  it('is immutable (strict mode)', () => {
    'use strict';

    const collection = createNodeList(['a', 'b', 'c']);

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
    const collection = createNodeList(['a', 'b', 'c']);

    expect(Array.from(collection)).toEqual(['a', 'b', 'c']);
    expect([...collection]).toEqual(['a', 'b', 'c']);
  });

  it('can be traversed with for-of', () => {
    const collection = createNodeList(['a', 'b', 'c']);

    let i = 0;
    for (const value of collection) {
      expect(value).toBe(collection[i]);
      i++;
    }
  });

  describe('keys()', () => {
    it('returns an iterator for keys', () => {
      const collection = createNodeList(['a', 'b', 'c']);

      const keys = collection.keys();
      expect(keys.next()).toEqual({value: 0, done: false});
      expect(keys.next()).toEqual({value: 1, done: false});
      expect(keys.next()).toEqual({value: 2, done: false});
      expect(keys.next()).toEqual({value: undefined, done: true});

      let i = 0;
      for (const key of collection.keys()) {
        expect(key).toBe(i);
        i++;
      }
    });
  });

  describe('values()', () => {
    it('returns an iterator for values', () => {
      const collection = createNodeList(['a', 'b', 'c']);

      const values = collection.values();
      expect(values.next()).toEqual({value: 'a', done: false});
      expect(values.next()).toEqual({value: 'b', done: false});
      expect(values.next()).toEqual({value: 'c', done: false});
      expect(values.next()).toEqual({value: undefined, done: true});

      let i = 0;
      for (const value of collection.values()) {
        expect(value).toBe(collection[i]);
        i++;
      }
    });
  });

  describe('entries()', () => {
    it('returns an iterator for entries', () => {
      const collection = createNodeList(['a', 'b', 'c']);

      const entries = collection.entries();
      expect(entries.next()).toEqual({value: [0, 'a'], done: false});
      expect(entries.next()).toEqual({value: [1, 'b'], done: false});
      expect(entries.next()).toEqual({value: [2, 'c'], done: false});
      expect(entries.next()).toEqual({value: undefined, done: true});

      let i = 0;
      for (const entry of collection.entries()) {
        expect(entry).toEqual([i, collection[i]]);
        i++;
      }
    });
  });

  describe('forEach()', () => {
    it('iterates over the elements like array.forEach (implicit `this`)', () => {
      const collection = createNodeList(['a', 'b', 'c']);

      let i = 0;
      collection.forEach(function (this: unknown, value, index, list) {
        expect(value).toBe(collection[i]);
        expect(index).toBe(i);
        expect(list).toBe(collection);
        expect(this).toBe(window);
        i++;
      });
    });

    it('iterates over the elements like array.forEach (explicit `this`)', () => {
      const collection = createNodeList(['a', 'b', 'c']);

      let i = 0;
      const explicitThis = {id: 'foo'};
      collection.forEach(function (this: unknown, value, index, list) {
        expect(value).toBe(collection[i]);
        expect(index).toBe(i);
        expect(list).toBe(collection);
        expect(this).toBe(explicitThis);
        i++;
      }, explicitThis);
    });
  });

  describe('global constructor', () => {
    it('throws when called', () => {
      expect(() => new NodeList()).toThrow(
        "Failed to construct 'NodeList': Illegal constructor",
      );
    });
  });
});
