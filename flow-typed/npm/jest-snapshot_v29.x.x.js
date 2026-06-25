/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

declare module 'jest-snapshot' {
  type SnapshotFormat = {...};

  type UpdateSnapshot = 'all' | 'new' | 'none';

  type ProjectConfig = {
    rootDir: string,
    prettierPath: string,
    snapshotFormat: SnapshotFormat,
    ...
  };

  type SnapshotResolver = {
    /** Resolves from `testPath` to snapshot path. */
    resolveSnapshotPath(testPath: string, snapshotExtension?: string): string,
    /** Resolves from `snapshotPath` to test path. */
    resolveTestPath(snapshotPath: string, snapshotExtension?: string): string,
    /** Example test path, used for preflight consistency check of the implementation above. */
    testPathForConsistencyCheck: string,
  };

  declare export var EXTENSION: 'snap';

  declare export function isSnapshotPath(path: string): boolean;

  type LocalRequire = (module: string) => unknown;

  declare export function buildSnapshotResolver(
    config: ProjectConfig,
    localRequire?: Promise<LocalRequire> | LocalRequire,
  ): Promise<SnapshotResolver>;

  type SnapshotStateOptions = {
    updateSnapshot: UpdateSnapshot,
    prettierPath?: string | null,
    expand?: boolean,
    snapshotFormat: SnapshotFormat,
    rootDir: string,
  };

  type SnapshotData = Record<string, string>;

  type SaveStatus = {
    deleted: boolean,
    saved: boolean,
  };

  declare export class SnapshotState {
    _dirty: boolean;
    _updateSnapshot: UpdateSnapshot;
    _snapshotData: SnapshotData;
    _initialData: SnapshotData;
    _uncheckedKeys: Set<string>;

    added: number;
    expand: boolean;
    matched: number;
    unmatched: number;
    updated: number;
    constructor(testPath: string, options: SnapshotStateOptions): void;
    save(): SaveStatus;
    getUncheckedCount(): number;
    getUncheckedKeys(): Array<string>;
    removeUncheckedKeys(): void;
  }
}
