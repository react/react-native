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

const {
  COMPOSE_TOOLING_FILES,
  composeToolingHash,
} = require('../headers-compose');
const fs = require('fs');
const path = require('path');

describe('COMPOSE_TOOLING_FILES stays in sync with headers-compose.js requires', () => {
  test('every local sibling require is covered by the hashed file list', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'headers-compose.js'),
      'utf8',
    );
    const requireRe = /require\('\.\/([\w-]+)'\)/g;
    const required = new Set<string>();
    for (const match of source.matchAll(requireRe)) {
      required.add(`${match[1]}.js`);
    }
    for (const name of required) {
      expect(COMPOSE_TOOLING_FILES).toContain(name);
    }
    const listWithoutSelf = COMPOSE_TOOLING_FILES.filter(
      name => name !== 'headers-compose.js',
    );
    for (const name of listWithoutSelf) {
      expect(required).toContain(name);
    }
  });
});

describe('composeToolingHash', () => {
  test('returns a 64-char hex sha256 digest', () => {
    const hash = composeToolingHash();
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
