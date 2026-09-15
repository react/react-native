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

const {findJava, warnMissingJava} = require('./format-utils');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const {globSync} = require('tinyglobby');

const REPO_ROOT = path.resolve(__dirname, '..');
const KTFMT_JAR = require.resolve('ktfmt/lib/ktfmt.jar');
const GENERATED_MARKER = Buffer.from('@' + 'generated');
const MINIMUM_JAVA_VERSION = 17;
const MAX_FILES_PER_PROCESS = 100;
const MAX_HEADER_BYTES = 4096;
const IGNORE = [
  '**/build/**',
  '**/com/facebook/yoga/**',
  '**/hermes-engine/**',
  '**/internal/featureflags/**',
  '**/node_modules/**',
  '**/systeminfo/ReactNativeVersion.kt',
];

function isGenerated(file) {
  const fd = fs.openSync(path.resolve(REPO_ROOT, file), 'r');
  try {
    const header = Buffer.alloc(MAX_HEADER_BYTES);
    const bytesRead = fs.readSync(fd, header, 0, header.length, 0);
    return header.subarray(0, bytesRead).includes(GENERATED_MARKER);
  } finally {
    fs.closeSync(fd);
  }
}

function main() {
  const check = process.argv[2] === '--check';
  const java = findJava(MINIMUM_JAVA_VERSION);
  if (java == null) {
    warnMissingJava('Kotlin');
    return;
  }
  const files = globSync('**/*.{kt,kts}', {
    cwd: REPO_ROOT,
    ignore: IGNORE,
  }).filter(file => !isGenerated(file));
  for (let i = 0; i < files.length; i += MAX_FILES_PER_PROCESS) {
    const result = spawnSync(
      java,
      [
        '-jar',
        KTFMT_JAR,
        '--do-not-remove-unused-imports',
        ...(check ? ['--dry-run', '--set-exit-if-changed'] : []),
        ...files.slice(i, i + MAX_FILES_PER_PROCESS),
      ],
      {cwd: REPO_ROOT, stdio: 'inherit'},
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
