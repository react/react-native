/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

jest.mock('../private/LaunchUtils', () => ({
  prepareDebuggerShellFromDotSlashFile: jest.fn(() =>
    Promise.reject(new Error('spawn failed')),
  ),
}));

const {unstable_prepareDebuggerShell} = require('../../');

describe('unstable_prepareDebuggerShell', () => {
  test('returns a human readable message for unexpected errors', async () => {
    const result = await unstable_prepareDebuggerShell({flavor: 'prebuilt'});

    expect(result.code).toBe('unexpected_error');
    expect(result.verboseInfo).toBe('spawn failed');
    expect(result.humanReadableMessage).toContain(
      'Using a fallback version instead',
    );
  });
});
