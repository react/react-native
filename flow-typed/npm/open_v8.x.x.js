/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

declare module 'open' {
  import type {ChildProcess} from 'child_process';

  declare export type AppName = 'chrome' | 'firefox' | 'edge';

  declare export type App = Readonly<{
    name: string | ReadonlyArray<string>,
    arguments?: ReadonlyArray<string>,
  }>;

  declare export type Options = Readonly<{
    wait?: boolean,
    background?: boolean,
    newInstance?: boolean,
    allowNonzeroExitCode?: boolean,
    app?: App | ReadonlyArray<App>,
    ...
  }>;

  declare export type OpenAppOptions = Readonly<{
    wait?: boolean,
    background?: boolean,
    newInstance?: boolean,
    allowNonzeroExitCode?: boolean,
    arguments?: ReadonlyArray<string>,
    ...
  }>;

  declare module.exports: ((
    target: string,
    options?: Options,
  ) => Promise<ChildProcess>) & {
    apps: Record<AppName, string | ReadonlyArray<string>>,
    openApp: (
      name: string | ReadonlyArray<string>,
      options?: OpenAppOptions,
    ) => Promise<ChildProcess>,
    ...
  };
}
