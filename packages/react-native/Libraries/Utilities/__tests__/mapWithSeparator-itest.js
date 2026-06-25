/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';
import mapWithSeparator from '../mapWithSeparator';

describe('mapWithSeparator', () => {
  it('mapWithSeparator returns expected results', () => {
    const array = [1, 2, 3];
    const result = mapWithSeparator(
      array,
      function (value) {
        return value * 2;
      },
      function () {
        return 0;
      },
    );
    expect(result).toEqual([2, 0, 4, 0, 6]);
  });

  it('mapWithSeparator indices are correct', () => {
    const array = [1, 2, 3];
    const result = mapWithSeparator(
      array,
      function (value, index) {
        return index;
      },
      function (index) {
        return index;
      },
    );
    expect(result).toEqual([0, 0, 1, 1, 2]);
  });

  it('mapWithSeparator passes correct array and indices', () => {
    const array = [3, 2, 1];
    const result = mapWithSeparator(
      array,
      function (value, index, arr) {
        return arr[index];
      },
      function (index) {
        return index;
      },
    );
    expect(result).toEqual([3, 0, 2, 1, 1]);
  });

  it('mapWithSeparator returns empty array when empty array is given as input', () => {
    const array: Array<number> = [];
    const result = mapWithSeparator(
      array,
      function (value) {
        return value * 2;
      },
      function () {
        return 0;
      },
    );
    expect(result).toEqual([]);
  });
});
