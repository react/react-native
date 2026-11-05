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

// $FlowFixMe[untyped-import]
const {name, peerDependencies} = require('./package.json');
const {styleText} = require('node:util');
const {satisfies} = require('semver');

const COMMUNITY_CLI_PACKAGE = '@react-native-community/cli';
const COMMUNITY_CLI_RANGE = peerDependencies[COMMUNITY_CLI_PACKAGE];

const deprecated = () => {
  throw new Error(
    'react-native/cli is deprecated, please use @react-native-community/cli instead',
  );
};

function resolveFromProject(request /*: string */) {
  // With isolated node_modules (eg pnpm), we won't be able to find
  // `@react-native-community/cli` starting from the `react-native` directory.
  // Instead, we should use the project root, which we assume to be the cwd.
  const options /*: {paths?: Array<string>, ...} */ = {paths: [process.cwd()]};
  return require.resolve(request, options);
}

function findCommunityCli() {
  const rncli = resolveFromProject(COMMUNITY_CLI_PACKAGE);
  // $FlowFixMe[unsupported-syntax]
  return require(rncli);
}

function isMissingCliDependency(error /*: Error */) {
  return (
    // $FlowFixMe[prop-missing]
    error.code === 'MODULE_NOT_FOUND' &&
    /@react-native-community\/cli/.test(error.message)
  );
}

let cli /*: Readonly<{
  bin: string,
  loadConfig: $FlowFixMe,
  run: () => void
}> */ = {
  bin: '/dev/null',
  loadConfig: deprecated,
  run: deprecated,
};

function warnWithExplicitDependency(message /*: string */) {
  console.warn(`
${styleText('yellow', '⚠')}️ ${message} Update your ${styleText(['dim'], 'package.json')} to include:

${styleText(
  ['white', 'bold'],
  `  "devDependencies": {
    "${COMMUNITY_CLI_PACKAGE}": "${COMMUNITY_CLI_RANGE}"
  }
`,
)}

`);
}

function main() {
  try {
    const communityCli = findCommunityCli();
    const manifestPath = resolveFromProject(
      `${COMMUNITY_CLI_PACKAGE}/package.json`,
    );
    // $FlowFixMe[unsupported-syntax]
    const {version} = require(manifestPath);
    if (!satisfies(version, COMMUNITY_CLI_RANGE, {includePrerelease: true})) {
      warnWithExplicitDependency(
        `react-native found ${COMMUNITY_CLI_PACKAGE}@${version}, but requires ${COMMUNITY_CLI_RANGE} for CLI commands.`,
      );
    }
    return communityCli.run(name);
  } catch (e) {
    if (isMissingCliDependency(e)) {
      warnWithExplicitDependency(
        `react-native depends on ${COMMUNITY_CLI_PACKAGE} for CLI commands.`,
      );
      process.exit(1);
    }
    throw e;
  }
}

if (require.main === module) {
  void main();
} else {
  try {
    cli = findCommunityCli();
  } catch (e) {
    // We silence @react-native-community/cli missing as it is no
    // longer a dependency
    if (!isMissingCliDependency(e)) {
      throw e;
    }
  }
}

module.exports = cli;
