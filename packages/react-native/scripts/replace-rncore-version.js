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

const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const yargs = require('yargs');

const LAST_BUILD_FILENAME = 'React-Core-prebuilt/.last_build_configuration';

// Not a valid configuration, so finding it means the swap did not finish.
const REPLACEMENT_IN_PROGRESS = 'in-progress';

function validateBuildConfiguration(configuration /*: string */) {
  if (!['Debug', 'Release'].includes(configuration)) {
    throw new Error(`Invalid configuration ${configuration}`);
  }
}

function validateVersion(version /*: ?string */) {
  if (version == null || version === '') {
    throw new Error('Version cannot be empty');
  }
}

function shouldReplaceRnCoreConfiguration(configuration /*: string */) {
  const fileExists = fs.existsSync(LAST_BUILD_FILENAME);

  if (fileExists) {
    console.log(`Found ${LAST_BUILD_FILENAME} file`);
    const oldConfiguration = fs.readFileSync(LAST_BUILD_FILENAME).toString();
    if (oldConfiguration === configuration) {
      console.log(
        'Same config of the previous build. No need to replace React-Core-prebuilt',
      );
      return false;
    }
    return true;
  }

  // With no marker the on-disk flavor is Debug: the podspec installs the debug
  // tarball (see resolve_podspec_source in scripts/cocoapods/rncore.rb).
  if (configuration === 'Debug') {
    console.log(
      'No previous build detected, but Debug Configuration. No need to replace React-Core-prebuilt',
    );
    return false;
  }

  return true;
}

function replaceRNCoreConfiguration(
  configuration /*: string */,
  version /*: string */,
  podsRoot /*: string */,
) /*: void */ {
  // Filename comes from rncore.rb
  const tarballURLPath = `${podsRoot}/ReactNativeCore-artifacts/reactnative-core-${version.toLowerCase()}-${configuration.toLowerCase()}.tar.gz`;

  const finalLocation = 'React-Core-prebuilt';

  // Extract to a temporary directory on a regular filesystem first, then move
  // into the final location. This avoids issues with partial tar extraction on
  // certain filesystems (e.g. EdenFS) where extracting directly can silently
  // produce incomplete results.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rncore-'));
  const tmpExtractDir = path.join(tmpDir, 'React-Core-prebuilt');
  fs.mkdirSync(tmpExtractDir, {recursive: true});

  try {
    console.log('Extracting the tarball to temp dir', tarballURLPath);
    const result = spawnSync(
      'tar',
      ['-xf', tarballURLPath, '-C', tmpExtractDir],
      {
        stdio: 'inherit',
      },
    );

    if (result.status !== 0) {
      throw new Error(`tar extraction failed with exit code ${result.status}`);
    }

    // Verify extraction produced the expected xcframework structure. The
    // module map now lives per-slice inside React.framework, so check the
    // xcframework's Info.plist instead of a root Modules/module.modulemap.
    const xcfwPath = path.join(tmpExtractDir, 'React.xcframework');
    const infoPlistPath = path.join(xcfwPath, 'Info.plist');
    if (!fs.existsSync(infoPlistPath)) {
      throw new Error(
        `Extraction verification failed: ${infoPlistPath} not found`,
      );
    }

    // Replace only the compiled framework. Headers/ is flattened from
    // ReactNativeHeaders by the podspec prepare_command, and the prebuild
    // compose job emits one set of those headers for both configurations, so a
    // config switch leaves them identical. Leaving them alone keeps
    // Headers/module.modulemap — which consumers activate through
    // -fmodule-map-file — in place for the whole build; deleting and recreating
    // it mid-build lets a concurrent dependency scan miss it, and the React
    // module then precompiles without it (#57803).
    const dest = path.join(finalLocation, 'React.xcframework');
    console.log('Replacing', dest);
    fs.rmSync(dest, {force: true, recursive: true});
    const mvResult = spawnSync('mv', [xcfwPath, dest], {stdio: 'inherit'});
    if (mvResult.status !== 0) {
      // Fallback: copy recursively then remove source
      console.log('mv failed for React.xcframework, falling back to cp -R');
      const cpResult = spawnSync('cp', ['-R', xcfwPath, dest], {
        stdio: 'inherit',
      });
      if (cpResult.status !== 0) {
        throw new Error(`cp fallback failed with exit code ${cpResult.status}`);
      }
    }
  } finally {
    fs.rmSync(tmpDir, {force: true, recursive: true});
  }
}

function updateLastBuildConfiguration(configuration /*: string */) {
  console.log(`Updating ${LAST_BUILD_FILENAME} with ${configuration}`);
  fs.writeFileSync(LAST_BUILD_FILENAME, configuration);
}

function markReplacementInProgress() /*: void */ {
  fs.writeFileSync(LAST_BUILD_FILENAME, REPLACEMENT_IN_PROGRESS);
}

function main(
  configuration /*: string */,
  version /*: string */,
  podsRoot /*: string */,
) {
  validateBuildConfiguration(configuration);
  validateVersion(version);

  if (!shouldReplaceRnCoreConfiguration(configuration)) {
    // A fresh install leaves no marker; record the flavor we skipped on.
    if (!fs.existsSync(LAST_BUILD_FILENAME)) {
      updateLastBuildConfiguration(configuration);
    }
    return;
  }

  // Invalidate before touching the framework so an interrupted swap is
  // detectable on the next run.
  markReplacementInProgress();
  replaceRNCoreConfiguration(configuration, version, podsRoot);
  updateLastBuildConfiguration(configuration);
  console.log('Done replacing React Native prebuilt');
}

if (require.main === module) {
  // This script is executed in the Pods folder, which is usually not synched to Github, so it should be ok
  const argv = yargs
    .option('c', {
      alias: 'configuration',
      description:
        'Configuration to use to download the right React-Core prebuilt version. Allowed values are "Debug" and "Release".',
    })
    .option('r', {
      alias: 'reactNativeVersion',
      description:
        'The Version of React Native associated with the React-Core prebuilt tarball.',
    })
    .option('p', {
      alias: 'podsRoot',
      description: 'The path to the Pods root folder',
    })
    .usage('Usage: $0 -c Debug -r <version> -p <path/to/react-native>').argv;

  // $FlowFixMe[prop-missing]
  const configuration = argv.configuration;
  // $FlowFixMe[prop-missing]
  const version = argv.reactNativeVersion;
  // $FlowFixMe[prop-missing]
  const podsRoot = argv.podsRoot;

  main(configuration, version, podsRoot);
}

module.exports = {replaceRNCoreConfiguration};
