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

/*::
import type {Command} from '@react-native-community/cli-types';
 */

// IMPORTANT: This is a routing file only. Do NOT add new command
// definitions or implementations here.
//
// New CLI commands belong in @react-native/community-cli-plugin, and
// may (temporarily) be imported and registered here.
//
// Future state: The Community Template should directly depend on and inject:
// - @react-native-community/cli-platform-android
// - @react-native-community/cli-platform-ios
// - @react-native/community-cli-plugin

const verbose = Boolean(process.env.DEBUG?.includes('react-native'));

function findCommunityPlatformPackage(
  spec /*: string */,
  startDir /*: string */ = process.cwd(),
) {
  // In monorepos, we cannot make any assumptions on where
  // `@react-native-community/*` gets installed. The safest way to find it
  // (barring adding an optional peer dependency) is to start from the project
  // root.
  //
  // Note that we're assuming that the current working directory is the project
  // root. This is also what `@react-native-community/cli` assumes (see
  // https://github.com/react-native-community/cli/blob/14.x/packages/cli-tools/src/findProjectRoot.ts).
  const main = require.resolve(spec, {paths: [startDir]});
  // $FlowFixMe[unsupported-syntax]
  return require(main);
}

let android;
try {
  android = findCommunityPlatformPackage(
    '@react-native-community/cli-platform-android',
  );
} catch {
  if (verbose) {
    console.warn(
      '@react-native-community/cli-platform-android not found, the react-native.config.js may be unusable.',
    );
  }
}

let ios;
try {
  ios = findCommunityPlatformPackage(
    '@react-native-community/cli-platform-ios',
  );
} catch {
  if (verbose) {
    console.warn(
      '@react-native-community/cli-platform-ios not found, the react-native.config.js may be unusable.',
    );
  }
}

const commands /*: Array<Command> */ = [];

const {
  bundleCommand,
  codegenCommand,
  spmCommand,
  startCommand,
} = require('@react-native/community-cli-plugin');

commands.push(bundleCommand, startCommand, spmCommand, codegenCommand);

const config = {
  commands,
  platforms: {} /*:: as {[string]: Readonly<{
      projectConfig: unknown,
      dependencyConfig: unknown,
    }>} */,
};

if (ios != null) {
  config.commands.push(...ios.commands);
  config.platforms.ios = {
    projectConfig: ios.projectConfig,
    dependencyConfig: ios.dependencyConfig,
  };
}

if (android != null) {
  config.commands.push(...android.commands);
  config.platforms.android = {
    projectConfig: android.projectConfig,
    dependencyConfig: android.dependencyConfig,
  };
}

module.exports = config;
