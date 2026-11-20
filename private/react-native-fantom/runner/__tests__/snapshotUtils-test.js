/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {updateSnapshotsAndGetJestSnapshotResult} from '../snapshotUtils';
import {SnapshotState} from 'jest-snapshot';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let directory: string;
beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fantom-snapshot-test-'));
});
afterEach(() => fs.rmSync(directory, {recursive: true, force: true}));

it('does not overwrite an existing snapshot on mismatch without -u', () => {
  const filePath = path.join(directory, 'example.snap');
  fs.writeFileSync(filePath, 'exports[`test 1`] = `old hash`;\n');
  for (const mode of ['new', 'none'] as const) {
    const state = new SnapshotState(filePath, {
      updateSnapshot: mode,
      rootDir: directory,
      snapshotFormat: {},
    });
    const result = updateSnapshotsAndGetJestSnapshotResult(state, [
      {
        status: 'failed',
        snapshotResults: {'test 1': {pass: false, value: 'new hash'}},
      },
    ]);
    expect(result.unmatched).toBe(1);
    expect(result.updated).toBe(0);
    expect(fs.readFileSync(filePath, 'utf8')).toContain('old hash');
    expect(fs.readFileSync(filePath, 'utf8')).not.toContain('new hash');
  }
});

it('updates a hash once with -u and counts passing snapshots once', () => {
  const filePath = path.join(directory, 'example.snap');
  fs.writeFileSync(filePath, 'exports[`test 1`] = `old hash`;\n');
  const state = new SnapshotState(filePath, {
    updateSnapshot: 'all',
    rootDir: directory,
    snapshotFormat: {},
  });
  const result = updateSnapshotsAndGetJestSnapshotResult(state, [
    {
      status: 'passed',
      snapshotResults: {'test 1': {pass: false, value: 'new hash'}},
    },
  ]);
  expect(result.updated).toBe(1);
  expect(fs.readFileSync(filePath, 'utf8')).toContain('new hash');
  const matching = new SnapshotState(filePath, {
    updateSnapshot: 'none',
    rootDir: directory,
    snapshotFormat: {},
  });
  const matched = updateSnapshotsAndGetJestSnapshotResult(matching, [
    {
      status: 'passed',
      snapshotResults: {'test 1': {pass: true}},
    },
  ]);
  expect(matched.matched).toBe(1);
  expect(matched.unchecked).toBe(0);
});

it('counts a new snapshot once', () => {
  const state = new SnapshotState(path.join(directory, 'example.snap'), {
    updateSnapshot: 'new',
    rootDir: directory,
    snapshotFormat: {},
  });
  const result = updateSnapshotsAndGetJestSnapshotResult(state, [
    {
      status: 'passed',
      snapshotResults: {'test 1': {pass: false, value: 'new hash'}},
    },
  ]);
  expect(result.added).toBe(1);
  expect(result.matched).toBe(0);
  expect(result.updated).toBe(0);
  expect(result.unmatched).toBe(0);
});

it('preserves unchecked snapshots when no tests ran with -u', () => {
  const filePath = path.join(directory, 'example.snap');
  const contents =
    '// Jest Snapshot v1, https://goo.gl/fbAQLP\n\nexports[`test 1`] = `old hash`;\n';
  fs.writeFileSync(filePath, contents);
  const state = new SnapshotState(filePath, {
    updateSnapshot: 'all',
    rootDir: directory,
    snapshotFormat: {},
  });
  const result = updateSnapshotsAndGetJestSnapshotResult(state, []);
  expect(fs.readFileSync(filePath, 'utf8')).toBe(contents);
  expect(result.unchecked).toBe(0);
  expect(result.uncheckedKeys).toEqual([]);
});

it('preserves unchecked snapshots after skipped or failed tests with -u', () => {
  const filePath = path.join(directory, 'example.snap');
  const contents =
    '// Jest Snapshot v1, https://goo.gl/fbAQLP\n\nexports[`other test 1`] = `other hash`;\n\nexports[`removed test 1`] = `removed hash`;\n\nexports[`test 1`] = `old hash`;\n';
  for (const status of ['pending', 'failed'] as const) {
    fs.writeFileSync(filePath, contents);
    const state = new SnapshotState(filePath, {
      updateSnapshot: 'all',
      rootDir: directory,
      snapshotFormat: {},
    });
    const result = updateSnapshotsAndGetJestSnapshotResult(state, [
      {
        status: 'passed',
        snapshotResults: {'test 1': {pass: true}},
      },
      {status, snapshotResults: {}},
    ]);
    expect(fs.readFileSync(filePath, 'utf8')).toBe(contents);
    expect(result.unchecked).toBe(0);
    expect(result.uncheckedKeys).toEqual([]);
  }
});

it('removes unchecked snapshots after a full successful update', () => {
  const filePath = path.join(directory, 'example.snap');
  fs.writeFileSync(
    filePath,
    'exports[`test 1`] = `old hash`;\nexports[`removed test 1`] = `removed hash`;\n',
  );
  const state = new SnapshotState(filePath, {
    updateSnapshot: 'all',
    rootDir: directory,
    snapshotFormat: {},
  });
  updateSnapshotsAndGetJestSnapshotResult(state, [
    {
      status: 'passed',
      snapshotResults: {'test 1': {pass: true}},
    },
  ]);
  expect(fs.readFileSync(filePath, 'utf8')).toContain('old hash');
  expect(fs.readFileSync(filePath, 'utf8')).not.toContain('removed hash');
});
