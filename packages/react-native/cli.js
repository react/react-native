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
const {name} = require('./package.json');
const {styleText} = require('util');

const deprecated = () => {
  throw new Error(
    'react-native/cli is deprecated, please use @react-native-community/cli instead',
  );
};

function findCommunityCli(startDir /*: string */ = process.cwd()) {
  // With isolated node_modules (eg pnpm), we won't be able to find
  // `@react-native-community/cli` starting from the `react-native` directory.
  // Instead, we should use the project root, which we assume to be the cwd.
  const options /*: {paths?: Array<string>, ...} */ = {paths: [startDir]};
  const rncli = require.resolve('@react-native-community/cli', options);
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

function warnWithExplicitDependency(version /*: string */ = '*') {
  console.warn(`
${styleText('yellow', '⚠')}️ ${styleText(['dim'], 'react-native')} depends on ${styleText('dim', '@react-native-community/cli')} for cli commands. To fix update your ${styleText(['dim'], 'package.json')} to include:

${styleText(
  ['white', 'bold'],
  `  "devDependencies": {
    "@react-native-community/cli": "latest",
  }
`,
)}

`);
}

function main() {
  try {
    return findCommunityCli().run(name);
  } catch (e) {
    if (isMissingCliDependency(e)) {
      warnWithExplicitDependency();
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
