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
const GENERATED_MARKER = Buffer.from('@' + 'generated');
const MINIMUM_JAVA_VERSION = 17;
const MAX_FILES_PER_PROCESS = 30;
const MAX_HEADER_BYTES = 4096;
const IGNORE = [
  '**/Pods/**',
  '**/build/**',
  '**/com/facebook/yoga/**',
  '**/node_modules/**',
];

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

function findGoogleJavaFormatJar() {
  const packageRoot = path.dirname(
    require.resolve('google-java-format/package.json'),
  );
  const jars = fs
    .readdirSync(path.join(packageRoot, 'lib'))
    .filter(file => file.endsWith('-all-deps.jar'));
  if (jars.length !== 1) {
    throw new Error(
      `Expected one google-java-format jar, found ${jars.length}.`,
    );
  }
  return path.join(packageRoot, 'lib', jars[0]);
}

function main() {
  const check = process.argv[2] === '--check';
  const java = findJava(MINIMUM_JAVA_VERSION);
  if (java == null) {
    warnMissingJava('Java');
    return;
  }
  const googleJavaFormatJar = findGoogleJavaFormatJar();
  const files = globSync('**/*.java', {cwd: REPO_ROOT, ignore: IGNORE}).filter(
    file => !isGenerated(file),
  );

  let exitStatus = 0;
  for (let i = 0; i < files.length; i += MAX_FILES_PER_PROCESS) {
    const result = spawnSync(
      java,
      [
        '--add-exports=jdk.compiler/com.sun.tools.javac.api=ALL-UNNAMED',
        '--add-exports=jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED',
        '--add-exports=jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED',
        '--add-exports=jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED',
        '--add-exports=jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED',
        '--add-exports=jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED',
        '-jar',
        googleJavaFormatJar,
        ...(check ? ['--dry-run', '--set-exit-if-changed'] : ['--replace']),
        ...files.slice(i, i + MAX_FILES_PER_PROCESS),
      ],
      {cwd: REPO_ROOT, stdio: 'inherit'},
    );
    if (result.error != null) {
      throw result.error;
    }
    if (result.signal != null) {
      throw new Error(`google-java-format was terminated by ${result.signal}`);
    }
    if (result.status !== 0) {
      exitStatus = result.status ?? 1;
    }
  }
  process.exitCode = exitStatus;
}

main();
