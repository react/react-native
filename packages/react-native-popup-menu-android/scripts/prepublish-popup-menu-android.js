/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

/*
 * This script is used to update the android/build.gradle.kts file
 * with the versions from the libs.versions.toml file.
 *
 * This is needed because this package is consumed from source from
 * external users and we don't want to have several SDK version around to
 * maintain.
 *
 * It's invoked as a prepublish script for this package.
 */

function extractVersion(tomlContent, regex) {
  const match = tomlContent.match(regex);
  return match && match[1] ? match[1] : null;
}

const fs = require('node:fs');

const buildGradleKtsPath = 'android/build.gradle.kts';
const libsVersionsTomlPath = '../react-native/gradle/libs.versions.toml';

console.log(
  `Updating ${buildGradleKtsPath} with versions from ${libsVersionsTomlPath}...`,
);

let gradleContent = fs.readFileSync(buildGradleKtsPath, 'utf8');
const tomlContent = fs.readFileSync(libsVersionsTomlPath, 'utf8');

const compileSdk = extractVersion(tomlContent, /compileSdk\s*=\s*"(\d+)"/);
const minSdk = extractVersion(tomlContent, /minSdk\s*=\s*"(\d+)"/);
const buildTools = extractVersion(tomlContent, /buildTools\s*=\s*"([\d.]+)"/);

gradleContent = gradleContent
  .replace('libs.versions.compileSdk.get().toInt()', compileSdk)
  .replace('libs.versions.minSdk.get().toInt()', minSdk)
  .replace('libs.versions.buildTools.get()', `"${buildTools}"`)
  .replace(
    'project(":packages:react-native:ReactAndroid")',
    '"com.facebook.react:react-android"',
  );

fs.writeFileSync(buildGradleKtsPath, gradleContent);

console.log('Done!');
