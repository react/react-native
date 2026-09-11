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
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');

let metaUtils = null;
try {
  metaUtils = require('./format-utils.fb');
} catch (error) {
  if (
    error == null ||
    typeof error !== 'object' ||
    error.code !== 'MODULE_NOT_FOUND' ||
    !String(error.message).includes("'./format-utils.fb'")
  ) {
    throw error;
  }
}

const IS_META_CHECKOUT = metaUtils != null;

function commandVersion(command, prefixArguments = []) {
  const result = spawnSync(command, [...prefixArguments, '--version'], {
    encoding: 'utf8',
    env: {...process.env, PWD: REPO_ROOT},
  });
  return {
    output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`,
    status: result.status,
  };
}

function findMetaTool(...relativePath) {
  return metaUtils?.findMetaTool(...relativePath) ?? null;
}

function javaMajorVersion(command) {
  const result = spawnSync(command, ['-version'], {encoding: 'utf8'});
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  const version = /version "(?:1\.)?(\d+)/.exec(output);
  return result.status === 0 && version != null ? Number(version[1]) : null;
}

function findJava(minimumVersion) {
  if (process.env.JAVA != null && process.env.JAVA !== '') {
    return javaMajorVersion(process.env.JAVA) >= minimumVersion
      ? process.env.JAVA
      : null;
  }

  const candidates = [];
  candidates.push(...(metaUtils?.findJavaCandidates() ?? []));
  candidates.push('java');

  return (
    candidates.find(command => javaMajorVersion(command) >= minimumVersion) ??
    null
  );
}

function warnMissingJava(language) {
  const instructions =
    metaUtils?.missingJavaInstructions() ??
    'Please install a JDK of your choice with Java 17 or newer and make sure the `java` command is in your PATH, or set JAVA=/path/to/java.';
  console.warn(
    `warning: Skipping ${language} formatting because Java 17 or newer was not found.\n${instructions}`,
  );
}

module.exports = {
  commandVersion,
  findJava,
  findMetaTool,
  IS_META_CHECKOUT,
  warnMissingJava,
};
