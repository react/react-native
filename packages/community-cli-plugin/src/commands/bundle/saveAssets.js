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

import {
  cleanAssetCatalog,
  getImageSet,
  isCatalogAsset,
  writeImageSet,
} from './assetCatalogIOS';
import createKeepFileAsync from './createKeepFileAsync';
import filterPlatformAssetScales from './filterPlatformAssetScales';
import getAssetDestPathAndroid from './getAssetDestPathAndroid';
import getAssetDestPathIOS from './getAssetDestPathIOS';
import fs from 'fs';
import path from 'path';
import {styleText} from 'util';

type CopiedFiles = {
  [src: string]: string,
};

async function saveAssets(
  assets: ReadonlyArray<AssetData>,
  platform: string,
  assetsDest?: string,
  assetCatalogDest?: string,
): Promise<void> {
  if (assetsDest == null) {
    console.warn('Warning: Assets destination folder is not set, skipping...');
    return;
  }

  const filesToCopy: CopiedFiles = {};

  const getAssetDestPath =
    platform === 'android' ? getAssetDestPathAndroid : getAssetDestPathIOS;

  const addAssetToCopy = (asset: AssetData) => {
    const validScales = new Set(
      filterPlatformAssetScales(platform, asset.scales),
    );

    asset.scales.forEach((scale, idx) => {
      if (!validScales.has(scale)) {
        return;
      }
      const src = asset.files[idx];
      const dest = path.join(assetsDest, getAssetDestPath(asset, scale));
      filesToCopy[src] = dest;
    });
  };

  if (platform === 'ios' && assetCatalogDest != null) {
    // Use iOS Asset Catalog for images. This will allow Apple app thinning to
    // remove unused scales from the optimized bundle.
    const catalogDir = path.join(assetCatalogDest, 'RNAssets.xcassets');
    if (!fs.existsSync(catalogDir)) {
      console.error(
        `${styleText('red', 'error')}: Could not find asset catalog 'RNAssets.xcassets' in ${assetCatalogDest}. Make sure to create it if it does not exist.`,
      );
      return;
    }

    console.info('Adding images to asset catalog', catalogDir);
    cleanAssetCatalog(catalogDir);
    for (const asset of assets) {
      if (isCatalogAsset(asset)) {
        const imageSet = getImageSet(
          catalogDir,
          asset,
          filterPlatformAssetScales(platform, asset.scales),
        );
        writeImageSet(imageSet);
      } else {
        addAssetToCopy(asset);
      }
    }
    console.info('Done adding images to asset catalog');
  } else {
    assets.forEach(addAssetToCopy);
  }
  if (platform === 'android') {
    await createKeepFileAsync(assets, assetsDest);
  }

  return copyAll(filesToCopy);
}

function copyAll(filesToCopy: CopiedFiles) {
  const queue = Object.keys(filesToCopy);
  if (queue.length === 0) {
    return Promise.resolve();
  }

  console.info(`Copying ${queue.length} asset files`);
  return new Promise<void>((resolve, reject) => {
    const copyNext = (error?: Error) => {
      if (error) {
        reject(error);
        return;
      }
      if (queue.length === 0) {
        console.info('Done copying assets');
        resolve();
      } else {
        // queue.length === 0 is checked in previous branch, so this is string
        const src = queue.shift();
        // $FlowFixMe[incompatible-type]
        const dest = filesToCopy[src];
        // $FlowFixMe[incompatible-type]
        copy(src, dest, copyNext);
      }
    };
    copyNext();
  });
}

function copy(
  src: string,
  dest: string,
  callback: (error: Error) => void,
): void {
  const destDir = path.dirname(dest);
  fs.mkdir(destDir, {recursive: true}, (err?) => {
    if (err) {
      callback(err);
      return;
    }
    fs.createReadStream(src)
      .pipe(fs.createWriteStream(dest))
      .on('finish', callback);
  });
}

export default saveAssets;
