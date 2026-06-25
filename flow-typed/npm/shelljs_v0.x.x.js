/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @flow
 * @format
 */

'use strict';

// https://github.com/flow-typed/flow-typed/blob/master/definitions/npm/shelljs_v0.7.x/flow_v0.28.x-v0.32.x/shelljs_v0.7.x.js

declare type $npm$shelljs$Array<T> = Array<T> & $npm$shelljs$Result;
declare type $npm$shelljs$Async = Class<child_process$ChildProcess>;
declare type $npm$shelljs$Pattern = RegExp | String | string;
declare type $npm$shelljs$String = String & $npm$shelljs$Result;

declare interface $npm$shelljs$Config {
  fatal: boolean;
  globOpts: {
    nodir: boolean,
    ...
  };
  silent: boolean;
  verbose: boolean;
}
declare interface $npm$shelljs$Env {
  [key: string]: string;
}

declare type $npm$shelljs$OptionsPoly<Flags extends string> = {
  [keys: Flags]: boolean,
  ...
};
declare interface $npm$shelljs$ExecThen {
  (code: number, stdout: string, stderr: string): void;
}
declare type $npm$shelljs$ExecOptionsPoly<T extends Object> = {
  ...T,
  async?: boolean,
  silent?: boolean,
  ...
};
declare type $npm$shelljs$ExecOpts =
  $npm$shelljs$ExecOptionsPoly<child_process$execOpts>;
declare type $npm$shelljs$ExecOptsSync =
  $npm$shelljs$ExecOptionsPoly<child_process$execSyncOpts>;
declare type $npm$shelljs$GrepOpts = $npm$shelljs$OptionsPoly<'-l' | '-v'>;
declare type $npm$shelljs$SedOpts = $npm$shelljs$OptionsPoly<'-i'>;
declare type $npm$shelljs$SortOpts = $npm$shelljs$OptionsPoly<'-n' | '-r'>;
declare type $npm$shelljs$TestOpts =
  | '-b'
  | '-c'
  | '-d'
  | '-e'
  | '-f'
  | '-L'
  | '-p'
  | '-S';
declare type $npm$shelljs$TouchOpts = {
  [key: '-a' | '-c' | '-m']: boolean,
  '-d'?: string,
  '-r'?: string,
  ...
};

// dupe from flow lib until we can import
declare interface $npm$shelljs$FileStats {
  atime: Date;
  birthtime: Date; // FIXME: add to flow lib
  blksize: number;
  blocks: number;
  ctime: Date;
  dev: number;
  gid: number;
  ino: number;
  mode: number;
  mtime: Date;
  name: string; // NOTE: specific to shelljs
  nlink: number;
  rdev: number;
  size: number;
  uid: number;
  isBlockDevice(): boolean;
  isCharacterDevice(): boolean;
  isDirectory(): boolean;
  isFIFO(): boolean;
  isFile(): boolean;
  isSocket(): boolean;
  isSymbolicLink(): boolean;
}

declare interface $npm$shelljs$Result {
  code: number;
  stdout: string;
  stderr: string;
  to(file: string): $npm$shelljs$String;
  toEnd(file: string): $npm$shelljs$String;
  cat: (rest: void) => $npm$shelljs$String;
  exec: ((
    cmd: string,
    opts: $npm$shelljs$ExecOpts & {async: true, ...},
    then: $npm$shelljs$ExecThen,
    rest: void,
  ) => $npm$shelljs$Async) &
    ((
      cmd: string,
      opts: $npm$shelljs$ExecOpts & {async: true, ...},
      rest: void,
    ) => $npm$shelljs$Async) &
    ((
      cmd: string,
      opts: $npm$shelljs$ExecOptsSync,
      rest: void,
    ) => $npm$shelljs$String) &
    ((cmd: string, rest: void) => $npm$shelljs$String) &
    ((
      cmd: string,
      then: $npm$shelljs$ExecThen,
      rest: void,
    ) => $npm$shelljs$Async);
  grep: ((
    opts: $npm$shelljs$GrepOpts,
    rx: $npm$shelljs$Pattern,
    rest: void,
  ) => $npm$shelljs$String) &
    ((rx: $npm$shelljs$Pattern, rest: void) => $npm$shelljs$String);
  head: ((num: number, rest: void) => $npm$shelljs$String) &
    ((rest: void) => $npm$shelljs$String);
  sed: (
    rx: $npm$shelljs$Pattern,
    subst: string,
    rest: void,
  ) => $npm$shelljs$String;
  sort: ((opts: $npm$shelljs$SortOpts, rest: void) => $npm$shelljs$String) &
    ((rest: void) => $npm$shelljs$String);
  tail: ((num: number, rest: void) => $npm$shelljs$String) &
    ((rest: void) => $npm$shelljs$String);
}

