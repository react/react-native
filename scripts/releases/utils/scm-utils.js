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

const isGitRepo = require('../../shared/isGitRepo');
const {echo, exec, exit} = require('shelljs');

function exitIfNotOnGit /*::<T>*/(
  command /*: () => T */,
  errorMessage /*: string */,
  gracefulExit /*: boolean */ = false,
  // $FlowFixMe[incompatible-type] Asserts return value
) /*: T */ {
  if (isGitRepo()) {
    return command();
  } else {
    echo(errorMessage);
    exit(gracefulExit ? 0 : 1);
  }
}

function isTaggedLatest(commitSha /*: string */) /*: boolean */ {
  return (
    exec(`git rev-list -1 latest | grep ${commitSha}`, {
      silent: true,
    }).stdout.trim() === commitSha
  );
}

function getBranchName() /*: string */ {
  return exec('git rev-parse --abbrev-ref HEAD', {
    silent: true,
  }).stdout.trim();
}

function getCurrentCommit() /*: string */ {
  return isGitRepo()
    ? exec('git rev-parse HEAD', {
        silent: true,
      }).stdout.trim()
    : 'TEMP';
}

module.exports = {
  exitIfNotOnGit,
  getCurrentCommit,
  getBranchName,
  isTaggedLatest,
};
