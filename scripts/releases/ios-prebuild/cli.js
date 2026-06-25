/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {dependencies, platforms} = require('./configuration');
const yargs = require('yargs');

/*::
import type {Dependency, Destination, Platform} from './types';
*/

// CI can't use commas in cache keys, so 'macOS,variant=Mac Catalyst' was creating troubles
// This map that converts from platforms to valid Xcodebuild destinations.
const platformToDestination /*: Readonly<{|[Platform]: Destination|}> */ = {
  ios: 'iOS',
  'ios-simulator': 'iOS Simulator',
  macos: 'macOS',
  'mac-catalyst': 'macOS,variant=Mac Catalyst',
  tvos: 'tvOS',
  'tvos-simulator': 'tvOS Simulator',
  xros: 'visionOS',
  'xros-simulator': 'visionOS Simulator',
};

const arrayLike = (value /*: Array<any> */) /*: Array<any> */ =>
  Array.isArray(value) ? value : [value];

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
  .option('swiftpackage', {
    alias: 'w',
    type: 'boolean',
    describe: 'Creates the Package.swift file',
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
  .option('dependencies', {
    alias: 'd',
    type: 'array',
    default: dependencies.filter(d => !d.disabled).map(d => d.name),
    describe: 'Specify one or more dependencies',
  })
  .option('configuration', {
    alias: 'r',
    type: 'string',
    default: 'Debug',
    describe: 'Specify the configuration to build, Release or Debug (default).',
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
    swiftpackage: boolean,
    build: boolean,
    compose: boolean,
  |},
  destinations: ReadonlyArray<Destination>,
  dependencies: ReadonlyArray<Dependency>,
  configuration: string,
  identity: ?string,
|}> */ {
  // Run input parsing
  const argv = await cli.argv;

  // Verify that the platforms argument is valid
  const invalidPlatforms = arrayLike(argv.platforms).filter(
    rs => !platforms.includes(rs),
  );
  if (invalidPlatforms.length > 0) {
    console.error(
      `Invalid platform specified: ${invalidPlatforms.join(', ')}\nValid platforms are: ${platforms.join(', ')}`,
    );
    return undefined;
  }

  // Verify that the dependencies argument is valid
  const invalidDependencies = arrayLike(argv.dependencies).filter(
    rd => !dependencies.map(d => d.name).includes(rd),
  );
  if (invalidDependencies.length > 0) {
    console.error(
      `Invalid dependency specified: ${invalidDependencies.join(', ')}.\nValid dependencies are: ${dependencies
        .map(d => d.name)
        .join(', ')}`,
    );
    return undefined;
  }

  // Prepare platforms and dependencies
  const resolvedPlatforms = platforms
    .filter(p => argv.platforms.includes(p))
    .map(p => platformToDestination[p]);
  const resolvedDependencies = dependencies.filter(d =>
    argv.dependencies.includes(d.name),
  );

  // Are we running all commands?
  const runAllCommands =
    argv.setup == null &&
    argv.swiftpackage == null &&
    argv.build == null &&
    argv.compose == null;

  return {
    tasks: {
      setup: runAllCommands || argv.setup != null,
      swiftpackage: runAllCommands || argv.swiftpackage != null,
      build: runAllCommands || argv.build != null,
      compose: runAllCommands || argv.compose != null,
    },
    destinations: resolvedPlatforms,
    dependencies: resolvedDependencies,
    configuration: argv.configuration,
    identity: argv.identity,
  };
}

module.exports = {getCLIConfiguration};