declare module 'shelljs' {
  declare export type ShellArray<T> = $npm$shelljs$Array<T>;
  declare export type ShellAsync = $npm$shelljs$Async;
  declare export type ShellOptionsPoly<Flags extends string> =
    $npm$shelljs$OptionsPoly<Flags>;
  declare export type ShellConfig = $npm$shelljs$Config;
  declare export type ShellEnv = $npm$shelljs$Env;
  declare export type ShellFileStats = $npm$shelljs$FileStats;
  declare export type ShellPattern = $npm$shelljs$Pattern;
  declare export type ShellResult = $npm$shelljs$Result;
  declare export type ShellString = $npm$shelljs$String;

  declare export type ChmodOpts = ShellOptionsPoly<'-R' | '-c' | '-v'>;
  declare export type CpOpts = ShellOptionsPoly<
    '-P' | '-L' | '-R' | '-f' | '-n',
  >;
  declare export type DirsOpts = '-c';
  declare export // FIXME
  type DirsIdx =
    | '-0'
    | '-1'
    | '-2'
    | '-3'
    | '-4'
    | '-5'
    | '-6'
    | '-7'
    | '-8'
    | '-9'
    | '-10'
    | '-11'
    | '-12'
    | '-13'
    | '-14'
    | '-15'
    | '-16'
    | '-17'
    | '-18'
    | '-19'
    | '-20'
    | '-21'
    | '-22'
    | '-23'
    | '-24'
    | '-25'
    | '-26'
    | '-27'
    | '-28'
    | '-29'
    | '-30'
    | '-31'
    | '+0'
    | '+1'
    | '+2'
    | '+3'
    | '+4'
    | '+5'
    | '+6'
    | '+7'
    | '+8'
    | '+9'
    | '+10'
    | '+11'
    | '+12'
    | '+13'
    | '+14'
    | '+15'
    | '+16'
    | '+17'
    | '+18'
    | '+19'
    | '+20'
    | '+21'
    | '+22'
    | '+23'
    | '+24'
    | '+25'
    | '+26'
    | '+27'
    | '+28'
    | '+29'
    | '+30'
    | '+31';
  declare export type ExecOpts = $npm$shelljs$ExecOpts;
  declare export type ExecOptsSync = $npm$shelljs$ExecOptsSync;
  declare export type ExecThen = $npm$shelljs$ExecThen;
  declare export type GrepOpts = $npm$shelljs$GrepOpts;
  declare export type LnOpts = ShellOptionsPoly<'-f' | '-s'>;
  declare export type LsOpts = ShellOptionsPoly<'-A' | '-R' | '-d' | '-l'>;
  declare export type MkdirOpts = ShellOptionsPoly<'-p'>;
  declare export type MvOpts = ShellOptionsPoly<'-f' | '-n'>;
  declare export type PopdOpts = ShellOptionsPoly<'-n'>;
  declare export type PushdOpts = ShellOptionsPoly<'-n'>;
  declare export type RmOpts = ShellOptionsPoly<'-f' | '-r'>;
  declare export type SedOpts = $npm$shelljs$SedOpts;
  declare export type SortOpts = $npm$shelljs$SortOpts;
  declare export type TestOpts = $npm$shelljs$TestOpts;
  declare export type TouchOpts = $npm$shelljs$TouchOpts;

