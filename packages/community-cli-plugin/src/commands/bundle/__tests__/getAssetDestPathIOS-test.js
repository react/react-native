/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import getAssetDestPathIOS from '../getAssetDestPathIOS';

const path = require('node:path');

jest.dontMock('../getAssetDestPathIOS');

describe('getAssetDestPathIOS', () => {
  test('should build correct path', () => {
    const asset = {
      name: 'icon',
      type: 'png',
      httpServerLocation: '/assets/test',
    };

    expect(getAssetDestPathIOS(asset, 1)).toBe(
      path.normalize('assets/test/icon.png'),
    );
  });

  test('should consider scale', () => {
    const asset = {
      name: 'icon',
      type: 'png',
      httpServerLocation: '/assets/test',
    };

    expect(getAssetDestPathIOS(asset, 2)).toBe(
      path.normalize('assets/test/icon@2x.png'),
    );
    expect(getAssetDestPathIOS(asset, 3)).toBe(
      path.normalize('assets/test/icon@3x.png'),
    );
  });

  test('should handle assets with a relative path outside of root', () => {
    const asset = {
      name: 'icon',
      type: 'png',
      httpServerLocation: '/assets/../../test',
    };

    expect(getAssetDestPathIOS(asset, 1)).toBe(
      path.normalize('assets/__test/icon.png'),
    );
  });
});
