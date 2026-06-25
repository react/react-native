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

import assetPathUtils from './assetPathUtils';
import fs from 'fs';
import path from 'path';

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

export function getImageSet(
  catalogDir: string,
  asset: AssetData,
  scales: ReadonlyArray<number>,
): ImageSet {
  const fileName = assetPathUtils.getResourceIdentifier(asset);
  return {
    basePath: path.join(catalogDir, `${fileName}.imageset`),
    files: scales.map((scale, idx) => {
      const suffix = scale === 1 ? '' : `@${scale}x`;
      return {
        name: `${fileName + suffix}.${asset.type}`,
        scale,
        src: asset.files[idx],
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
