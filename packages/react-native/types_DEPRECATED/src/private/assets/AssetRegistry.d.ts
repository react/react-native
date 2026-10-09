/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

export type AssetDestPathResolver = 'android' | 'generic';

export interface PackagerAsset {
  __packager_asset: boolean;
  fileSystemLocation: string;
  httpServerLocation: string;
  width: number | null | undefined;
  height: number | null | undefined;
  scales: number[];
  hash: string;
  name: string;
  type: string;
  resolver?: AssetDestPathResolver | undefined;
}

/**
 * Runtime registry that maps asset IDs generated in a Metro bundle to asset
 * metadata. It backs `<Image>`, `Image.resolveAssetSource()`, and any code
 * that resolves `require('./img.png')` on native.
 *
 * Most apps do not use this directly — assets are handled through `<Image>`.
 */
export interface AssetRegistry {
  /**
   * Register an asset. Returns the asset ID.
   */
  registerAsset(asset: PackagerAsset): number;

  /**
   * Retrieve a registered asset by ID.
   */
  getAssetByID(assetId: number): PackagerAsset;
}

export declare const AssetRegistry: AssetRegistry;
