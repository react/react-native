/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {execSync} = require('child_process');

/*::
import type { Dependency, Destination, Platform } from './types';
*/

/**
 * Builds dependencies for the specified platforms. This function will use the generated
 * Package.swift file together with the extracted dependencies to build the frameworks for
 * the requested platforms.
 */
async function buildDepenencies(
  scheme /*: string */,
  configuration /*: string */,
  dependencies /*: ReadonlyArray<Dependency> */,
  destinations /*: ReadonlyArray<Destination> */,
  rootFolder /*: string */,
  buildFolder /*: string */,
) {
  console.log('✅ Building dependencies...');

  await Promise.all(
    destinations.map(destination =>
      buildPlatform(
        scheme,
        configuration,
        destination,
        rootFolder,
        buildFolder,
      ),
    ),
  );
}

/**
 * Builds a single platform.
 */
async function buildPlatform(
  scheme /*: string */,
  configuration /*: string */,
  destination /*: Destination */,
  rootFolder /*: string */,
  buildFolder /*: string */,
) {
  console.log(`Building ${destination}...`);
  const command =
    `xcodebuild -scheme "${scheme}" -destination "generic/platform=${destination}" ` +
    `-derivedDataPath "${buildFolder}" ` +
    `-configuration "${configuration}" ` +
    'SKIP_INSTALL=NO \
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
    DEBUG_INFORMATION_FORMAT=dwarf-with-dsym';

  execSync(command, {cwd: rootFolder, stdio: 'inherit'});
}

module.exports = {
  buildDepenencies,
};
