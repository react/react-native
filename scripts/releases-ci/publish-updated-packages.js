/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {publishPackage} = require('../releases/utils/npm-utils');
const {getPackages} = require('../shared/monorepoUtils');
const {execSync} = require('node:child_process');
const {parseArgs} = require('node:util');

const PUBLISH_PACKAGES_TAG = '#publish-packages-to-npm';

const config = {
  options: {
    help: {type: 'boolean'},
  },
};

async function main() {
  const {
    values: {help},
    /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/releases/publish-updated-packages.js

  Publishes all updated packages (excluding react-native) to npm. This script
  is intended to run from a CI workflow.
    `);
    return;
  }

  await publishUpdatedPackages();
}

async function publishUpdatedPackages() {
  let commitMessage;

  try {
    commitMessage = execSync('git log -1 --pretty=%B').toString();
  } catch {
    throw new Error('Failed to read Git commit message, exiting.');
  }

  if (!commitMessage.includes(PUBLISH_PACKAGES_TAG)) {
    console.log(
      'Current commit does not include #publish-packages-to-npm keyword, skipping.',
    );
    return;
  }

  console.log('Discovering updated packages');

  const packages = await getPackages({
    includeReactNative: false,
  });
  const packagesToUpdate = [];

  await Promise.all(
    Object.values(packages).map(async pck => {
      const version = pck.packageJson.version;

      if (!version.startsWith('0.')) {
        throw new Error(
          `Package version expected to be 0.x.x, but received ${version}`,
        );
      }

      const response = await fetch('https://registry.npmjs.org/' + pck.name);
      const {versions: versionsInRegistry} = await response.json();

      if (version in versionsInRegistry) {
        console.log(
          `- Skipping ${pck.name} (${version} already present on npm)`,
        );
        return;
      }

      packagesToUpdate.push(pck.name);
    }),
  );

  console.log('Done ✅');
  console.log('Publishing updated packages to npm');

  const tags = getTagsFromCommitMessage(commitMessage);
  const failedPackages = [];

  for (const packageName of packagesToUpdate) {
    const pck = packages[packageName];
    console.log(`- Publishing ${pck.name} (${pck.packageJson.version})`);

    try {
      runPublish(pck.name, pck.path, tags);
    } catch {
      console.log('--- Retrying once! ---');
      try {
        runPublish(pck.name, pck.path, tags);
      } catch (e) {
        failedPackages.push(pck.name);
      }
    }
  }

  if (failedPackages.length) {
    throw new Error(`Failed packages count = ${failedPackages.length}`);
  }

  console.log('Done ✅');
}

function getTagsFromCommitMessage(msg /*: string */) /*: Array<string> */ {
  // ex message we're trying to parse tags out of
  // `_some_message_here_${PUBLISH_PACKAGES_TAG}&tagA&tagB\n`;
  return msg
    .substring(msg.indexOf(PUBLISH_PACKAGES_TAG))
    .trim()
    .split('&')
    .slice(1);
}

function runPublish(
  packageName /*: string */,
  packagePath /*: string */,
  tags /*: Array<string> */,
) {
  const result = publishPackage(packagePath, {
    tags,
  });

  if (result.code !== 0) {
    console.error(
      `Failed to publish ${packageName}. npm publish exited with code ${result.code}:`,
    );
    console.error(result.stderr);
    throw new Error(result.stderr);
  }
}

if (require.main === module) {
  void main();
}

module.exports = {
  getTagsFromCommitMessage,
  publishUpdatedPackages,
};
