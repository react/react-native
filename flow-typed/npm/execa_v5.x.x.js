/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// Modified from flow-typed repo:
// https://github.com/flow-typed/flow-typed/blob/master/definitions/npm/execa_v2.x.x/flow_v0.104.x-/execa_v2.x.x.js#L2

declare module 'execa' {
  declare type StdIoOption =
    | 'pipe'
    | 'ipc'
    | 'ignore'
    | 'inherit'
    | stream$Stream
    | number;

  declare type CommonOptions = {
    argv0?: string,
    cleanup?: boolean,
    cwd?: string,
    detached?: boolean,
    encoding?: string,
    env?: {[string]: string | void, ...},
    extendEnv?: boolean,
    gid?: number,
    killSignal?: string | number,
    localDir?: string,
    maxBuffer?: number,
    preferLocal?: boolean,
    reject?: boolean,
    shell?: boolean | string,
    stderr?: ?StdIoOption,
    stdin?: ?StdIoOption,
    stdio?: 'pipe' | 'ignore' | 'inherit' | ReadonlyArray<?StdIoOption>,
    stdout?: ?StdIoOption,
    stripEof?: boolean,
    timeout?: number,
    uid?: number,
    windowsVerbatimArguments?: boolean,
    buffer?: boolean,
    all?: boolean,
    stripFinalNewline?: boolean,
  };

  declare type SyncOptions = {
    ...CommonOptions,
    input?: string | Buffer,
  };

  declare type Options = {
    ...CommonOptions,
    input?: string | Buffer | stream$Readable,
  };

  declare type SyncResult = {
    stdout: string,
    stderr: string,
    exitCode: number,
    failed: boolean,
    signal: ?string,
    command: string,
    timedOut: boolean,
  };

  declare type Result = {
    ...SyncResult,
    killed: boolean,
  };

  declare interface ExecaPromise
    extends Promise<Result>,
      child_process$ChildProcess {}

  declare interface ExecaError extends ErrnoError {
    stdout: string;
    stderr: string;
    failed: boolean;
    signal: ?string;
    command: string;
    timedOut: boolean;
    exitCode: number;
  }

  declare interface Execa {
    (
      file: string,
      args?: ReadonlyArray<string>,
      options?: Readonly<Options>,
    ): ExecaPromise;
    (file: string, options?: Readonly<Options>): ExecaPromise;

    command(command: string, options?: Readonly<Options>): ExecaPromise;
    commandSync(command: string, options?: Readonly<Options>): ExecaPromise;

    node(
      path: string,
      args?: ReadonlyArray<string>,
      options?: Readonly<Options>,
    ): void;

    sync(
      file: string,
      args?: ReadonlyArray<string>,
      options?: Readonly<SyncOptions>,
    ): SyncResult;
    sync(file: string, options?: Readonly<SyncOptions>): SyncResult;
  }

  declare module.exports: Execa;
}
