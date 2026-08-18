/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

require('../../shared/babelRegister').registerForScript();

const {diffApiSnapshot} = require('./diffApiSnapshot');
const fs = require('node:fs');
const {parseArgs} = require('node:util');

const config = {
  allowPositionals: true,
  options: {
    help: {type: 'boolean'},
  },
};

async function main() {
  const {
    positionals: [prevSnapshot, newSnapshot],
    values: {help},
    /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/js-api/diff-api-snapshot <prev-snapshot> <new-snapshot>

  Analyze changes between two versions of React Native's JavaScript API
  snapshot (yarn build-types). Returns a JSON object with the following fields:
  - result: 'BREAKING', 'POTENTIALLY_BREAKING', 'POTENTIALLY_NON_BREAKING' or 'NON_BREAKING'.
  - changedApis: List of changed APIs.
    `);
    process.exitCode = 0;
    return;
  }

  try {
    const result = diffApiSnapshot(
      fs.readFileSync(prevSnapshot, 'utf8'),
      fs.readFileSync(newSnapshot, 'utf8'),
    );
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Error parsing API snapshot:', e);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  void main();
}
