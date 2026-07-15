/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// @flow
const {log, sleep} = require('./utils');

const SLEEP_S = 60; // 1 minute
const MAX_RETRIES = 90; // 90 attempts. Waiting between attempt: 1 min. Total time: 90 min.
const ARTIFACT_URL =
  'https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/';
const ARTIFACT_NAME = 'react-native-artifacts-';

// The primary xcframework classifier tarballs attached to the
// react-native-artifacts publication (external-artifacts/build.gradle.kts).
// The 4 dSYM classifiers (core/deps dSYM debug+release) are intentionally
// excluded — they are debug-symbol sidecars, not consumed at install time.
// The POM check alone would pass even when a classifier artifact never made
// it to Maven.
const ARTIFACT_CLASSIFIERS = [
  'reactnative-core-debug',
  'reactnative-core-release',
  'reactnative-dependencies-debug',
  'reactnative-dependencies-release',
  'reactnative-headers-debug',
  'reactnative-headers-release',
  'reactnative-dependencies-headers-debug',
  'reactnative-dependencies-headers-release',
];

async function verifyArtifactsAreOnMaven(
  version: string,
  retries: number = MAX_RETRIES,
): Promise<void> {
  if (version.startsWith('v')) {
    version = version.substring(1);
  }

  const urls = [
    `${ARTIFACT_URL}${version}/${ARTIFACT_NAME}${version}.pom`,
    ...ARTIFACT_CLASSIFIERS.map(
      classifier =>
        `${ARTIFACT_URL}${version}/${ARTIFACT_NAME}${version}-${classifier}.tar.gz`,
    ),
  ];
  for (let currentAttempt = 1; currentAttempt <= retries; currentAttempt++) {
    let missingUrl = null;
    for (const url of urls) {
      try {
        const response = await fetch(url, {method: 'HEAD'});
        if (response.status === 200) {
          continue;
        }
        log(`Got status ${response.status} while checking ${url}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log(`Network error while checking ${url}: ${message}`);
        missingUrl = url;
        break;
      }
      missingUrl = url;
      break;
    }

    if (missingUrl == null) {
      return;
    }
    log(
      `${currentAttempt}) Artifact's for version ${version} are not on maven yet.\nURL: ${missingUrl}\nLet's wait a minute and try again.\n`,
    );
    await sleep(SLEEP_S);
  }

  log(
    `We waited 90 minutes for the artifacts to be on Maven. Check https://status.maven.org/ if there are issues wth the service.`,
  );
  process.exit(1);
}

module.exports = {verifyArtifactsAreOnMaven};
