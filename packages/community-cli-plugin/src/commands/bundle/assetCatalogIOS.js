/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AssetData} from 'metro';

import {ALLOWED_SCALES} from './filterPlatformAssetScales';
import {getAndroidResourceIdentifier} from '@react-native/asset-utils';
import fs from 'node:fs';
import path from 'node:path';

export function cleanAssetCatalog(catalogDir: string): void {
  const files = fs
    .readdirSync(catalogDir)
    .filter(file => file.endsWith('.imageset'));
  for (const file of files) {
    fs.rmSync(path.join(catalogDir, file), {recursive: true, force: true});
  }
}

type ImageSet = {
  basePath: string,
  files: {name: string, src: string, scale: number}[],
};

// Scales an iOS asset catalog imageset can hold. actool silently drops
// renditions at any other scale (e.g. a fractional @1.5x).
const CATALOG_SCALES = ALLOWED_SCALES.ios;

type CatalogImage = {scale: number, src: string};

/**
 * Pairs each catalog-valid scale of the asset with its source file.
 *
 * If the asset has no valid scale at all (e.g. only a fractional @1.5x
 * variant), its closest variant is mapped into the nearest valid slot,
 * mirroring the "closest larger" fallback filterPlatformAssetScales applies
 * to loose files, so the imageset always contains at least one rendition
 * actool will compile.
 */
export function getCatalogImages(asset: AssetData): Array<CatalogImage> {
  const images: Array<CatalogImage> = [];
  asset.scales.forEach((scale, idx) => {
    if (CATALOG_SCALES.includes(scale)) {
      images.push({scale, src: asset.files[idx]});
    }
  });
  if (images.length === 0 && asset.scales.length > 0) {
    const maxCatalogScale = CATALOG_SCALES[CATALOG_SCALES.length - 1];
    let idx = asset.scales.findIndex(scale => scale > maxCatalogScale);
    if (idx === -1) {
      idx = asset.scales.length - 1;
    }
    const scale = Math.min(
      maxCatalogScale,
      Math.max(1, Math.ceil(asset.scales[idx])),
    );
    console.warn(
      `warning: Asset "${asset.name}" has no 1x/2x/3x variant; ` +
        `using its @${asset.scales[idx]}x file as the ${scale}x catalog rendition.`,
    );
    images.push({scale, src: asset.files[idx]});
  }
  return images;
}

export function getImageSet(catalogDir: string, asset: AssetData): ImageSet {
  const fileName = getAndroidResourceIdentifier(asset);
  return {
    basePath: path.join(catalogDir, `${fileName}.imageset`),
    files: getCatalogImages(asset).map(({scale, src}) => {
      const suffix = scale === 1 ? '' : `@${scale}x`;
      return {
        name: `${fileName + suffix}.${asset.type}`,
        scale,
        src,
      };
    }),
  };
}

export function isCatalogAsset(asset: AssetData): boolean {
  return asset.type === 'png' || asset.type === 'jpg' || asset.type === 'jpeg';
}

export function writeImageSet(imageSet: ImageSet): void {
  fs.mkdirSync(imageSet.basePath, {recursive: true});

  for (const file of imageSet.files) {
    const dest = path.join(imageSet.basePath, file.name);
    fs.copyFileSync(file.src, dest);
  }

  fs.writeFileSync(
    path.join(imageSet.basePath, 'Contents.json'),
    JSON.stringify({
      images: imageSet.files.map(file => ({
        filename: file.name,
        idiom: 'universal',
        scale: `${file.scale}x`,
      })),
      info: {
        author: 'xcode',
        version: 1,
      },
    }),
  );
}
