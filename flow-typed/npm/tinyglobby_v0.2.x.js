declare module 'tinyglobby' {
  import typeof FSModule from 'fs';

  declare type FileSystemAdapter = Partial<FSModule>;

  declare type GlobOptions = {
    absolute?: boolean,
    braceExpansion?: boolean,
    caseSensitiveMatch?: boolean,
    cwd?: string | URL,
    debug?: boolean,
    deep?: number,
    dot?: boolean,
    expandDirectories?: boolean,
    extglob?: boolean,
    followSymbolicLinks?: boolean,
    fs?: FileSystemAdapter,
    globstar?: boolean,
    ignore?: string | ReadonlyArray<string>,
    onlyDirectories?: boolean,
    onlyFiles?: boolean,
    signal?: AbortSignal,
  };

  declare type GlobModule = {
    convertPathToPattern(path: string): string,
    escapePath(path: string): string,
    isDynamicPattern(
      pattern: string,
      options?: {caseSensitiveMatch: boolean},
    ): boolean,
    glob(
      patterns: string | ReadonlyArray<string>,
      options?: GlobOptions,
    ): Promise<string[]>,
    globSync(
      patterns: string | ReadonlyArray<string>,
      options?: GlobOptions,
    ): string[],
  };

  declare module.exports: GlobModule;
}
