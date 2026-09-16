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

const {spawnSync} = require('child_process');
const fs = require('fs');
const yargs = require('yargs');

const LAST_BUILD_FILENAME = 'hermes-engine/.last_build_configuration';

function validateBuildConfiguration(configuration) {
  if (!['Debug', 'Release'].includes(configuration)) {
    throw new Error(`Invalid configuration ${configuration}`);
  }
}

function validateVersion(version) {
  if (version == null || version === '') {
    throw new Error('Version cannot be empty');
  }
}

function shouldReplaceHermesConfiguration(configuration) {
  const fileExists = fs.existsSync(LAST_BUILD_FILENAME);

  if (fileExists) {
    console.log(`Found ${LAST_BUILD_FILENAME} file`);
    const oldConfiguration = fs.readFileSync(LAST_BUILD_FILENAME).toString();
    if (oldConfiguration === configuration) {
      console.log(
        'Same config of the previous build. No need to replace Hermes engine',
      );
      return false;
    }
  }

  // Assumption: if there is no stored last build, we assume that it was build for debug.
  if (!fileExists && configuration === 'Debug') {
    console.log(
      'No previous build detected, but Debug Configuration. No need to replace Hermes engine',
    );
    return false;
  }

  return true;
}

function replaceHermesConfiguration(configuration, version, podsRoot) {
  const tarballURLPath = `${podsRoot}/hermes-engine-artifacts/hermes-ios-${version.toLowerCase()}-${configuration.toLowerCase()}.tar.gz`;

  if (!fs.existsSync(tarballURLPath)) {
    throw new Error(`Hermes tarball not found at ${tarballURLPath}`);
  }

  const finalLocation = 'hermes-engine';
  console.log('Preparing the final location');
  fs.rmSync(finalLocation, {force: true, recursive: true});
  fs.mkdirSync(finalLocation, {recursive: true});

  console.log('Extracting the tarball');
  const result = spawnSync(
    'tar',
    ['-xf', tarballURLPath, '-C', finalLocation],
    {
      stdio: 'inherit',
    },
  );
  if (result.status !== 0) {
    fs.rmSync(finalLocation, {force: true, recursive: true});
    throw new Error(
      `Failed to extract ${tarballURLPath}: ${result.error?.message ?? `tar exited with status ${result.status}`}`,
    );
  }
}

function updateLastBuildConfiguration(configuration) {
  fs.writeFileSync(LAST_BUILD_FILENAME, configuration);
}

function main(configuration, version, podsRoot) {
  validateBuildConfiguration(configuration);
  validateVersion(version);

  if (!shouldReplaceHermesConfiguration(configuration)) {
    return;
  }

  replaceHermesConfiguration(configuration, version, podsRoot);
  updateLastBuildConfiguration(configuration);
  console.log('Done replacing hermes-engine');
}

// This script is executed in the Pods folder, which is usually not synched to Github, so it should be ok
const argv = yargs
  .option('c', {
    alias: 'configuration',
    description:
      'Configuration to use to download the right Hermes version. Allowed values are "Debug" and "Release".',
  })
  .option('r', {
    alias: 'reactNativeVersion',
    description:
      'The Version of React Native associated with the Hermes tarball.',
  })
  .option('p', {
    alias: 'podsRoot',
    description: 'The path to the Pods root folder',
  })
  .usage('Usage: $0 -c Debug -r <version> -p <path/to/react-native>').argv;

const configuration = argv.configuration;
const version = argv.reactNativeVersion;
const podsRoot = argv.podsRoot;

main(configuration, version, podsRoot);
