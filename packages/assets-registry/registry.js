/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

/*::
export type AssetDestPathResolver = 'android' | 'generic';

export type PackagerAsset = {
  readonly __packager_asset: boolean,
  readonly fileSystemLocation: string,
  readonly httpServerLocation: string,
  readonly width: ?number,
  readonly height: ?number,
  readonly scales: Array<number>,
  readonly hash: string,
  readonly name: string,
  readonly type: string,
  readonly resolver?: AssetDestPathResolver,
  ...
};
*/

const assets /*: Array<PackagerAsset> */ = [];

function registerAsset(asset /*: PackagerAsset */) /*: number */ {
  // `push` returns new array length, so the first asset will
  // get id 1 (not 0) to make the value truthy
  return assets.push(asset);
}

function getAssetByID(assetId /*: number */) /*: PackagerAsset */ {
  return assets[assetId - 1];
}

// eslint-disable-next-line @react-native/monorepo/no-commonjs-exports
module.exports = {registerAsset, getAssetByID};
