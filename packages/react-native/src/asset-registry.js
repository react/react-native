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

// ----------------------------------------------------------------------------
// Secondary react-native/asset-registry entry point.
//
// This is an untyped secondary entry point intended to be referenced from
// Metro's `transformer.assetRegistryPath` config option. This entry point may
// also be preferred in server-side code.
//
// Apps/libraries should use `import {AssetRegistry} from 'react-native'`.
// ----------------------------------------------------------------------------

const {AssetRegistry} = require('./private/assets/AssetRegistry');

// eslint-disable-next-line @react-native/monorepo/no-commonjs-exports
module.exports = {
  registerAsset: AssetRegistry.registerAsset,
  getAssetByID: AssetRegistry.getAssetByID,
};
