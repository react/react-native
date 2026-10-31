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
import nullthrows from 'nullthrows';
import {Image} from 'react-native';

export default function setUpDefaultFonts(): void {
  for (const asset of [
    require('dejavu-fonts-ttf/ttf/DejaVuSans.ttf'),
    require('dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf'),
    require('dejavu-fonts-ttf/ttf/DejaVuSans-Oblique.ttf'),
    require('dejavu-fonts-ttf/ttf/DejaVuSans-BoldOblique.ttf'),
    require('@expo-google-fonts/noto-color-emoji/400Regular/NotoColorEmoji_400Regular.ttf'),
  ]) {
    const assetId: unknown = asset;
    if (typeof assetId !== 'number') {
      throw new Error('Expected a bundled Fantom font asset ID.');
    }
    NativeFantom.registerFont(
      nullthrows(Image.resolveAssetSource(assetId)).uri,
    );
  }
}
