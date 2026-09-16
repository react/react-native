/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {PackagerAsset} from './registry';

/**
 * @deprecated Use `getAndroidResourceFolderName` from `@react-native/asset-utils` instead.
 */
export function getAndroidResourceFolderName(
  asset: PackagerAsset,
  scale: number,
): string;

/**
 * @deprecated Use `getAndroidResourceIdentifier` from `@react-native/asset-utils` instead.
 */
export function getAndroidResourceIdentifier(asset: PackagerAsset): string;

/**
 * @deprecated Use `@react-native/asset-utils` instead.
 */
export function getBasePath(asset: PackagerAsset): string;
