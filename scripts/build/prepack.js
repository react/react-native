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

const {promises: fs} = require('node:fs');
const path = require('node:path');

// "prepack" script to prepare JavaScript packages for publishing.
//
// We use this to copy over fields from "publishConfig" to the root of each
// package.json, which is not supported in Yarn v1.

async function prepack() {
  const pkgJsonPath = path.join(process.cwd(), './package.json');
  const contents = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'));

  if (
    path.dirname(pkgJsonPath).split(path.sep).slice(-2, -1)[0] !== 'packages'
  ) {
    console.error('Error: prepack.js must be run from a package directory');
    process.exitCode = 1;
    return;
  }

  if (contents.publishConfig != null) {
    for (const key of Object.keys(contents.publishConfig)) {
      contents[key] = contents.publishConfig[key];
    }
  }
  delete contents.publishConfig;

  await fs.writeFile(pkgJsonPath, JSON.stringify(contents, null, 2) + '\n');
}

if (require.main === module) {
  void prepack();
}
