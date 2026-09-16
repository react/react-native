/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * @deprecated Use `import type {AssetDestPathResolver} from 'react-native'` instead.
 */
export type AssetDestPathResolver = 'android' | 'generic';

/**
 * @deprecated Use `import type {PackagerAsset} from 'react-native'` instead.
 */
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

/**
 * @deprecated Use `import {AssetRegistry} from 'react-native'` instead.
 */
export function registerAsset(asset: PackagerAsset): number;

/**
 * @deprecated Use `import {AssetRegistry} from 'react-native'` instead.
 */
export function getAssetByID(assetId: number): PackagerAsset;
