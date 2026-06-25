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
const {TEMPLATES_FOLDER_PATH} = require('./constants');
const {codegenLog, writeFileSyncIfChanged} = require('./utils');
const fs = require('fs');
const path = require('path');

const PACKAGE_SWIFT_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'Package.swift.template',
);

function generatePackageSwift(
  projectRoot /*: string */,
  outputDir /*: string */,
  reactNativePath /*: string */,
) {
  const fullOutputPath = path.join(projectRoot, outputDir);
  fs.mkdirSync(outputDir, {recursive: true});
  // Generate PAckage.swift File
  codegenLog('Generating Package.swift');
  const templateH = fs
    .readFileSync(PACKAGE_SWIFT_TEMPLATE_PATH, 'utf8')
    .replace(
      /{reactNativePath}/,
      path.relative(fullOutputPath, reactNativePath),
    );
  const finalPathH = path.join(outputDir, 'Package.swift');
  writeFileSyncIfChanged(finalPathH, templateH);
  codegenLog(`Generated artifact: ${finalPathH}`);
}

module.exports = {
  generatePackageSwift,
};
