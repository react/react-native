/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {execSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function listHeadersInFolder(
  folder /*: string */,
  excludeSubfolders /*: Array<string> */,
) /*: Array<string> */ {
  try {
    // Build find command with exclusions using -prune
    let findCommand = `find "${folder}"`;

    // Add exclusions for specified folders using -prune
    if (excludeSubfolders.length > 0) {
      const pruneConditions = excludeSubfolders
        .map(subfolder => `-name "${subfolder}"`)
        .join(' -o ');
      findCommand += ` \\( ${pruneConditions} \\) -prune -o`;
    }

    findCommand += ` \\( -name "*.h" -o -name "*.hpp" \\) -type f -print`;

    const result = execSync(findCommand, {
      encoding: 'utf8',
      stdio: 'pipe',
    });

    const headerFiles = result
      .trim()
      .split('\n')
      .filter(p => p.length > 0);

    return headerFiles;
  } catch (error) {
    console.error(`Failed to process headers from ${folder}:`, error.message);
    throw error;
  }
}

function setupSymlink(
  sourceFilePath /*: string */,
  destFilePath /*: string */,
) {
  const destFolderPath = path.dirname(destFilePath);
  if (!fs.existsSync(destFolderPath)) {
    fs.mkdirSync(destFolderPath, {recursive: true});
  }

  // Remove existing symlink if it exists
  if (fs.existsSync(destFilePath)) {
    fs.unlinkSync(destFilePath);
  }

  // Create symlink for umbrella header
  if (fs.existsSync(sourceFilePath)) {
    fs.symlinkSync(sourceFilePath, destFilePath);
  }
}

module.exports = {
  setupSymlink,
  listHeadersInFolder,
};
