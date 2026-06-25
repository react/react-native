/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

/*::
import type {BuildType} from '../releases/utils/version-utils';
*/

const {
  updateReactNativeArtifacts,
} = require('../releases/set-rn-artifacts-version');
const {setVersion} = require('../releases/set-version');
const {
  updateHermesVersionsToPrebuilt,
} = require('../releases/utils/hermes-utils');
const {getNpmInfo, publishPackage} = require('../releases/utils/npm-utils');
const {
  publishAndroidArtifactsToMaven,
  publishExternalArtifactsToMaven,
} = require('../releases/utils/release-utils');
const {getBranchName} = require('../releases/utils/scm-utils');
const {REACT_NATIVE_PACKAGE_DIR} = require('../shared/consts');
const {getPackages, getReactNativePackage} = require('../shared/monorepoUtils');
const yargs = require('yargs');

/**
 * This script prepares a release version of react-native and may publish to NPM.
 * It is supposed to run in CI environment, not on a developer's machine.
 *
 * For a dry run (commitly), this script will:
 *  * Version the commitly of the form `1000.0.0-<commitSha>`
 *  * Create Android artifacts
 *  * It will not publish to npm
 *
 * For a nightly run, this script will:
 *  * Version the nightly release of the form `0.0.0-<dateIdentifier>-<commitSha>`
 *  * Create Android artifacts
 *  * Publish to npm using `nightly` tag
 *
 * For a release run, this script will:
 *  * Version the release by the tag version that triggered CI
 *  * Create Android artifacts
 *  * Publish to npm
 *     * using `latest` tag if commit is currently tagged `latest`
 *     * or otherwise `{major}.{minor}-stable`
 */

async function main() {
  const argv = yargs
    .option('t', {
      alias: 'builtType',
      describe: 'The type of build you want to perform.',
      choices: ['dry-run', 'nightly', 'release'],
      default: 'dry-run',
    })
    .strict().argv;

  // $FlowFixMe[prop-missing]
  const buildType = argv.builtType;

  await publishNpm(buildType);
}

async function publishMonorepoPackages(tag /*: ?string */) {
  const projectInfo = await getPackages({
    includePrivate: false,
    includeReactNative: false,
  });

  for (const packageInfo of Object.values(projectInfo)) {
    console.log(`Publishing ${packageInfo.name}...`);
    const result = publishPackage(packageInfo.path, {
      tags: [tag],
      access: 'public',
    });

    const spec = `${packageInfo.name}@${packageInfo.packageJson.version}`;

    if (result.code) {
      throw new Error(
        `Failed to publish ${spec} to npm. Stopping all nightly publishes`,
      );
    }
    console.log(`Published ${spec} to npm`);
  }
}

async function publishNpm(buildType /*: BuildType */) /*: Promise<void> */ {
  const {version, tag} = getNpmInfo(buildType);

  // For stable releases, ci job `prepare_package_for_release` handles this
  if (buildType === 'nightly') {
    // Set hermes versions to latest available
    await updateHermesVersionsToPrebuilt();

    // Set same version for all monorepo packages
    await setVersion(version);
    await publishMonorepoPackages(tag);
  } else if (buildType === 'dry-run') {
    // Before updating React Native artifacts versions for dry-run, we check if the version has already been set.
    // If it has, we don't need to update the artifacts at all (at this will revert them back to 1000.0.0)
    // If it hasn't, we can update the native artifacts accordingly.
    const projectInfo = await getReactNativePackage();

    if (projectInfo.version === '1000.0.0') {
      // Set hermes versions to latest available if not on a stable branch
      if (!/.*-stable/.test(getBranchName())) {
        await updateHermesVersionsToPrebuilt();
      }

      await updateReactNativeArtifacts(version, buildType);
    }
  }

  if (buildType === 'dry-run') {
    console.log('Skipping `npm publish` because --dry-run is set.');
    return;
  }

  // We first publish on Maven Central all the Android artifacts.
  // Those were built by the `build-android` CI job.
  publishAndroidArtifactsToMaven(version, buildType);

  // And we then publish on Maven Central the external artifacts
  // produced by iOS
  // NPM publishing is done just after.
  publishExternalArtifactsToMaven(version, buildType);

  const result = publishPackage(REACT_NATIVE_PACKAGE_DIR, {
    tags: [tag],
  });

  if (result.code) {
    throw new Error(`Failed to publish react-native@${version} to npm.`);
  }
  console.log(`Published react-native@${version} to npm`);
}

module.exports = {
  publishNpm,
};

if (require.main === module) {
  void main();
}
