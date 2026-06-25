/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

declare module '@expo/spawn-async' {
  type SpawnOptions = {
    cwd?: string,
    env?: Object,
    argv0?: string,
    stdio?: string | Array<any>,
    detached?: boolean,
    uid?: number,
    gid?: number,
    shell?: boolean | string,
    windowsVerbatimArguments?: boolean,
    windowsHide?: boolean,
    encoding?: string,
    ignoreStdio?: boolean,
  };

  declare class SpawnPromise<T> extends Promise<T> {
    child: child_process$ChildProcess;
  }
  type SpawnResult = {
    pid?: number,
    output: string[],
    stdout: string,
    stderr: string,
    status: number | null,
    signal: string | null,
  };

  declare function spawnAsync(
    command: string,
    args?: ReadonlyArray<string>,
    options?: SpawnOptions,
  ): SpawnPromise<SpawnResult>;

  declare module.exports: typeof spawnAsync;
}
