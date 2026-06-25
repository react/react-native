/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HermesVariant, SyncCommandResult} from '../utils';

import {isCI} from '../EnvironmentOptions';
import {NATIVE_BUILD_OUTPUT_PATH} from '../paths';
import {
  getBuckModesForPlatform,
  getBuckOptionsForHermes,
  getDebugInfoFromCommandResult,
  getHermesCompilerTarget,
  runBuck2Sync,
  runCommandSync,
} from '../utils';
import fs from 'fs';
import os from 'os';
import path from 'path';

type HermescOptions = Readonly<{
  enableCoverage: boolean,
  enableOptimized: boolean,
  hermesVariant: HermesVariant,
}>;

function getHermesCompilerPath({
  enableOptimized,
  hermesVariant,
}: HermescOptions): string {
  return path.join(
    NATIVE_BUILD_OUTPUT_PATH,
    `hermesc-${(hermesVariant as string).toLowerCase()}-${enableOptimized ? 'opt' : 'dev'}`,
  );
}
export function build(options: HermescOptions): void {
  const destPath = getHermesCompilerPath(options);
  if (fs.existsSync(destPath)) {
    return;
  }

  // Use system temp directory outside the repo to avoid macOS extended
  // attribute issues with EdenFS/NFS-backed directories
  const tmpPath = path.join(
    os.tmpdir(),
    `hermesc-${Date.now()}-${process.pid}`,
  );
  const destTmpPath = destPath + '-' + Date.now() + '-' + process.pid;

  try {
    const result = runBuck2Sync(
      [
        'build',
        ...getBuckModesForPlatform({
          enableOptimized: options.enableOptimized,
          enableCoverage: options.enableCoverage,
        }),
        ...getBuckOptionsForHermes(options.hermesVariant),
        getHermesCompilerTarget(options.hermesVariant),
        '--out',
        tmpPath,
      ],
      {},
    );

    if (result.status !== 0) {
      throw new Error(getDebugInfoFromCommandResult(result));
    }

    if (fs.existsSync(destPath)) {
      // Another test might have compiled the binary after our initial check.
      return;
    }

    // Remove extended attributes to avoid "Operation not permitted" errors
    // when copying to EdenFS/NFS-backed directories on macOS
    if (os.platform() === 'darwin') {
      runCommandSync('xattr', ['-rc', tmpPath], {});
    }

    fs.copyFileSync(tmpPath, destTmpPath);

    try {
      fs.renameSync(destTmpPath, destPath);
    } catch (e: unknown) {
      // Another process may have created the file already - that's fine
      const code =
        typeof e === 'object' && e != null && typeof e.code === 'string'
          ? e.code
          : null;
      if (code !== 'EEXIST' && !fs.existsSync(destPath)) {
        throw e;
      }
    }
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {}
    try {
      fs.unlinkSync(destTmpPath);
    } catch {}
  }
}

export function run(
  args: ReadonlyArray<string>,
  options: HermescOptions,
): SyncCommandResult {
  if (!isCI) {
    build(options);
  }

  return runCommandSync(getHermesCompilerPath(options), args, {});
}
