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
  }

  // Assumption: if there is no stored last build, we assume that it was build for debug.
  if (!fileExists && configuration === 'Debug') {
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
) {
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

  // Preserve Expo-generated modulemap before replacing directories
  const useFrameworksModulemapName = 'React-use-frameworks.modulemap';
  const useFrameworksModulemapPath = path.join(
    finalLocation,
    useFrameworksModulemapName,
  );
  let savedModulemap = null;
  if (fs.existsSync(useFrameworksModulemapPath)) {
    console.log('Preserving', useFrameworksModulemapName);
    savedModulemap = fs.readFileSync(useFrameworksModulemapPath);
  }

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

    // Delete only directories in finalLocation (e.g. the React.xcframework) -
    // not files, so any sibling files written during pod install are preserved.
    const dirs = fs
      .readdirSync(finalLocation, {withFileTypes: true})
      .filter(dirent => dirent.isDirectory());
    for (const dirent of dirs) {
      const direntName =
        typeof dirent.name === 'string' ? dirent.name : dirent.name.toString();
      const dirPath = `${finalLocation}/${direntName}`;
      console.log('Removing directory', dirPath);
      fs.rmSync(dirPath, {force: true, recursive: true});
    }

    // Move extracted directories from temp to final location
    const extractedEntries = fs
      .readdirSync(tmpExtractDir, {withFileTypes: true})
      .filter(dirent => dirent.isDirectory());
    for (const dirent of extractedEntries) {
      const direntName =
        typeof dirent.name === 'string' ? dirent.name : dirent.name.toString();
      const src = path.join(tmpExtractDir, direntName);
      const dst = path.join(finalLocation, direntName);
      const mvResult = spawnSync('mv', [src, dst], {stdio: 'inherit'});
      if (mvResult.status !== 0) {
        // Fallback: copy recursively then remove source
        console.log(`mv failed for ${direntName}, falling back to cp -R`);
        const cpResult = spawnSync('cp', ['-R', src, dst], {
          stdio: 'inherit',
        });
        if (cpResult.status !== 0) {
          throw new Error(
            `cp fallback failed with exit code ${cpResult.status}`,
          );
        }
      }
    }

    // The podspec prepare_command flattens ReactNativeHeaders' headers into a
    // top-level Headers/ dir, but it does not re-run on a config swap. Mirror
    // it here: re-flatten the headers (identical across slices) and drop the
    // now-redundant xcframework so $(PODS_ROOT)/React-Core-prebuilt/Headers
    // keeps resolving <react/...>, <yoga/...>, etc.
    //
    // Fail closed when the swapped-in tarball lacks ReactNativeHeaders: the
    // directory purge above already deleted the previous Headers/, so
    // continuing silently would leave the injected -fmodule-map-file flag
    // dangling and break every <react/...> include only on a config switch —
    // with no pointer to the version-skewed artifact that caused it.
    const rnhXcfw = path.join(finalLocation, 'ReactNativeHeaders.xcframework');
    if (!fs.existsSync(rnhXcfw)) {
      throw new Error(
        `ReactNativeHeaders.xcframework not found in the extracted tarball at ${finalLocation}. ` +
          'The downloaded artifact predates the headers-spec layout (or is incomplete); ' +
          'use a prebuilt tarball matching this react-native version.',
      );
    }
    const slice = fs
      .readdirSync(rnhXcfw, {withFileTypes: true})
      .find(
        dirent =>
          dirent.isDirectory() &&
          fs.existsSync(path.join(rnhXcfw, dirent.name.toString(), 'Headers')),
      );
    if (!slice) {
      throw new Error(
        `No slice with a Headers directory found inside ${rnhXcfw}.`,
      );
    }
    const headersDest = path.join(finalLocation, 'Headers');
    fs.rmSync(headersDest, {force: true, recursive: true});
    const cpHeaders = spawnSync(
      'cp',
      ['-R', path.join(rnhXcfw, slice.name.toString(), 'Headers'), headersDest],
      {stdio: 'inherit'},
    );
    if (cpHeaders.status !== 0) {
      throw new Error(
        `Flattening ReactNativeHeaders failed with exit code ${cpHeaders.status}`,
      );
    }
    fs.rmSync(rnhXcfw, {force: true, recursive: true});
  } finally {
    // Clean up temp directory
    fs.rmSync(tmpDir, {force: true, recursive: true});

    // Restore Expo-generated modulemap after directory replacement.
    // Runs in finally so it is not skipped if mv/cp partially fails.
    if (savedModulemap != null) {
      const restoredPath = path.join(finalLocation, useFrameworksModulemapName);
      fs.writeFileSync(restoredPath, savedModulemap);
      console.log('Restored', useFrameworksModulemapName);
    }
  }
}

function updateLastBuildConfiguration(configuration /*: string */) {
  console.log(`Updating ${LAST_BUILD_FILENAME} with ${configuration}`);
  fs.writeFileSync(LAST_BUILD_FILENAME, configuration);
}

function main(
  configuration /*: string */,
  version /*: string */,
  podsRoot /*: string */,
) {
  validateBuildConfiguration(configuration);
  validateVersion(version);

  if (!shouldReplaceRnCoreConfiguration(configuration)) {
    return;
  }

  replaceRNCoreConfiguration(configuration, version, podsRoot);
  updateLastBuildConfiguration(configuration);
  console.log('Done replacing React Native prebuilt');
}

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
