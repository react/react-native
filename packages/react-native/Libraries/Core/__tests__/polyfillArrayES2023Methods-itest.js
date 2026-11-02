/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @fantom_hermes_variant *
 */

'use strict';

const originalToSorted = Array.prototype.toSorted;
const originalToReversed = Array.prototype.toReversed;

require('@react-native/fantom/src/setUpDefaultReactNativeEnvironment');

describe('Array ES2023 method polyfills', () => {
  it('preserves native methods and fills missing methods', () => {
    if (originalToSorted == null) {
      expect(Array.prototype.toSorted).toBeDefined();
    } else {
      expect(Array.prototype.toSorted).toBe(originalToSorted);
    }

    if (originalToReversed == null) {
      expect(Array.prototype.toReversed).toBeDefined();
    } else {
      expect(Array.prototype.toReversed).toBe(originalToReversed);
    }
  });

  it('provides non-mutating copying behavior', () => {
    const input = [3, 1, 2];

    expect(input.toSorted((a, b) => a - b)).toEqual([1, 2, 3]);
    expect(input.toReversed()).toEqual([2, 1, 3]);
    expect(input).toEqual([3, 1, 2]);
    expect(
      Object.getOwnPropertyDescriptor(Array.prototype, 'toSorted')?.enumerable,
    ).toBe(false);
    expect(
      Object.getOwnPropertyDescriptor(Array.prototype, 'toReversed')
        ?.enumerable,
    ).toBe(false);
  });
});
