/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EnvironmentOverrides} from '../utils';

import {createBundle} from '../bundling';
import {isCI} from '../EnvironmentOptions';
import {build as buildHermesCompiler} from '../executables/hermesc';
import {build as buildFantomTester} from '../executables/tester';
import {NATIVE_BUILD_OUTPUT_PATH} from '../paths';
import {HermesVariant} from '../utils';
// $FlowExpectedError[untyped-import]
import fs from 'fs';
import os from 'os';
import path from 'path';

async function tryOrLog(
  fn: () => void | Promise<void>,
  message: string,
): Promise<void> {
  try {
    await fn();
  } catch (e) {
    // Sandcastle fails to parse the test output if we log stuff to stdout/stderr.
    if ((process.env.SANDCASTLE ?? '') !== '') {
      console.error(
        'Global warmup failed. Tests will continue to run but will likely fail. Details:\n',
        message,
        e,
      );
    }
  }
}

export default async function build(
  enableCoverage: boolean,
  env: EnvironmentOverrides,
): Promise<void> {
  try {
    fs.rmSync(NATIVE_BUILD_OUTPUT_PATH, {recursive: true});
  } catch {}

  fs.mkdirSync(NATIVE_BUILD_OUTPUT_PATH, {recursive: true});

  if (isCI) {
    // When `enableCoverage` is true (CI coverage runs), we still need the
    // non-coverage tester binaries because some tests opt out of coverage
    // (benchmarks via filename, or tests with the `@fantom_disable_coverage`
    // pragma — see `runner/coverageUtils.js`). Without these, those tests
    // would fail to spawn with ENOENT.
    const coverageVariants = enableCoverage ? [false, true] : [false];

    for (const enableOptimized of [false, true]) {
      for (const hermesVariant of HermesVariant.members()) {
        for (const variantEnableCoverage of coverageVariants) {
          buildFantomTester(
            {
              enableOptimized,
              hermesVariant,
              enableCoverage: variantEnableCoverage,
            },
            env,
          );
        }
        buildHermesCompiler({enableOptimized, hermesVariant, enableCoverage});
      }
    }

    await tryOrLog(() => warmUpMetro(false), 'Error warming up Metro (dev)');
    await tryOrLog(() => warmUpMetro(true), 'Error warming up Metro (opt)');
  }
}

async function warmUpMetro(isOptimizedMode: boolean): Promise<void> {
  const entrypointPath = path.resolve(
    __dirname,
    '..',
    '..',
    'runtime',
    'WarmUpEntryPoint.js',
  );

  const bundlePath = path.join(
    os.tmpdir(),
    `fantom-warmup-bundle-${Date.now()}.js`,
  );

  await createBundle({
    testPath: '(warmup bundle - no test path)',
    entry: entrypointPath,
    out: bundlePath,
    platform: 'android',
    minify: isOptimizedMode,
    dev: !isOptimizedMode,
    customTransformOptions: undefined,
  });

  try {
    fs.unlinkSync(bundlePath);
  } catch {}
}
