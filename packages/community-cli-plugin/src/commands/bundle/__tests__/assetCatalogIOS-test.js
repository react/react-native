/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {getCatalogImages, getImageSet} from '../assetCatalogIOS';

const path = require('node:path');

jest.dontMock('../assetCatalogIOS');

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

function makeAsset(scales: Array<number>) {
  return {
    __packager_asset: true,
    fileSystemLocation: '/project/img',
    httpServerLocation: '/assets/img',
    width: 100,
    height: 100,
    scales,
    files: scales.map(
      scale => `/project/img/logo${scale === 1 ? '' : `@${scale}x`}.png`,
    ),
    hash: 'hash',
    name: 'logo',
    type: 'png',
  };
}

describe('getCatalogImages', () => {
  test('pairs each standard scale with its file', () => {
    const asset = makeAsset([1, 2, 3]);
    expect(getCatalogImages(asset)).toEqual([
      {scale: 1, src: '/project/img/logo.png'},
      {scale: 2, src: '/project/img/logo@2x.png'},
      {scale: 3, src: '/project/img/logo@3x.png'},
    ]);
  });

  test('skips non-standard scales without shifting file pairing', () => {
    // Regression test: filtering scales without filtering files used to
    // associate the 2x rendition with the 1.5x file.
    const asset = makeAsset([1, 1.5, 2, 3]);
    expect(getCatalogImages(asset)).toEqual([
      {scale: 1, src: '/project/img/logo.png'},
      {scale: 2, src: '/project/img/logo@2x.png'},
      {scale: 3, src: '/project/img/logo@3x.png'},
    ]);
  });

  test('maps a fractional-only asset into the nearest valid slot', () => {
    const asset = makeAsset([1.5]);
    expect(getCatalogImages(asset)).toEqual([
      {scale: 2, src: '/project/img/logo@1.5x.png'},
    ]);
  });

  test('clamps scales larger than 3x to the 3x slot', () => {
    const asset = makeAsset([4]);
    expect(getCatalogImages(asset)).toEqual([
      {scale: 3, src: '/project/img/logo@4x.png'},
    ]);
  });

  test('uses the largest fractional variant when several exist', () => {
    const asset = makeAsset([1.5, 2.5]);
    expect(getCatalogImages(asset)).toEqual([
      {scale: 3, src: '/project/img/logo@2.5x.png'},
    ]);
  });
});

describe('getImageSet', () => {
  test('builds imageset path and per-scale file entries', () => {
    const asset = makeAsset([1, 2, 3]);
    const imageSet = getImageSet('/catalog', asset);
    expect(imageSet.basePath).toBe(path.join('/catalog', 'img_logo.imageset'));
    expect(imageSet.files).toEqual([
      {name: 'img_logo.png', scale: 1, src: '/project/img/logo.png'},
      {name: 'img_logo@2x.png', scale: 2, src: '/project/img/logo@2x.png'},
      {name: 'img_logo@3x.png', scale: 3, src: '/project/img/logo@3x.png'},
    ]);
  });

  test('names the fallback rendition after its catalog slot', () => {
    const asset = makeAsset([1.5]);
    const imageSet = getImageSet('/catalog', asset);
    expect(imageSet.files).toEqual([
      {name: 'img_logo@2x.png', scale: 2, src: '/project/img/logo@1.5x.png'},
    ]);
  });
});
