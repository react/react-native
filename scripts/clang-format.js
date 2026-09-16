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

const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const {globSync} = require('tinyglobby');

const REPO_ROOT = path.resolve(__dirname, '..');
const OSS_CLANG_FORMAT_DOTSLASH = path.join(__dirname, 'clang-format');
const GENERATED_MARKER = Buffer.from('@' + 'generated');
const IGNORE_FILE = path.join(REPO_ROOT, '.clang-format-ignore');
const MAX_HEADER_BYTES = 4096;
const MAX_FILES_PER_PROCESS = 30;

const SOURCE_GLOB = '**/*.{c,cc,cpp,cu,cuh,cxx,h,hh,hpp,hxx,m,mm,proto,tcc}';

function findClangFormat() {
  if (process.env.CLANG_FORMAT != null && process.env.CLANG_FORMAT !== '') {
    return {command: process.env.CLANG_FORMAT, prefixArguments: []};
  }

  try {
    const metaClangFormat = require('./clang-format.fb').findMetaClangFormat();
    if (metaClangFormat != null) {
      return metaClangFormat;
    }
  } catch (error) {
    if (
      error == null ||
      error.code !== 'MODULE_NOT_FOUND' ||
      !String(error.message).includes("'./clang-format.fb'")
    ) {
      throw error;
    }
  }

  return {
    command:
      process.env.DOTSLASH != null && process.env.DOTSLASH !== ''
        ? process.env.DOTSLASH
        : require('fb-dotslash'),
    prefixArguments: [OSS_CLANG_FORMAT_DOTSLASH],
  };
}

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
  const arguments_ = process.argv.slice(2);
  const check = arguments_.includes('--check');
  const clangFormat = findClangFormat();
  const positionalArguments = arguments_.filter(
    argument => argument !== '--check',
  );
  const ignore = fs
    .readFileSync(IGNORE_FILE, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '' && !line.startsWith('#'));
  const discoveredFiles = globSync(SOURCE_GLOB, {cwd: REPO_ROOT, ignore});
  const files =
    positionalArguments.length > 0
      ? positionalArguments.filter(file => discoveredFiles.includes(file))
      : discoveredFiles;
  const sourceFiles = files.filter(file => !isGenerated(file));
  let exitStatus = 0;

  for (let i = 0; i < sourceFiles.length; i += MAX_FILES_PER_PROCESS) {
    const formatterArguments = [
      ...(check ? ['--dry-run', '--Werror'] : ['-i']),
      ...sourceFiles.slice(i, i + MAX_FILES_PER_PROCESS),
    ];
    const result = spawnSync(
      clangFormat.command,
      [...clangFormat.prefixArguments, ...formatterArguments],
      {
        cwd: REPO_ROOT,
        stdio: 'inherit',
      },
    );

    if (result.error != null) {
      throw result.error;
    }
    if (result.signal != null) {
      throw new Error(`clang-format was terminated by ${result.signal}`);
    }
    if (result.status !== 0) {
      exitStatus = result.status ?? 1;
    }
  }
  process.exitCode = exitStatus;
}

main();
