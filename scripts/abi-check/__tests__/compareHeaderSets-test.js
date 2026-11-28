/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {DumpOptions} from '../dump';
import type {AbiBreak} from '../index';

const {compareHeaderSets} = require('../index');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const CLANG = process.env.CLANG ?? 'clang++';
const CLANG_TIMEOUT_MS = 60_000;

function headerSet(version: 'v1' | 'v2'): DumpOptions {
  const dir = path.join(__dirname, '__fixtures__', version);
  return {
    headers: fs
      .readdirSync(dir)
      .filter(file => file.endsWith('.h'))
      .sort()
      .map(file => path.join(dir, file)),
    includeDirs: [dir],
    clang: CLANG,
    namespacePattern: /facebook::react::/,
  };
}

function byKey(a: AbiBreak, b: AbiBreak): number {
  return a.key.localeCompare(b.key);
}

describe('compareHeaderSets', () => {
  beforeAll(() => {
    // Fake timers are enabled globally; clang runs in real child processes.
    jest.useRealTimers();

    const probe = spawnSync(CLANG, ['--version'], {encoding: 'utf8'});
    if (probe.error != null || probe.status !== 0) {
      throw new Error(
        `These tests run clang, but \`${CLANG} --version\` failed: ` +
          `${String(probe.error ?? probe.stderr)}. ` +
          'Install clang or set CLANG to the clang++ executable.',
      );
    }
  });

  test(
    'reports exactly the ABI breaks and additions between v1 and v2',
    async () => {
      const {breaks, additions} = await compareHeaderSets(
        headerSet('v1'),
        headerSet('v2'),
      );

      expect([...breaks].sort(byKey)).toEqual([
        {key: 'E facebook::react::EnumValue', change: 'changed'},
        {key: 'L facebook::react::AddedField', change: 'changed'},
        {key: 'L facebook::react::Removed', change: 'removed'},
        {key: 'L facebook::react::ReorderedFields', change: 'changed'},
        {key: 'V facebook::react::VirtualInserted', change: 'changed'},
      ]);
      expect(additions).toEqual(['L facebook::react::Added']);
    },
    CLANG_TIMEOUT_MS,
  );

  test(
    'reports nothing when a header set is compared with itself',
    async () => {
      expect(await compareHeaderSets(headerSet('v1'), headerSet('v1'))).toEqual(
        {breaks: [], additions: []},
      );
    },
    CLANG_TIMEOUT_MS,
  );
});
