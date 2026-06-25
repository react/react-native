/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * Validates that the PR targets an appropriate base branch.
 *
 * @param {string} baseRef - The base branch ref (e.g., 'main', '0.76-stable')
 * @returns {{message: string, status: 'PASS'|'FAIL', shouldAddPickLabel: boolean}}
 */
function checkBranchTarget(baseRef) {
  const isMain = baseRef === 'main';
  const isStable = baseRef.endsWith('-stable');

  let message = '';
  let status = 'PASS';
  if (!isMain && !isStable) {
    status = 'FAIL';
    message = `> [!CAUTION]
> **Invalid Base Branch**
>
> The base branch for this PR is \`${baseRef}\`, which is not \`main\` or a \`-stable\` branch.
> [Are you sure you want to target this branch?](https://reactnative.dev/docs/contributing#pull-requests)`;
  }

  return {
    message,
    status,
    shouldAddPickLabel: isStable,
  };
}

module.exports = checkBranchTarget;
