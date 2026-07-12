/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PackagerAsset} from '@react-native/asset-utils';

import {
  getAndroidResourceFolderName,
  getAndroidResourceIdentifier,
} from '@react-native/asset-utils';
import path from 'path';

function getAssetDestPathAndroid(asset: PackagerAsset, scale: number): string {
  const androidFolder = getAndroidResourceFolderName(asset, scale);
  const fileName = getAndroidResourceIdentifier(asset);
  return path.join(androidFolder, `${fileName}.${asset.type}`);
}

export default getAssetDestPathAndroid;
