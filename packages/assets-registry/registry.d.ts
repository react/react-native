/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

export type AssetDestPathResolver = 'android' | 'generic';

export type PackagerAsset = {
  readonly __packager_asset: boolean;
  readonly fileSystemLocation: string;
  readonly httpServerLocation: string;
  readonly width: number | null | undefined;
  readonly height: number | null | undefined;
  readonly scales: Array<number>;
  readonly hash: string;
  readonly name: string;
  readonly type: string;
  readonly resolver?: AssetDestPathResolver | undefined;
};

export function registerAsset(asset: PackagerAsset): number;

export function getAssetByID(assetId: number): PackagerAsset;
