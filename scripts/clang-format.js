/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

'use strict';

const dotslash = require('fb-dotslash');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const {globSync} = require('tinyglobby');

const REPO_ROOT = path.resolve(__dirname, '..');
const CLANG_FORMAT = path.join(__dirname, 'clang-format');
const GENERATED_MARKER = Buffer.from('@' + 'generated');
const MAX_HEADER_BYTES = 4096;
const MAX_FILES_PER_PROCESS = 30;

/** @param {string} file */
function isGenerated(file) {
  let fd;
  try {
    fd = fs.openSync(path.resolve(REPO_ROOT, file), 'r');
    const header = Buffer.alloc(MAX_HEADER_BYTES);
    const bytesRead = fs.readSync(fd, header, 0, header.length, 0);
    return header.subarray(0, bytesRead).includes(GENERATED_MARKER);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to inspect ${file}: ${message}`, {cause: error});
  } finally {
    if (fd != null) {
      fs.closeSync(fd);
    }
  }
}

function main() {
  const files =
    process.argv.length > 2
      ? process.argv.slice(2)
      : globSync('*/**/*.{h,cpp,m,mm}', {cwd: REPO_ROOT});
  const sourceFiles = files.filter(file => !isGenerated(file));

  for (let i = 0; i < sourceFiles.length; i += MAX_FILES_PER_PROCESS) {
    const result = spawnSync(
      dotslash,
      [CLANG_FORMAT, '-i', ...sourceFiles.slice(i, i + MAX_FILES_PER_PROCESS)],
      {
        cwd: REPO_ROOT,
        stdio: 'inherit',
      },
    );

    if (result.error != null) {
      throw result.error;
    }
    if (result.signal != null) {
      process.kill(process.pid, result.signal);
      return;
    }
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}

main();
