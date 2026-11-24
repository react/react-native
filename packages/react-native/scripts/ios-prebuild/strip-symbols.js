/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Strips local symbols from a framework's binary and, when the framework was
 * signed, re-signs it ad hoc so its seal stays valid. Must run after the
 * framework's dSYM is copied and after its contents are final.
 */
function stripLocalSymbols(
  frameworkPath /*: string */,
  binaryName /*: string */,
  log /*: (message: string) => void */,
) {
  const binaryPath = fs.realpathSync(path.join(frameworkPath, binaryName));
  const wasSigned = isSigned(frameworkPath);
  log(`Stripping local symbols: ${binaryPath}`);
  execFileSync('xcrun', ['strip', '-x', binaryPath], {stdio: 'inherit'});
  if (wasSigned) {
    log(`Re-signing ad hoc: ${frameworkPath}`);
    execFileSync('codesign', ['--force', '--sign', '-', frameworkPath], {
      stdio: 'inherit',
    });
  }
}

function isSigned(frameworkPath /*: string */) /*: boolean */ {
  try {
    execFileSync('codesign', ['-d', frameworkPath], {stdio: 'ignore'});
    return true;
  } catch {
    return false;
  }
}

module.exports = {stripLocalSymbols};
