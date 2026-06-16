/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {getAndroidResourceFolderName} from '../path-support';

const DRAWABLE_ASSET = {
  __packager_asset: true,
  fileSystemLocation: 'foo.png',
  httpServerLocation: '/assets/',
  width: 150,
  height: 150,
  scales: [1],
  hash: '__HASH__',
  name: 'foo',
  type: 'png',
};

const NON_DRAWABLE_ASSET = {
  __packager_asset: true,
  fileSystemLocation: 'foo.txt',
  httpServerLocation: '/assets/',
  width: 150,
  height: 150,
  scales: [1],
  hash: '__HASH__',
  name: 'foo',
  type: 'txt',
};

describe('getAndroidResourceFolderName', () => {
  test('supports the six primary density buckets', () => {
    expect(getAndroidResourceFolderName(DRAWABLE_ASSET, 0.75)).toBe(
      'drawable-ldpi',
    );
    expect(getAndroidResourceFolderName(DRAWABLE_ASSET, 1)).toBe(
      'drawable-mdpi',
    );
    expect(getAndroidResourceFolderName(DRAWABLE_ASSET, 1.5)).toBe(
      'drawable-hdpi',
    );
    expect(getAndroidResourceFolderName(DRAWABLE_ASSET, 2)).toBe(
      'drawable-xhdpi',
    );
    expect(getAndroidResourceFolderName(DRAWABLE_ASSET, 3)).toBe(
      'drawable-xxhdpi',
    );
    expect(getAndroidResourceFolderName(DRAWABLE_ASSET, 4)).toBe(
      'drawable-xxxhdpi',
    );
  });

  test('supports nonstandard densities', () => {
    expect(getAndroidResourceFolderName(DRAWABLE_ASSET, 1.25)).toBe(
      'drawable-200dpi',
    );
    expect(getAndroidResourceFolderName(DRAWABLE_ASSET, 1.66)).toBe(
      'drawable-266dpi',
    );
    expect(getAndroidResourceFolderName(DRAWABLE_ASSET, 1.33)).toBe(
      'drawable-213dpi',
    ); // ~tvdpi
  });

  test('throws if the density cannot be processed', () => {
    expect(() => getAndroidResourceFolderName(DRAWABLE_ASSET, -1)).toThrow();
    expect(() => getAndroidResourceFolderName(DRAWABLE_ASSET, 0)).toThrow();
    expect(() =>
      getAndroidResourceFolderName(DRAWABLE_ASSET, Infinity),
    ).toThrow();
  });

  test('returns "raw" for non-drawables', () => {
    expect(getAndroidResourceFolderName(NON_DRAWABLE_ASSET, 0.75)).toBe('raw');
    expect(getAndroidResourceFolderName(NON_DRAWABLE_ASSET, 1)).toBe('raw');
    expect(getAndroidResourceFolderName(NON_DRAWABLE_ASSET, 1.25)).toBe('raw');
  });
});
