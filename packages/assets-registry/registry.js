/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import {AssetRegistry} from 'react-native';

/*::
export type {AssetDestPathResolver, PackagerAsset} from 'react-native';
*/

// eslint-disable-next-line @react-native/monorepo/no-commonjs-exports
module.exports = {
  registerAsset: AssetRegistry.registerAsset,
  getAssetByID: AssetRegistry.getAssetByID,
};
