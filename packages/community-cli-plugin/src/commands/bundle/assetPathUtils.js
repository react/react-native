/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

export type PackagerAsset = Readonly<{
  httpServerLocation: string,
  name: string,
  type: string,
  ...
}>;

/**
 * FIXME: using number to represent discrete scale numbers is fragile in essence because of
 * floating point numbers imprecision.
 */
function getAndroidAssetSuffix(scale: number): string {
  switch (scale) {
    case 0.75:
      return 'ldpi';
    case 1:
      return 'mdpi';
    case 1.5:
      return 'hdpi';
    case 2:
      return 'xhdpi';
    case 3:
      return 'xxhdpi';
    case 4:
      return 'xxxhdpi';
    default:
      return '';
  }
}

// See https://developer.android.com/guide/topics/resources/drawable-resource.html
const drawableFileTypes: Set<string> = new Set<string>([
  'gif',
  'heic',
  'heif',
  'jpeg',
  'jpg',
  'png',
  'webp',
  'xml',
]);

function getAndroidResourceFolderName(
  asset: PackagerAsset,
  scale: number,
): string {
  if (!drawableFileTypes.has(asset.type)) {
    return 'raw';
  }
  const suffix = getAndroidAssetSuffix(scale);
  if (!suffix) {
    throw new Error(
      `Don't know which android drawable suffix to use for asset: ${JSON.stringify(
        asset,
      )}`,
    );
  }
  const androidFolder = `drawable-${suffix}`;
  return androidFolder;
}

function getResourceIdentifier(asset: PackagerAsset): string {
  const folderPath = getBasePath(asset);
  return `${folderPath}/${asset.name}`
    .toLowerCase()
    .replace(/\//g, '_') // Encode folder structure in file name
    .replace(/([^a-z0-9_])/g, '') // Remove illegal chars
    .replace(/^(?:assets|assetsunstable_path)_/, ''); // Remove "assets_" or "assetsunstable_path_" prefix
}

function getBasePath(asset: PackagerAsset): string {
  let basePath = asset.httpServerLocation;
  if (basePath[0] === '/') {
    basePath = basePath.substr(1);
  }
  return basePath;
}

export default {
  drawableFileTypes,
  getAndroidAssetSuffix,
  getAndroidResourceFolderName,
  getResourceIdentifier,
  getBasePath,
};
