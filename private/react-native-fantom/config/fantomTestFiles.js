/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const path = require('node:path');

const FANTOM_TEST_FILE_EXTENSION = '\\.(js|tsx?)';

// Meta-internal tests add `.fb` before the extension.
const FANTOM_TEST_REGEX = `/__tests__/.*-itest(\\.fb)?${FANTOM_TEST_FILE_EXTENSION}$`;

const FANTOM_TEST_PATTERN = new RegExp(FANTOM_TEST_REGEX);

// The titles of Meta-internal `-itest.fb.js` tests keep the whole file name.
const FANTOM_TEST_NAME_SUFFIX = new RegExp(
  `-itest${FANTOM_TEST_FILE_EXTENSION}$`,
);

function isFantomTestFile(filename /*: string */) /*: boolean */ {
  // Jest matches `testRegex` against a Windows path by rewriting its `/`.
  const normalizedFilename = filename.replaceAll('\\', '/');
  return (
    FANTOM_TEST_PATTERN.test(normalizedFilename) &&
    // The runner names each test's generated entrypoint in `.out` after it.
    !normalizedFilename.includes('/.out/')
  );
}

function getFantomTestName(testPath /*: string */) /*: string */ {
  return path.basename(testPath).replace(FANTOM_TEST_NAME_SUFFIX, '');
}

module.exports = {FANTOM_TEST_REGEX, getFantomTestName, isFantomTestFile};
