/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {buildDepenencies} = require('./ios-prebuild/build');
const {getCLIConfiguration} = require('./ios-prebuild/cli');
const {createFramework} = require('./ios-prebuild/compose-framework');
const {cleanFolder} = require('./ios-prebuild/folders');
const {setupDependencies} = require('./ios-prebuild/setupDependencies');
const {createSwiftPackageFile} = require('./ios-prebuild/swift-package');
const path = require('node:path');

require('../shared/babelRegister').registerForScript();

const THIRD_PARTY_PATH = 'packages/react-native/third-party';
const BUILD_DESTINATION = '.build';

const SCHEME = 'ReactNativeDependencies';

/**
 * Main entry point
 */
async function main() {
  const cli = await getCLIConfiguration();
  if (cli == null) {
    return 0;
  }

  const buildFolder = path.resolve(THIRD_PARTY_PATH, BUILD_DESTINATION);
  const rootFolder = path.resolve(THIRD_PARTY_PATH);

  if (cli.tasks.setup) {
    await cleanFolder(rootFolder);
    await setupDependencies(cli.dependencies, rootFolder);
  }

  if (cli.tasks.swiftpackage) {
    // Create Package.swift file
    await createSwiftPackageFile(SCHEME, cli.dependencies, rootFolder);
  }

  if (cli.tasks.build) {
    await cleanFolder(buildFolder);
    await buildDepenencies(
      SCHEME,
      cli.configuration,
      cli.dependencies,
      cli.destinations,
      rootFolder,
      buildFolder,
    );
  }

  if (cli.tasks.compose) {
    await createFramework(
      SCHEME,
      cli.configuration,
      cli.dependencies,
      rootFolder,
      buildFolder,
      cli.identity,
    );
  }

  console.log('');
  console.log('🏁 Done!');
}

if (require.main === module) {
  void main();
}
