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

  declare export type Options = Readonly<{
    wait?: boolean,
    background?: boolean,
    newInstance?: boolean,
    allowNonzeroExitCode?: boolean,
    ...
  }>;

  declare type open = (
    target: string,
    options?: Options,
  ) => Promise<ChildProcess>;

  declare module.exports: open;
}
