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

import ansiRegex from 'ansi-regex';

const {
  getTempDirPatternForTests: getCurlTempDirPattern,
} = require('../utils/curl-utils');
const invariant = require('invariant');

/**
 * Returns a Jest snapshot serializer that replaces the given token or pattern
 * with the given replacement.
 */
function sanitizeSnapshots(
  tokenOrPattern: string | RegExp | (() => string | RegExp),
  replacement: string,
): JestPrettyFormatPlugin {
  const test = (val: unknown) => {
    if (typeof val !== 'string') {
      return false;
    }
    let tokenOrPatternToTest = tokenOrPattern;
    if (typeof tokenOrPatternToTest === 'function') {
      tokenOrPatternToTest = tokenOrPatternToTest();
    }
    if (typeof tokenOrPatternToTest === 'string') {
      return val.includes(tokenOrPatternToTest);
    }
    return tokenOrPatternToTest.test(val);
  };
  const serialize = (
    val: unknown,
    config: unknown,
    indentation: unknown,
    depth: unknown,
    refs: unknown,
    // $FlowFixMe[unclear-type] TODO: add up-to-date and accurate types for Jest snapshot serializers.
    printer: any,
  ) => {
    invariant(typeof val === 'string', 'Received non-string value.');
    let tokenOrPatternToTest = tokenOrPattern;
    if (typeof tokenOrPatternToTest === 'function') {
      tokenOrPatternToTest = tokenOrPatternToTest();
    }
    const replacedVal = val.replaceAll(tokenOrPatternToTest, replacement);
    if (test(replacedVal)) {
      // Recursion breaker.
      throw new Error(
        `Failed to sanitize snapshot: ${replacedVal} still contains ${tokenOrPatternToTest.toString()}`,
      );
    }
    return printer(replacedVal, config, indentation, depth, refs, printer);
  };
  return {
    serialize,
    test,
    // $FlowFixMe[unclear-type] expect.addSnapshotSerializer is typed inaccurately
  } as any as JestPrettyFormatPlugin;
}

/**
 * A Jest snapshot serializer that removes ANSI color codes from strings.
 */
const removeAnsiColors = sanitizeSnapshots(
  ansiRegex(),
  '',
) as JestPrettyFormatPlugin;

/**
 * A Jest snapshot serializer that redacts the exact temporary directory path
 * used by curl-utils.
 */
const removeCurlPaths = sanitizeSnapshots(
  getCurlTempDirPattern(),
  '<CURL_TEMP_DIR>',
) as JestPrettyFormatPlugin;

module.exports = {
  sanitizeSnapshots,
  removeAnsiColors,
  removeCurlPaths,
};
