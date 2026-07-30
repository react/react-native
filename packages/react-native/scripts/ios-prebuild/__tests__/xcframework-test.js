/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {resolveHermesHeaders} = require('../xcframework');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

describe('resolveHermesHeaders', () => {
  let tmp /*: string */ = '';
  let buildFolder /*: string */ = '';

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xcframework-test-'));
    buildFolder = path.join(tmp, '.build');
  });

  afterEach(() => {
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  test('returns the base include directory when hermes/hermes.h exists', () => {
    const includeDir = path.join(
      buildFolder,
      'artifacts',
      'hermes',
      'destroot',
      'include',
    );
    fs.mkdirSync(path.join(includeDir, 'hermes'), {recursive: true});
    fs.writeFileSync(path.join(includeDir, 'hermes', 'hermes.h'), '');

    expect(resolveHermesHeaders(buildFolder, true)).toBe(includeDir);
  });

  test('finds a non-standard nested include directory', () => {
    const includeDir = path.join(
      buildFolder,
      'artifacts',
      'hermes',
      'nested',
      'archive',
      'destroot',
      'include',
    );
    fs.mkdirSync(path.join(includeDir, 'hermes'), {recursive: true});
    fs.writeFileSync(path.join(includeDir, 'hermes', 'hermes.h'), '');

    expect(resolveHermesHeaders(buildFolder, true)).toBe(includeDir);
  });

  test('returns null when Hermes headers are absent and not required', () => {
    expect(resolveHermesHeaders(buildFolder, false)).toBeNull();
  });

  test('throws when Hermes headers are absent and required', () => {
    expect(() => resolveHermesHeaders(buildFolder, true)).toThrow(
      /ReactNativeHeaders[\s\S]*<hermes\/\.\.\.>[\s\S]*destroot\/include/,
    );
  });
});
