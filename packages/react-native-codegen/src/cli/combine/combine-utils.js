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

const path = require('node:path');

/**
 * This function is used by the CLI to decide whether a JS/TS file has to be
 * processed or not by the Codegen.
 *
 * Parameters:
 *   - originalFilePath: the path to the file
 *   - currentPlatform: the platform for which we are creating the specs
 * Returns: `true` if the file can be used to generate code; `false` otherwise
 */
function filterJSFile(
  originalFilePath: string,
  currentPlatform: ?string,
  excludeRegExp: ?RegExp,
): boolean {
  // Remove `.fb` if it exists (see `react-native.cconf`).
  const filePath = originalFilePath.replace(/\.fb(\.|$)/, '$1');
  const basename = path.basename(filePath);

  const isSpecFile = /^(Native.+|.+NativeComponent)/.test(basename);
  const isNotNativeUIManager = !filePath.endsWith('NativeUIManager.js');
  const isNotTest = !filePath.includes('__tests');
  const isNotExcluded = excludeRegExp == null || !excludeRegExp.test(filePath);
  const isNotTSTypeDefinition = !filePath.endsWith('.d.ts');

  const isValidCandidate =
    isSpecFile &&
    isNotNativeUIManager &&
    isNotExcluded &&
    isNotTest &&
    isNotTSTypeDefinition;

  const filenameComponents = basename.split('.');
  const isPlatformAgnostic = filenameComponents.length === 2;

  if (currentPlatform == null) {
    // need to accept only files that are platform agnostic
    return isValidCandidate && isPlatformAgnostic;
  }

  // If a platform is passed, accept both platform agnostic specs...
  if (isPlatformAgnostic) {
    return isValidCandidate;
  }

  // ...and specs that share the same platform as the one passed.
  // specfiles must follow the pattern: <filename>[.<platform>].(js|ts|tsx)
  const filePlatform =
    filenameComponents.length > 2 ? filenameComponents[1] : 'unknown';
  return isValidCandidate && currentPlatform === filePlatform;
}

module.exports = {
  filterJSFile,
};
