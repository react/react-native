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

const {normalizeDump} = require('../normalize');
const fs = require('node:fs');
const path = require('node:path');

const DUMP_HEADERS_ROOT = '/Users/ci/react-native-0.87.1/Headers';
const rawDump = fs.readFileSync(
  path.join(__dirname, '__fixtures__', 'clang-layout-dump.txt'),
  'utf8',
);
const reactOnly = {namespacePattern: /facebook::react::/};

describe('normalizeDump', () => {
  test('keys record layouts with L and vtables with V by qualified type name', () => {
    const keys = [...normalizeDump(rawDump, reactOnly).keys()];

    expect(keys).toEqual(
      expect.arrayContaining([
        'L facebook::react::Point',
        'L facebook::react::Shape',
        'V facebook::react::Shape',
      ]),
    );
    for (const key of keys) {
      expect(key).toMatch(/^[LV] facebook::react::/);
    }
  });

  test('keeps only types that match the namespace pattern', () => {
    const keys = [
      ...normalizeDump(rawDump, {namespacePattern: /other::/}).keys(),
    ];

    expect(keys.sort()).toEqual([
      'L other::Outside',
      'L other::Poly',
      'V other::Poly',
    ]);
  });

  test('keeps the fields and size of a record layout', () => {
    const shape = normalizeDump(rawDump, reactOnly).get(
      'L facebook::react::Shape',
    );

    expect(shape).toContain('(Shape vtable pointer)');
    expect(shape).toContain('int id');
    expect(shape).toContain('sizeof=16');
  });

  test('keeps the entries of a vtable', () => {
    const vtable = normalizeDump(rawDump, reactOnly).get(
      'V facebook::react::Shape',
    );

    expect(vtable).toContain('facebook::react::Shape::~Shape() [deleting]');
    expect(vtable).toContain('double facebook::react::Shape::area() const');
  });

  test('strips absolute header paths from keys and values', () => {
    const normalized = normalizeDump(rawDump, reactOnly);
    const movedDump = rawDump.replaceAll(
      DUMP_HEADERS_ROOT,
      '/home/runner/work/react-native-0.88.0/Headers',
    );

    for (const [key, value] of normalized) {
      expect(key).not.toContain(DUMP_HEADERS_ROOT);
      expect(value).not.toContain(DUMP_HEADERS_ROOT);
    }
    expect(normalizeDump(movedDump, reactOnly)).toEqual(normalized);
  });

  test('strips hex addresses, which differ between clang runs', () => {
    const normalized = normalizeDump(rawDump, reactOnly);
    const otherRunDump = rawDump.replace(/0x[0-9a-f]+/g, '0xdeadbeef00');

    for (const value of normalized.values()) {
      expect(value).not.toMatch(/0x[0-9a-f]{6,}/);
    }
    expect(normalizeDump(otherRunDump, reactOnly)).toEqual(normalized);
  });

  test('ignores source positions and IRgen blocks', () => {
    const normalized = normalizeDump(rawDump, reactOnly);
    const editedHeaderDump = rawDump
      .replace(
        /\.h:(\d+):(\d+)/g,
        (_, line, column) => `.h:${Number(line) + 10}:${Number(column) + 2}`,
      )
      .replace(/col:(\d+)/g, (_, column) => `col:${Number(column) + 2}`);

    expect(editedHeaderDump).not.toEqual(rawDump);
    expect(normalizeDump(editedHeaderDump, reactOnly)).toEqual(normalized);
    for (const value of normalized.values()) {
      expect(value).not.toMatch(
        /IRgen|CXXRecordDecl|CGRecordLayout|LLVMType|\.h:\d+:\d+|col:\d+/,
      );
    }
  });

  test('names unnamed nested records (unnamed) inside their parent only', () => {
    const normalized = normalizeDump(rawDump, reactOnly);

    expect(normalized.get('L facebook::react::Point')).toContain(
      'union facebook::react::Point::(unnamed) u',
    );
    for (const key of normalized.keys()) {
      expect(key).not.toContain('unnamed');
    }
  });
});
