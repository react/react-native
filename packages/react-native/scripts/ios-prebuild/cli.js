/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const yargs = require('yargs');

/*::
import type {BuildFlavor, Destination, Platform} from './types';
*/

const platforms /*: ReadonlyArray<Platform> */ = [
  'ios',
  'ios-simulator',
  'mac-catalyst',
];

// CI can't use commas in cache keys, so 'macOS,variant=Mac Catalyst' was creating troubles
// This map that converts from platforms to valid Xcodebuild destinations.
const platformToDestination /*: Readonly<{|[Platform]: Destination|}> */ = {
  ios: 'iOS',
  'ios-simulator': 'iOS Simulator',
  'mac-catalyst': 'macOS,variant=Mac Catalyst',
};

const cli = yargs
  .usage(
    'This script prepares iOS prebuilds for React Native. It downloads the dependencies, prepare them, builds them and creates the XCFrameworks.' +
      'Calling the script with no options will build all the dependencies for all the slices and configurations.',
  )
  .option('setup', {
    alias: 's',
    type: 'boolean',
    describe: 'Download and setup dependencies',
  })
  .option('build', {
    alias: 'b',
    type: 'boolean',
    describe: 'Build dependencies/platforms',
  })
  .option('compose', {
    alias: 'c',
    type: 'boolean',
    describe: 'Compose xcframework from built dependencies',
  })
  .option('platforms', {
    alias: 'p',
    type: 'array',
    default: platforms,
    describe: 'Specify one or more platforms to build for',
  })
  .option('flavor', {
    alias: 'f',
    type: 'string',
    describe: 'Specify the flavor to build, Debug (default) or Release.',
    default: 'Debug',
  })
  .option('identity', {
    alias: 'i',
    type: 'string',
    describe:
      'Specify the code signing identity to use for signing the frameworks.',
  })
  .help();

/**
 * Returns the tasks that need to be run based on the command line arguments
 */
async function getCLIConfiguration() /*: Promise<?{|
  tasks: {|
    setup: boolean,
    build: boolean,
    compose: boolean,
  |},
  flavor: BuildFlavor,
  destinations: ReadonlyArray<Destination>,
  identity: ?string,
|}> */ {
  // Run input parsing
  const argv = await cli.argv;

  // Verify that the platforms argument is valid
  const platformArray = Array.isArray(argv.platforms)
    ? argv.platforms
    : [argv.platforms];
  const invalidPlatforms = platformArray.filter(rs => !platforms.includes(rs));

  if (invalidPlatforms.length > 0) {
    console.error(
      `Invalid platform specified: ${invalidPlatforms.join(', ')}\nValid platforms are: ${platforms.join(', ')}`,
    );
    return undefined;
  }

  // Prepare platforms and dependencies
  const resolvedPlatforms = platforms
    .filter(p => argv.platforms.includes(p))
    .map(p => platformToDestination[p]);

  // Validate flavor
  const flavor = argv.flavor;
  if (flavor !== 'Debug' && flavor !== 'Release') {
    console.error(
      `Invalid flavor specified: ${flavor}\nValid flavors are: Debug, Release`,
    );
    return undefined;
  }

  // Are we running all commands?
  const runAllCommands =
    argv.setup == null && argv.build == null && argv.compose == null;

  return {
    tasks: {
      setup: runAllCommands || argv.setup != null,
      build: runAllCommands || argv.build != null,
      compose: runAllCommands || argv.compose != null,
    },
    flavor: flavor,
    destinations: resolvedPlatforms,
    identity: argv.identity,
  };
}

module.exports = {getCLIConfiguration};
