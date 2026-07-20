/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/*::
import type {Dependency} from './types';
*/

const fs = require('node:fs');
const path = require('node:path');
const util = require('node:util');

const exec = util.promisify(require('node:child_process').exec);

/**
 * Removes and recreates the given folder
 */
async function cleanFolder(folder /*: string */) {
  console.log('✅ Preparing build folder...');
  // Remove the build folder if it already exists
  await exec(`rm -rf ${folder}`);
  // Create the build folder
  await exec(`mkdir -p ${folder}`);
}

/**
 * Reads all files recursively in the fiven dir
 */
function getAllFilesRecursively(
  dirPath /*:string */,
  arrayOfFiles /*: string[] */ = [],
) /*: string[] */ {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFilesRecursively(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

module.exports = {
  cleanFolder,
  getAllFilesRecursively,
};
