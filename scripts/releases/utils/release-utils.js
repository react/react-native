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

const {echo, exec, exit, test} = require('shelljs');

/*::
type BuildType = 'dry-run' | 'release' | 'nightly';
*/

function generateAndroidArtifacts(releaseVersion /*: string */) {
  // -------- Generating Android Artifacts
  echo('Generating Android artifacts inside /tmp/maven-local');
  if (exec('./gradlew publishAllToMavenTempLocal').code) {
    echo('Could not generate artifacts');
    exit(1);
  }

  echo('Generated artifacts for Maven');

  let artifacts = [
    '.module',
    '.pom',
    '-debug.aar',
    '-release.aar',
    '-debug-sources.jar',
    '-release-sources.jar',
  ].map(suffix => {
    return `react-android-${releaseVersion}${suffix}`;
  });

  artifacts.forEach(name => {
    if (
      !test(
        '-e',
        `/tmp/maven-local/com/facebook/react/react-android/${releaseVersion}/${name}`,
      )
    ) {
      echo(
        `Failing as expected file: \n\
      /tmp/maven-local/com/facebook/react/react-android/${releaseVersion}/${name}\n\
      was not correctly generated.`,
      );
      exit(1);
    }
  });
}

function publishAndroidArtifactsToMaven(
  releaseVersion /*: string */,
  buildType /*: BuildType */,
) {
  // We want to gate ourselves against accidentally publishing a 1.x or a 1000.x on
  // maven central which will break the semver for our artifacts.
  if (buildType === 'release' && releaseVersion.startsWith('0.')) {
    // -------- The Android job already uploaded and closed this staging repository.
    if (
      exec(
        './gradlew findSonatypeStagingRepository releaseSonatypeStagingRepository',
      ).code
    ) {
      echo(
        'Failed to release the staging repository on Sonatype (Maven Central) for Android artifacts',
      );
      exit(1);
    }
  } else {
    echo(
      'Nothing to do as this is not a stable release - Nightlies Android artifacts are published by build_android',
    );
  }

  echo('Finished publishing Android artifacts to Maven Central');
}

function publishExternalArtifactsToMaven(
  releaseVersion /*: string */,
  buildType /*: BuildType */,
) {
  // We want to gate ourselves against accidentally publishing a 1.x or a 1000.x on
  // maven central which will break the semver for our artifacts.
  if (buildType === 'release' && releaseVersion.startsWith('0.')) {
    // -------- For stable releases, we do the publishing and close the staging repository.
    // This can't be done earlier in build_android because this artifact are partially built by the iOS jobs.
    if (
      exec(
        './gradlew :packages:react-native:ReactAndroid:external-artifacts:publishToSonatype closeAndReleaseSonatypeStagingRepository',
      ).code
    ) {
      echo(
        'Failed to close and release the staging repository on Sonatype (Maven Central) for external artifacts',
      );
      exit(1);
    }
  } else {
    const isSnapshot = buildType === 'nightly';
    // -------- For nightly releases, we only need to publish the snapshot to Sonatype snapshot repo.
    if (
      exec(
        './gradlew :packages:react-native:ReactAndroid:external-artifacts:publishToSonatype -PisSnapshot=' +
          isSnapshot.toString(),
      ).code
    ) {
      echo('Failed to publish external artifacts to Sonatype (Maven Central)');
      exit(1);
    }
  }

  echo('Finished publishing external artifacts to Maven Central');
}

function failIfTagExists(version /*: string */, buildType /*: BuildType */) {
  // When dry-run in stable branch, the tag already exists.
  // We are bypassing the tag-existence check when in a dry-run to have the CI pass
  if (buildType === 'dry-run') {
    return;
  }

  if (checkIfTagExists(version)) {
    echo(`Tag v${version} already exists.`);
    echo('You may want to rollback the last commit');
    echo('git reset --hard HEAD~1');
    exit(1);
  }
}

function checkIfTagExists(version /*: string */) {
  const {code, stdout} = exec('git tag -l', {silent: true});
  if (code !== 0) {
    throw new Error('Failed to retrieve the list of tags');
  }
  const tags = new Set(stdout.split('\n'));
  return tags.has(`v${version}`);
}

module.exports = {
  generateAndroidArtifacts,
  publishAndroidArtifactsToMaven,
  publishExternalArtifactsToMaven,
  failIfTagExists,
};
