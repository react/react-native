/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

function getCacheKey(packageContents) {
  jest.resetModules();
  jest.doMock('node:fs', () => ({
    readFileSync: filename =>
      filename.endsWith('package.json')
        ? Buffer.from(packageContents)
        : Buffer.from(filename),
  }));

  return require('../index').getCacheKey();
}

const {version: packageVersion} = require('../../package.json');

// Only `-main` versions hash package contents; published releases short-circuit
// to the version string, so each build asserts a different property.
if (packageVersion.endsWith('-main')) {
  test('cache key includes package metadata for main builds', () => {
    expect(getCacheKey('{"dependency":"1.0.0"}')).not.toBe(
      getCacheKey('{"dependency":"2.0.0"}'),
    );
  });
} else {
  test('cache key is the package version for published releases', () => {
    expect(getCacheKey('{"dependency":"1.0.0"}')).toBe(packageVersion);
    expect(getCacheKey('{"dependency":"2.0.0"}')).toBe(packageVersion);
  });
}
