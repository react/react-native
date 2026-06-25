/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {setVersion} = require('../releases/set-version');
const {
  setStableHermesForReleaseBranch,
} = require('../releases/utils/hermes-utils');
const {getBranchName} = require('../releases/utils/scm-utils');
const {
  writeReleaseAssetUrlsToDotSlashFiles,
} = require('../releases/write-dotslash-release-asset-urls');
const {parseVersion} = require('./utils/version-utils');
const {execSync} = require('child_process');
const yargs = require('yargs');

async function main() {
  const argv = await yargs
    .option('reactNativeVersion', {
      describe: 'The new React Native version.',
      type: 'string',
      required: true,
    })
    .option('tagAsLatestRelease', {
      describe:
        'Whether the version should be published as the latest version on npm.',
      type: 'boolean',
      default: false,
    })
    .option('dryRun', {
      description: 'Whether we should push the commit to github or not',
      type: 'boolean',
      default: true,
    }).argv;

  const buildType = 'release';
  const version = argv.reactNativeVersion;
  const latest = argv.tagAsLatestRelease;
  const dryRun = argv.dryRun;
  const branch = getBranchName();
  console.info(`Running on branch: ${branch}`);

  console.info('Validating version', version);
  const {prerelease} = parseVersion(version, buildType);

  const npmTag = latest ? 'latest' : prerelease ? 'next' : branch;
  console.info('NPM tag:', npmTag);

  console.info('Setting version for monorepo packages and react-native');
  await setVersion(version, false); // version, skip-react-native

  console.info('Set stable Hermes for release branch');
  await setStableHermesForReleaseBranch();

  console.info('Writing release asset URLs to DotSlash files');
  await writeReleaseAssetUrlsToDotSlashFiles(version);

  if (dryRun) {
    console.info('Running in dry-run mode, skipping git commit');
    console.info(
      `git commit -a -m "Release ${version}" -m "#publish-packages-to-npm&${npmTag}"`,
    );
    console.info(`git tag -a v${version} -m "v${version}"`);
    return;
  }

  console.info('Committing to git');
  execSync(
    `git commit -a -m "Release ${version}" -m "#publish-packages-to-npm&${npmTag}"`,
  );
  execSync(`git tag -a v${version} -m "v${version}"`);
}

if (require.main === module) {
  void main();
}
