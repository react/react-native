/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/*::
import type {BuildType, Version} from './utils/version-utils';
*/

const {getNpmInfo} = require('../releases/utils/npm-utils');
const {REPO_ROOT} = require('../shared/consts');
const {parseVersion, validateBuildType} = require('./utils/version-utils');
const {promises: fs} = require('node:fs');
const path = require('node:path');
const {parseArgs} = require('node:util');

const GRADLE_FILE_PATH = path.join(
  REPO_ROOT,
  'packages/react-native/ReactAndroid/gradle.properties',
);

const config = {
  options: {
    'build-type': {
      type: 'string',
      short: 'b',
    },
    'to-version': {
      type: 'string',
      short: 'v',
    },
    help: {type: 'boolean'},
  },
};

/**
 * @deprecated This script entry point is deprecated. Please use `set-version`
 * instead.
 */
async function main() {
  const {
    values: {help, 'build-type': buildType, 'to-version': toVersion},
    /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/releases/set-rn-artifacts-version.js [OPTIONS]

  Updates relevant native files in the react-native package to materialize
  the given release version. This does not update package.json.

  Options:
    --build-type       One of ['dry-run', 'nightly', 'release'].
    --to-version       The new version string.
    `);
    return;
  }

  if (!validateBuildType(buildType)) {
    throw new Error(`Unsupported build type: ${buildType}`);
  }

  await updateReactNativeArtifacts(
    toVersion ?? getNpmInfo(buildType).version,
    buildType,
  );
}

async function updateReactNativeArtifacts(
  version /*: string */,
  buildType /*: ?BuildType */,
) {
  const versionInfo = parseVersion(version, buildType);

  await updateSourceFiles(versionInfo);
  await updateTestFiles(versionInfo);
  await updateGradleFile(versionInfo.version);
}

function updateSourceFiles(
  versionInfo /*: Version */,
) /*: Promise<Array<void>>*/ {
  const templateData = {version: versionInfo};

  return Promise.all([
    fs.writeFile(
      path.join(
        REPO_ROOT,
        'packages/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/systeminfo/ReactNativeVersion.kt',
      ),
      require('./templates/ReactNativeVersion.kt-template')(templateData),
    ),
    fs.writeFile(
      path.join(REPO_ROOT, 'packages/react-native/React/Base/RCTVersion.m'),
      require('./templates/RCTVersion.m-template')(templateData),
    ),
    fs.writeFile(
      path.join(
        REPO_ROOT,
        'packages/react-native/ReactCommon/cxxreact/ReactNativeVersion.h',
      ),
      require('./templates/ReactNativeVersion.h-template')(templateData),
    ),
    fs.writeFile(
      path.join(
        REPO_ROOT,
        'packages/react-native/Libraries/Core/ReactNativeVersion.js',
      ),
      require('./templates/ReactNativeVersion.js-template')(templateData),
    ),
  ]);
}

function updateTestFiles(
  versionInfo /*: Version */,
) /*: Promise<Array<void>>*/ {
  const oldVersion = /"\d+\.\d+\.\d+(-rc\.\d+)?\\/g;
  const newVersion = `"${versionInfo.version}\\`;

  const snapshotTestPath = path.join(
    __dirname,
    '..',
    '..',
    'packages',
    'react-native',
    'scripts',
    'codegen',
    '__tests__',
    '__snapshots__',
    'generate-artifacts-executor-test.js.snap',
  );

  const promise /*: Promise<void> */ = new Promise(async (resolve, reject) => {
    try {
      let snapshot = String(await fs.readFile(snapshotTestPath, 'utf8')).trim();
      // Replace all occurrences of the old version pattern with the new version
      snapshot = snapshot.replaceAll(oldVersion, newVersion);
      await fs.writeFile(snapshotTestPath, snapshot, {encoding: 'utf8'});
      resolve();
    } catch (error) {
      reject(error);
    }
  });

  return Promise.all([promise]);
}

async function updateGradleFile(version /*: string */) /*: Promise<void> */ {
  const contents = await fs.readFile(GRADLE_FILE_PATH, 'utf-8');

  return fs.writeFile(
    GRADLE_FILE_PATH,
    contents.replace(/^VERSION_NAME=.*/, `VERSION_NAME=${version}`),
  );
}

module.exports = {
  updateReactNativeArtifacts,
  updateGradleFile,
  updateSourceFiles,
};

if (require.main === module) {
  void main();
}
