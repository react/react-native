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
import type {InputConfigT} from 'metro-config';
*/

const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

function repositoryPath(relativePath /*: string */) {
  return path.join(__dirname, '..', '..', relativePath);
}

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  // Make Metro able to resolve required external dependencies
  watchFolders: [
    repositoryPath('node_modules'),
    repositoryPath('packages/asset-utils'),
    repositoryPath('packages/assets-registry'),
    repositoryPath('packages/normalize-color'),
    repositoryPath('packages/polyfills'),
    repositoryPath('packages/react-native'),
    repositoryPath('packages/virtualized-lists'),
  ],
  resolver: {
    blockList: [/..\/..\/packages\/react-native\/sdks\/hermes/],
    extraNodeModules: {
      'react-native': repositoryPath('packages/react-native'),
    },
  },
};

module.exports = mergeConfig(
  getDefaultConfig(__dirname),
  config,
) /*:: as Readonly<InputConfigT> */;
