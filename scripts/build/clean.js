/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

require('../shared/babelRegister').registerForScript();

const {BUILD_DIR, PACKAGES_DIR} = require('./build');
const {buildConfig} = require('./config');
const fs = require('node:fs');
const path = require('node:path');
const {parseArgs} = require('node:util');

const config = {
  options: {
    help: {type: 'boolean'},
  },
};

function clean() {
  const {
    values: {help},
    /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/build/clean.js

  Clean build directories for all packages defined in ./scripts/build/config.js.
    `);
    process.exitCode = 0;
    return;
  }

  for (const packageName of Object.keys(buildConfig.packages)) {
    fs.rmSync(path.join(PACKAGES_DIR, packageName, BUILD_DIR), {
      force: true,
      recursive: true,
    });
  }

  process.exitCode = 0;
}

if (require.main === module) {
  clean();
}
