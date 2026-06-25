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

const fs = require('fs');
// $FlowFixMe[untyped-import]
const inquirer = require('inquirer');
const path = require('path');

/*::
type BuildType = 'dry-run' | 'release' | 'nightly';
*/

const SDKS_DIR = path.normalize(path.join(__dirname, '..', '..', 'sdks'));
const HERMES_TAG_FILE_PATH = path.join(SDKS_DIR, '.hermesv1version');

function readHermesTag() /*: string */ {
  if (fs.existsSync(HERMES_TAG_FILE_PATH)) {
    const data = fs
      .readFileSync(HERMES_TAG_FILE_PATH, {
        encoding: 'utf8',
        flag: 'r',
      })
      .trim();

    if (data.length > 0) {
      return data;
    } else {
      throw new Error('[Hermes] .hermesv1version file is empty.');
    }
  }

  throw new Error('[Hermes] .hermesv1version does not exist.');
}

async function setHermesTag(hermesTag /*: string */) {
  if (!fs.existsSync(SDKS_DIR)) {
    fs.mkdirSync(SDKS_DIR, {recursive: true});
  }

  if (!fs.existsSync(HERMES_TAG_FILE_PATH)) {
    fs.writeFileSync(HERMES_TAG_FILE_PATH, hermesTag.trim());
    return;
  }

  const previousHermesTag = fs.readFileSync(HERMES_TAG_FILE_PATH, {
    encoding: 'utf8',
    flag: 'r',
  });

  if (previousHermesTag.trim() === hermesTag.trim()) {
    console.log('[Hermes] .hermesv1version file is unchanged.');
    return;
  }

  const {confirmHermesTag} = await inquirer.prompt({
    type: 'confirm',
    name: 'confirmHermesTag',
    message: `Do you want to update release tag for Hermes from "${previousHermesTag}" to "${hermesTag}"?`,
  });

  if (confirmHermesTag) {
    fs.writeFileSync(HERMES_TAG_FILE_PATH, hermesTag.trim());
  } else {
    console.log('[Hermes] .hermesv1version file is unchanged.');
  }
}

module.exports = {
  readHermesTag,
  setHermesTag,
};
