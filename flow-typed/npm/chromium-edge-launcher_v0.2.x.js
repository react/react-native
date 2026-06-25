/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

declare module 'chromium-edge-launcher' {
  import typeof fs from 'fs';
  import typeof childProcess from 'child_process';
  import type {ChildProcess} from 'child_process';

  declare export type Options = {
    startingUrl?: string,
    edgeFlags?: Array<string>,
    prefs?: unknown,
    port?: number,
    handleSIGINT?: boolean,
    edgePath?: string,
    userDataDir?: string | boolean,
    logLevel?: 'verbose' | 'info' | 'error' | 'warn' | 'silent',
    ignoreDefaultFlags?: boolean,
    connectionPollInterval?: number,
    maxConnectionRetries?: number,
    envVars?: {[key: string]: ?string},
  };

  declare export type LaunchedEdge = {
    pid: number,
    port: number,
    process: ChildProcess,
    kill: () => void,
  };

  declare export type ModuleOverrides = {
    fs?: fs,
    spawn?: childProcess['spawn'],
  };

  declare class Launcher {
    getFirstInstallation(): string;
    launch(options: Options): Promise<LaunchedEdge>;
  }

  declare module.exports: {
    default: Launcher,
    Launcher: Launcher,
  };
}
