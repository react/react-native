/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import filterPlatformAssetScales from '../filterPlatformAssetScales';

jest.dontMock('../filterPlatformAssetScales');

describe('filterPlatformAssetScales', () => {
  test('removes everything but 2x and 3x for iOS', () => {
    expect(filterPlatformAssetScales('ios', [1, 1.5, 2, 3, 4])).toEqual([
      1, 2, 3,
    ]);
    expect(filterPlatformAssetScales('ios', [3, 4])).toEqual([3]);
  });

  test('keeps closest largest one if nothing matches', () => {
    expect(filterPlatformAssetScales('ios', [0.5, 4, 100])).toEqual([4]);
    expect(filterPlatformAssetScales('ios', [0.5, 100])).toEqual([100]);
    expect(filterPlatformAssetScales('ios', [0.5])).toEqual([0.5]);
    expect(filterPlatformAssetScales('ios', [])).toEqual([]);
  });

  test('keeps all scales for unknown platform', () => {
    expect(filterPlatformAssetScales('freebsd', [1, 1.5, 2, 3.7])).toEqual([
      1, 1.5, 2, 3.7,
    ]);
  });
});
