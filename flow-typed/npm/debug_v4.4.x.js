/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

// stubbed from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/451dc8fc19383bc12af59522020e571957f1684e/types/debug/index.d.ts

declare module 'debug' {
  declare interface Formatters {
    [formatter: string]: (v: unknown) => string;
  }

  declare type Debugger = {|
    (format: unknown, ...args: Array<unknown>): void,
    color: string,
    diff: number,
    enabled: boolean,
    log: (format: unknown, ...args: Array<unknown>) => unknown,
    namespace: string,
    destroy: () => boolean,
    extend: (namespace: string, delimiter?: string) => Debugger,
  |};

  declare type Debug = {|
    (namespace: string): Debugger,
    coerce: (val: unknown) => unknown,
    disable: () => string,
    enable: (namespaces: string) => void,
    enabled: (namespaces: string) => boolean,
    formatArgs: (args: Array<unknown>) => void,
    log: (format: unknown, ...args: Array<unknown>) => unknown,
    selectColor: (namespace: string) => string | number,
    // this should be of type require('ms') but it doesn't play nicely with eslint
    // unless we add ms to dependencies, which we don't want to do
    humanize: $FlowFixMe,
    names: RegExp[],
    skips: RegExp[],
    formatters: Formatters,
    inspectOpts?: {
      hideDate?: boolean | number | null,
      colors?: boolean | number | null,
      depth?: boolean | number | null,
      showHidden?: boolean | number | null,
      ...
    },
  |};

  declare module.exports: Debug;
}
