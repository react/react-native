/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TestSnapshotResults} from '../../runtime/snapshotContext';

import {updateSnapshotsAndGetJestSnapshotResult} from '../snapshotUtils';
import {SnapshotState} from 'jest-snapshot';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function evaluate(state: SnapshotState, snapshotResults: TestSnapshotResults) {
  return updateSnapshotsAndGetJestSnapshotResult(state, [snapshotResults]);
}

describe('Fantom snapshot update modes', () => {
  let directory: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fantom-snapshot-ci-'));
  });

  afterEach(() => {
    fs.rmSync(directory, {recursive: true, force: true});
  });

  it('preserves existing baselines in CI and default update modes', () => {
    const file = path.join(directory, 'example.snap');
    const contents =
      '// Jest Snapshot v1, https://goo.gl/fbAQLP\n\nexports[`test 1`] = `committed baseline`;\n';
    for (const mode of ['none', 'new'] as const) {
      fs.writeFileSync(file, contents);
      const state = new SnapshotState(file, {
        updateSnapshot: mode,
        rootDir: directory,
        snapshotFormat: {},
      });
      const result = evaluate(state, {
        'test 1': {pass: false, value: 'received value'},
      });

      expect(fs.readFileSync(file, 'utf8')).toBe(contents);
      expect(result.unmatched).toBe(1);
      expect(result.updated).toBe(0);
    }
  });

  it('does not create missing baselines in CI mode', () => {
    const file = path.join(directory, 'missing.snap');
    const state = new SnapshotState(file, {
      updateSnapshot: 'none',
      rootDir: directory,
      snapshotFormat: {},
    });
    const result = evaluate(state, {
      'test 1': {pass: false, value: 'received value'},
    });

    expect(result.unmatched).toBe(1);
    expect(result.added).toBe(0);
    expect(fs.existsSync(file)).toBe(false);
  });

  it('allows explicit baseline updates outside CI', () => {
    const file = path.join(directory, 'example.snap');
    fs.writeFileSync(
      file,
      '// Jest Snapshot v1, https://goo.gl/fbAQLP\n\nexports[`test 1`] = `committed baseline`;\n',
    );
    const state = new SnapshotState(file, {
      updateSnapshot: 'all',
      rootDir: directory,
      snapshotFormat: {},
    });
    const result = evaluate(state, {
      'test 1': {pass: false, value: 'received value'},
    });

    expect(result.updated).toBe(1);
    expect(fs.readFileSync(file, 'utf8')).toContain('received value');
  });
});
