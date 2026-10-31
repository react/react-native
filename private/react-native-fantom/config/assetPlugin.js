/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/*::
import type {AssetData} from 'metro/private/Assets';
*/

module.exports = function assetPlugin /*:: <T extends AssetData> */(
  asset /*: T */,
) /*: {...T, fantomFiles: Array<string>, ...} */ {
  return {...asset, fantomFiles: asset.files};
};
