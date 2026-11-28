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

import type {SkippedHeader} from '../skipped-headers';

const {
  NAMESPACE_PATTERN,
  compareLayouts,
  headersToCompare,
  sideVersion,
  skippedHeadersFor,
} = require('../check');
const {SKIPPED_HEADERS} = require('../skipped-headers');
const path = require('node:path');

const CLANG = process.env.CLANG ?? 'clang++';
const CLANG_TIMEOUT_MS = 60_000;
const TIERS_DIR = path.join(__dirname, '__fixtures__', 'tiers', 'react');
const PUBLIC = path.join(TIERS_DIR, 'Public.h');
const UNCLASSIFIED = path.join(TIERS_DIR, 'Unclassified.h');
const COMPILE_DIR = path.join(__dirname, '__fixtures__', 'layouts', 'compile');

describe('compareLayouts', () => {
  beforeAll(() => {
    // Fake timers are enabled globally; clang runs in real child processes.
    jest.useRealTimers();
  });

  // The same headers on both sides; react/Broken.h does not compile.
  const layout = {
    includeDirs: [COMPILE_DIR],
    frameworkDirs: [],
    headers: new Map(
      ['react/Good.h', 'react/Broken.h'].map(header => [
        header,
        path.join(COMPILE_DIR, header),
      ]),
    ),
  };
  const compare = (skipped: ReadonlySet<string>) =>
    compareLayouts(layout, layout, 'ios', {clang: CLANG}, skipped);

  test(
    'drops a skipped header from both sides',
    async () => {
      const result = await compare(new Set(['react/Broken.h']));

      expect(result.skippedHeaders).toEqual(['react/Broken.h']);
      expect(result.headerCounts).toEqual({base: 1, current: 1});
      expect(result.keyCounts).toEqual({base: 1, current: 1});
      expect(result.breaks).toEqual([]);
    },
    CLANG_TIMEOUT_MS,
  );

  test(
    'fails with the name of a header that does not compile and is not skipped',
    async () => {
      await expect(compare(new Set())).rejects.toThrow(/react\/Broken\.h/);
    },
    CLANG_TIMEOUT_MS,
  );
});

describe('skippedHeadersFor', () => {
  const entries: ReadonlyArray<SkippedHeader> = [
    {platform: 'ios', header: 'react/Always.h', reason: 'missing include'},
    {
      platform: 'ios',
      header: 'react/Scoped.h',
      reason: 'prefab layout',
      versions: ['0.87.1'],
    },
    {platform: 'android', header: 'react/Android.h', reason: 'missing include'},
  ];

  test.each([
    ['the base version matches', ['0.87.1', '0.88.1']],
    ['the current version matches', ['0.88.0', '0.87.1']],
  ])('applies a scoped entry when %s', (_, versions) => {
    expect(skippedHeadersFor(entries, 'ios', versions)).toEqual(
      new Set(['react/Always.h', 'react/Scoped.h']),
    );
  });

  test('leaves out a scoped entry when neither version matches', () => {
    expect(skippedHeadersFor(entries, 'ios', ['0.88.0', '0.88.1'])).toEqual(
      new Set(['react/Always.h']),
    );
  });

  test("ignores the other platform's entries", () => {
    expect(skippedHeadersFor(entries, 'android', ['0.87.1', '0.88.1'])).toEqual(
      new Set(['react/Android.h']),
    );
  });
});

describe('sideVersion', () => {
  test('is the version of a published side', () => {
    expect(sideVersion({kind: 'version', version: '0.88.0'})).toBe('0.88.0');
  });

  test("is the react-native package's version of a checkout", () => {
    expect(
      sideVersion({
        kind: 'checkout',
        root: path.join(__dirname, '__fixtures__', 'layouts', 'source'),
      }),
    ).toBe('0.88.1');
  });
});

describe('SKIPPED_HEADERS', () => {
  test('lists each header once per platform, with a reason', () => {
    const keys = SKIPPED_HEADERS.map(
      ({platform, header}) => `${platform} ${header}`,
    );

    expect(new Set(keys).size).toBe(keys.length);
    for (const {platform, header, reason, versions} of SKIPPED_HEADERS) {
      expect(['ios', 'android']).toContain(platform);
      expect(header).toMatch(/^[\w-]+\/[\w/+-]+\.h$/);
      expect(reason).not.toBe('');
      for (const version of versions ?? []) {
        expect(version).toMatch(/^\d+\.\d+\.\d+(?:-[\w.]+)?$/);
      }
    }
  });
});

describe('NAMESPACE_PATTERN', () => {
  test.each([
    ['facebook::react::Props', true],
    ['facebook::yoga::Style', true],
    ['facebook::jsi::Runtime', true],
    ['facebook::jni::JObject', false],
    ['folly::dynamic', false],
  ])('%s matches: %s', (name, matches) => {
    expect(NAMESPACE_PATTERN.test(name)).toBe(matches);
  });
});

describe('headersToCompare', () => {
  test('dumps each stable API header of either side that the side has', () => {
    const base = {
      includeDirs: ['/base'],
      frameworkDirs: [],
      headers: new Map([
        ['react/Kept.h', PUBLIC],
        ['react/Demoted.h', PUBLIC],
        ['react/Removed.h', PUBLIC],
        ['react/Internal.h', UNCLASSIFIED],
      ]),
    };
    const current = {
      includeDirs: ['/current'],
      frameworkDirs: [],
      headers: new Map([
        ['react/Kept.h', PUBLIC],
        ['react/Demoted.h', UNCLASSIFIED],
        ['react/Added.h', PUBLIC],
        ['react/Internal.h', UNCLASSIFIED],
      ]),
    };

    expect(headersToCompare(base, current, 'ios')).toEqual({
      base: ['react/Demoted.h', 'react/Kept.h', 'react/Removed.h'],
      current: ['react/Added.h', 'react/Demoted.h', 'react/Kept.h'],
    });
  });
});
