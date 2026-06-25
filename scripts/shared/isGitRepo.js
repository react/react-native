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

const childProcess = require('child_process');

function isGitRepo() /*: boolean */ {
  try {
    const result = childProcess.execSync(
      'git rev-parse --is-inside-work-tree',
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    );
    return result.trim() === 'true';
  } catch (error) {
    console.error(`Failed to check git repository status: ${error}`);
  }
  return false;
}

module.exports = isGitRepo;
