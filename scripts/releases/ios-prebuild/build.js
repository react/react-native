/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {execSync} = require('node:child_process');

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
  mergeable /*: boolean */,
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
        mergeable,
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
  mergeable /*: boolean */,
) {
  console.log(`Building ${destination}...`);
  const command = getPlatformBuildCommand(
    scheme,
    configuration,
    destination,
    buildFolder,
    mergeable,
  );

  execSync(command, {cwd: rootFolder, stdio: 'inherit'});
}

// MERGEABLE_LIBRARY=YES would also reach static library targets such as glog
// and break their link, so enable it only where MACH_O_TYPE is mh_dylib.
const MERGEABLE_SETTINGS =
  "'MERGEABLE_LIBRARY=$(MERGEABLE_LIBRARY_$(MACH_O_TYPE))' MERGEABLE_LIBRARY_mh_dylib=YES";

function getPlatformBuildCommand(
  scheme /*: string */,
  configuration /*: string */,
  destination /*: Destination */,
  buildFolder /*: string */,
  mergeable /*: boolean */,
) /*: string */ {
  const command =
    `xcodebuild -scheme "${scheme}" -destination "generic/platform=${destination}" ` +
    `-derivedDataPath "${buildFolder}" ` +
    `-configuration "${configuration}" ` +
    'SKIP_INSTALL=NO \
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
    DEBUG_INFORMATION_FORMAT=dwarf-with-dsym';
  if (configuration !== 'Release') {
    return command;
  }
  // Xcode defaults Release to -Os. Android builds these dependencies at -O2 in
  // Release. A command-line setting applies to every configuration, so add it
  // only to Release builds.
  const releaseCommand = `${command} GCC_OPTIMIZATION_LEVEL=2`;
  return mergeable ? `${releaseCommand} ${MERGEABLE_SETTINGS}` : releaseCommand;
}

module.exports = {
  buildDepenencies,
  getPlatformBuildCommand,
};
