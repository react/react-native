/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {
  buildSwiftPackage,
  computeFrameworkPaths,
  computeProductsFolder,
} = require('./ios-prebuild/build');
const {getCLIConfiguration} = require('./ios-prebuild/cli');
const {setup} = require('./ios-prebuild/setup');
const {createLogger, throwIfOnEden} = require('./ios-prebuild/utils');
const {buildXCFrameworks} = require('./ios-prebuild/xcframework');
const path = require('node:path');

const REACT_NATIVE_PACKAGE_ROOT_FOLDER = path.join(__dirname, '..');
const packageJsonPath = path.join(
  REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  'package.json',
);

const prebuildLog = createLogger('Prebuild');

// $FlowFixMe[unsupported-syntax]
const {version: currentVersion} = require(packageJsonPath);

async function main() {
  const cli = await getCLIConfiguration();
  if (cli == null) {
    return 0;
  }

  const buildType = cli.flavor;

  prebuildLog(`Prebuilding React Native iOS for ${buildType}...`);

  throwIfOnEden();

  try {
    // Root
    const root = process.cwd();

    // Create build folder
    const buildFolder = path.resolve(root, '.build');

    if (cli.tasks.setup) {
      await setup(root, buildFolder, currentVersion, buildType);
    }

    const outputFolder = path.join(buildFolder, 'output', 'spm', buildType);
    // BUILD SWIFT PACKAGE
    if (cli.tasks.build) {
      cli.destinations.forEach(destination => {
        buildSwiftPackage(
          root,
          buildFolder,
          buildType,
          destination,
          outputFolder,
        );
      });
    }

    // GENERATE XCFrameworks
    if (cli.tasks.compose) {
      const productsFolder = computeProductsFolder(outputFolder);
      const frameworkPaths = computeFrameworkPaths(productsFolder);
      buildXCFrameworks(
        root,
        buildFolder,
        frameworkPaths,
        buildType,
        cli.identity,
      );
    }

    // Done!
    prebuildLog('🏁 Done!');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  void main();
}
