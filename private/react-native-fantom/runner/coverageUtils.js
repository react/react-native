/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// $FlowExpectedError[untyped-import]
import {extract, parse} from 'jest-docblock';

type DocblockPragmas = {[key: string]: string | string[]};

const FANTOM_BENCHMARK_FILENAME_RE = /[Bb]enchmark-itest\./;

export function shouldCollectCoverage(
  testPath: string,
  testContents: string,
  globalConfig: {collectCoverage: boolean, ...},
): boolean {
  if (FANTOM_BENCHMARK_FILENAME_RE.test(testPath)) {
    return false;
  }

  const docblock = extract(testContents);
  const pragmas = parse(docblock) as DocblockPragmas;

  if (pragmas.fantom_disable_coverage != null) {
    return false;
  }

  return globalConfig.collectCoverage;
}
