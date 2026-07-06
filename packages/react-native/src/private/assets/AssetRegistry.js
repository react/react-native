/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

export type AssetDestPathResolver = 'android' | 'generic';

export type PackagerAsset = Readonly<{
  __packager_asset: boolean,
  fileSystemLocation: string,
  httpServerLocation: string,
  width: ?number,
  height: ?number,
  scales: Array<number>,
  hash: string,
  name: string,
  type: string,
  resolver?: AssetDestPathResolver,
  ...
}>;

const assets: Array<PackagerAsset> = [];

/**
 * Runtime registry that maps asset IDs generated in a Metro bundle to asset
 * metadata. It backs `<Image>`, `Image.resolveAssetSource()`, and any code
 * that resolves `require('./img.png')` on native.
 *
 * Most apps do not use this directly — assets are handled through `<Image>`.
 */
export const AssetRegistry = {
  /**
   * Register an asset. Returns the asset ID.
   */
  registerAsset(asset: PackagerAsset): number {
    // `push` returns the new length, so the first asset gets id 1 (not 0),
    // keeping ids truthy.
    return assets.push(asset);
  },

  /**
   * Retrieve a registered asset by ID.
   */
  getAssetByID(assetId: number): PackagerAsset {
    return assets[assetId - 1];
  },
};
