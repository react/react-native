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

const {
  computeNightlyTarballURL,
  isMavenArtifactVersionPublished,
} = require('../utils');

describe('isMavenArtifactVersionPublished', () => {
  it('rejects the unpublished main version', () => {
    expect(isMavenArtifactVersionPublished('1000.0.0')).toBe(false);
  });

  it.each([
    '0.88.0',
    '0.89.0-nightly-20260909-abcdef123',
    '1000.0.0-abcdef123',
  ])('accepts published artifact version %s', version => {
    expect(isMavenArtifactVersionPublished(version)).toBe(true);
  });
});

describe('computeNightlyTarballURL', () => {
  it('does not query snapshot metadata for the unpublished main version', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn();

    try {
      await expect(
        computeNightlyTarballURL(
          '1000.0.0',
          'Debug',
          'react',
          'react-native-artifacts',
          'reactnative-dependencies-debug.tar.gz',
        ),
      ).rejects.toThrow(/artifacts are not published/);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
