/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {execSync, spawn} from 'child_process';
import debug from 'debug';
import {existsSync} from 'fs';
import path from 'path';

const logWatchman = debug('helloworld:cli:watchman');

export async function pauseWatchman(command: () => Promise<unknown | void>) {
  let p: ReturnType<typeof spawn> | null = null;
  try {
    const raw: string = execSync('watchman watch-project .', {
      cwd: process.cwd(),
      stdio: 'pipe',
    }).toString();
    const {watch} = JSON.parse(raw);

    p = spawn('watchman', [
      '--no-pretty',
      '--persistent',
      'state-enter',
      watch,
      'yarn-install',
    ]);
    logWatchman(`[PID:${p.pid}] started`);
  } catch (e) {
    logWatchman(
      `Unable to pause watchman: ${e.message}, running command anyway`,
    );
  } finally {
    try {
      // Always run our user, if watchman has problems or doesn't exist proceed.
      await command();
    } finally {
      if (p?.killed || p?.exitCode != null) {
        return;
      }
      logWatchman(`[PID:${p?.pid ?? '????'}] killing with SIGTERM`);
      p?.kill('SIGTERM');
    }
  }
}

export function getExistingPath(
  folder: string,
  paths: ReadonlyArray<string>,
): string | null {
  for (const p of paths) {
    if (existsSync(path.join(folder, p))) {
      return p;
    }
  }
  return null;
}
