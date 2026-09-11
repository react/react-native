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

const {
  IS_META_CHECKOUT,
  commandVersion,
  findMetaTool,
} = require('./format-utils');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const {globSync} = require('tinyglobby');

const REPO_ROOT = path.resolve(__dirname, '..');
const CONFIG = path.join(REPO_ROOT, '.swift-format');
const GENERATED_MARKER = Buffer.from('@' + 'generated');
const MINIMUM_SWIFT_FORMAT_MAJOR = 6;
const MINIMUM_SWIFT_FORMAT_MINOR = 3;
const MAX_FILES_PER_PROCESS = 100;
const MAX_HEADER_BYTES = 4096;
const IGNORE = ['**/Pods/**', '**/build/**', '**/node_modules/**'];

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

function parseSwiftFormatVersion(output) {
  const version =
    /swift-format(?: version)?[:\s]+(\d+)\.(\d+)/i.exec(output) ??
    /Swift version\s+(\d+)\.(\d+)/i.exec(output) ??
    /^\s*(\d+)\.(\d+)/.exec(output);
  if (version == null) {
    return null;
  }
  const reportedMajor = Number(version[1]);
  return reportedMajor >= 100
    ? [Math.floor(reportedMajor / 100), reportedMajor % 100]
    : [reportedMajor, Number(version[2])];
}

function findSwiftFormat() {
  const candidates = [];
  if (process.env.SWIFT_FORMAT != null && process.env.SWIFT_FORMAT !== '') {
    candidates.push([process.env.SWIFT_FORMAT, []]);
  } else {
    const metaSwiftFormat = findMetaTool(
      'tools',
      'lint',
      'swift-format',
      'swift-format',
    );
    if (metaSwiftFormat != null) {
      candidates.push([
        metaSwiftFormat.command,
        metaSwiftFormat.prefixArguments,
      ]);
    }
    candidates.push(['swift-format', []], ['swift', ['format']]);
  }
  for (const [command, prefixArguments] of candidates) {
    const result = commandVersion(command, prefixArguments);
    const version = parseSwiftFormatVersion(result.output);
    if (
      result.status === 0 &&
      version != null &&
      (version[0] > MINIMUM_SWIFT_FORMAT_MAJOR ||
        (version[0] === MINIMUM_SWIFT_FORMAT_MAJOR &&
          version[1] >= MINIMUM_SWIFT_FORMAT_MINOR))
    ) {
      return {command, prefixArguments};
    }
  }
  const instructions = IS_META_CHECKOUT
    ? 'Meta: unset SWIFT_FORMAT and run `tools/lint/swift-format/swift-format --version` from the fbsource root. If that fails, repair your Meta DotSlash setup.'
    : 'Please install Swift 6.3 or newer and make sure `swift-format` or `swift` is in your PATH, or set SWIFT_FORMAT=/path/to/swift-format.';
  console.warn(
    'warning: Skipping Swift formatting because swift-format 6.3 or newer was not found.\n' +
      instructions,
  );
  return null;
}

function main() {
  const check = process.argv[2] === '--check';
  const swiftFormat = findSwiftFormat();
  if (swiftFormat == null) {
    return;
  }
  const files = globSync('**/*.swift', {cwd: REPO_ROOT, ignore: IGNORE}).filter(
    file => !isGenerated(file),
  );

  let exitStatus = 0;
  for (let i = 0; i < files.length; i += MAX_FILES_PER_PROCESS) {
    const result = spawnSync(
      swiftFormat.command,
      [
        ...swiftFormat.prefixArguments,
        check ? 'lint' : 'format',
        '--configuration',
        CONFIG,
        ...(check ? ['--strict'] : ['--in-place']),
        ...files.slice(i, i + MAX_FILES_PER_PROCESS),
      ],
      {
        cwd: REPO_ROOT,
        env: {...process.env, PWD: REPO_ROOT},
        stdio: 'inherit',
      },
    );
    if (result.error != null) {
      throw result.error;
    }
    if (result.signal != null) {
      throw new Error(`swift-format was terminated by ${result.signal}`);
    }
    if (result.status !== 0) {
      exitStatus = result.status ?? 1;
    }
  }
  process.exitCode = exitStatus;
}

main();
