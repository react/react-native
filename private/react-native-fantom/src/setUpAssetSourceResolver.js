/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import NativeFantom from '../../../packages/react-native/src/private/testing/fantom/specs/NativeFantom';
import {Image} from 'react-native';

export default function setUpAssetSourceResolver(): void {
  const resolveAssetSource = Image.resolveAssetSource;
  resolveAssetSource.addCustomSourceTransformer(resolver => {
    const asset: unknown = resolver.asset;
    if (
      asset == null ||
      typeof asset !== 'object' ||
      !('fantomFiles' in asset) ||
      !Array.isArray(asset.fantomFiles)
    ) {
      return null;
    }
    const files = asset.fantomFiles;
    const scale = resolveAssetSource.pickScale(resolver.asset.scales);
    const file = files[resolver.asset.scales.indexOf(scale)];
    if (typeof file !== 'string') {
      throw new Error(
        `Fantom could not find a bundled file for ${resolver.asset.name}.${resolver.asset.type} at scale ${scale}.`,
      );
    }
    const source = resolver.defaultAsset();
    NativeFantom.registerAsset(source.uri, file);
    return source;
  });
}