  declare module.exports: {
    ShellString: ((
      stdout: string,
      stderr?: string,
      code?: number,
    ) => ShellString) &
      (<T>(stdout: T[], stderr?: string, code?: number) => ShellArray<T>),
    config: ShellConfig,
    env: ShellEnv,
    cat: (glob: string, ...rest: string[]) => ShellString,
    cd: ((dir: string, rest: void) => ShellString) &
      ((rest: void) => ShellString),
    chmod: ((
      opts: ChmodOpts,
      mode: number | string,
      glob: string,
      ...rest: string[]
    ) => ShellString) &
      ((mode: number | string, glob: string, ...rest: string[]) => ShellString),
    cp: ((
      opts: CpOpts,
      src: string,
      next: string,
      ...rest: string[]
    ) => ShellString) &
      ((src: string, next: string, ...rest: string[]) => ShellString),
    dirs: ((idxOrOpts: DirsIdx | DirsOpts, rest: void) => string[]) &
      ((rest: void) => string[]),
    echo: (...rest: (number | string | String)[]) => ShellString, // FIXME: consider allowing more input types
    error: (rest: void) => ?string,
    exec: ((
      cmd: string,
      opts: ExecOpts & {async: true, ...},
      then: ExecThen,
      rest: void,
    ) => ShellAsync) &
      ((
        cmd: string,
        opts: ExecOpts & {async: true, ...},
        rest: void,
      ) => ShellAsync) &
      ((cmd: string, opts: ExecOptsSync, rest: void) => ShellString) &
      ((cmd: string, rest: void) => ShellString) &
      ((cmd: string, then: ExecThen, rest: void) => ShellAsync),
    exit: ((code: number, rest: void) => void) & ((rest: void) => void),
    find: (glob: string, ...rest: string[]) => ShellArray<string>,
    grep: ((
      opts: GrepOpts,
      rx: ShellPattern,
      glob: string,
      ...rest: string[]
    ) => ShellString) &
      ((rx: ShellPattern, glob: string, ...rest: string[]) => ShellString),
    head: ((num: number, glob: string, ...rest: string[]) => ShellString) &
      ((glob: string, ...rest: string[]) => ShellString),
    ln: ((opts: LnOpts, src: string, tgt: string, rest: void) => ShellString) &
      ((src: string, tgt: string, rest: void) => ShellString),
    ls: ((
      opts: LsOpts & {'-l': true, ...},
      glob: string,
      ...rest: string[]
    ) => ShellArray<ShellFileStats>) &
      ((opts: LsOpts, glob: string, ...rest: string[]) => ShellArray<string>) &
      ((glob: string, ...rest: string[]) => ShellArray<string>),
    mkdir: ((opts: MkdirOpts, dir: string, ...rest: string[]) => ShellString) &
      ((dir: string, ...rest: string[]) => ShellString),
    mv: ((
      opts: MvOpts,
      src: string,
      next: string,
      ...rest: string[]
    ) => ShellString) &
      ((src: string, next: string, ...rest: string[]) => ShellString),
    popd: ((opts: PopdOpts, idx: string, rest: void) => string[]) &
      ((opts: PopdOpts, rest: void) => string[]) &
      ((idx: string, rest: void) => string[]) &
      ((rest: void) => string[]),
    pushd: ((opts: PushdOpts, dirOrIdx: string, rest: void) => string[]) &
      ((dirOrIdx: string, rest: void) => string[]),
    pwd: (rest: void) => ShellString,
    rm: ((opts: RmOpts, glob: string, ...rest: string[]) => ShellString) &
      ((glob: string, ...rest: string[]) => ShellString),
    sed: ((
      opts: SedOpts,
      rx: ShellPattern,
      subst: string,
      glob: string,
      ...rest: string[]
    ) => ShellString) &
      ((
        rx: ShellPattern,
        subst: string,
        glob: string,
        ...rest: string[]
      ) => ShellString),
    set: ((exitOnError: '-e' | '+e', rest: void) => void) &
      ((verbose: '-v' | '+v', rest: void) => void) &
      ((disableGlobbing: '-f' | '+f', rest: void) => void),
    sort: ((opts: SortOpts, glob: string, ...rest: string[]) => ShellString) &
      ((glob: string, ...rest: string[]) => ShellString),
    tail: ((num: number, glob: string, ...rest: string[]) => ShellString) &
      ((glob: string, ...rest: string[]) => ShellString),
    tempdir: (rest: void) => string,
    test: (mode: TestOpts, path: string, rest: void) => boolean,
    touch: ((opts: TouchOpts, glob: string, ...rest: string[]) => ShellString) &
      ((glob: string, ...rest: string[]) => ShellString),
    which: (cmd: string, rest: void) => ShellString,
    ...
  };
}
