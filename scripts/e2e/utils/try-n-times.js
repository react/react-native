/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/**
 * Try executing a function n times recursively. Logs a warning message between
 * each retry.
 */
function tryExecNTimes(
  funcToRetry /*: () => number */,
  retriesLeft /*: number */,
  onEveryError /*: ?(() => unknown) */,
) /*: number */ {
  const exitCode = funcToRetry();
  if (exitCode === 0) {
    return exitCode;
  } else {
    if (onEveryError) {
      onEveryError();
    }
    retriesLeft--;
    console.warn(`Command failed, ${retriesLeft} retries left`);
    if (retriesLeft === 0) {
      return exitCode;
    } else {
      return tryExecNTimes(funcToRetry, retriesLeft, onEveryError);
    }
  }
}

module.exports = tryExecNTimes;
