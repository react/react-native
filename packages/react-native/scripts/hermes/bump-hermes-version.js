#!/usr/bin/env node
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

const {
  updateHermesCompilerVersionInDependencies,
  updateHermesRuntimeDependenciesVersions,
} = require('../../../../scripts/releases/utils/hermes-utils');
const {
  getPackageVersionStrByTag,
} = require('../../../../scripts/releases/utils/npm-utils');
const {setHermesTag} = require('./hermes-utils');
// $FlowFixMe[untyped-import]
const inquirer = require('inquirer');
/**
 * This script walks a releaser through bumping the Hermes version for a release.
 * It needs be executed on a release branch.
 */
const {exit} = require('shelljs');
const yargs = require('yargs');

let argv = yargs.option('v', {
  alias: 'version',
  describe:
    'Hermes version to use for this React Native release, ex. hermes-250829098.0.0. Used both as the .hermesv1version tag (for building from source) and as the prebuilt package version. If omitted, the latest published version is fetched from NPM.',
  required: false,
}).argv;

async function main() {
  // $FlowFixMe[prop-missing]
  let hermesVersion = argv.version;

  if (!hermesVersion) {
    console.log(
      'No Hermes version provided. Fetching the latest version from NPM...',
    );
    hermesVersion = await getPackageVersionStrByTag(
      'hermes-compiler',
      'latest-v1',
    );
  }

  const {confirmHermesVersion} = await inquirer.prompt({
    type: 'confirm',
    name: 'confirmHermesVersion',
    message: `Do you want to use the Hermes version "${hermesVersion}"?`,
  });

  if (!confirmHermesVersion) {
    console.log('Aborting.');
    return;
  }

  // `.hermesv1version` is used as a git ref to download the Hermes source
  // (https://github.com/facebook/hermes/tarball/<ref>), where release tags are
  // named `hermes-v<version>`. While hermes-compiler and prebuilt dependencies
  // use the bare npm version.
  const bareVersion = hermesVersion.replace(/^hermes-v/, '');
  await setHermesTag(`hermes-v${bareVersion}`);
  await updateHermesCompilerVersionInDependencies(bareVersion);
  await updateHermesRuntimeDependenciesVersions(bareVersion);
}

void main().then(() => {
  exit(0);
});
