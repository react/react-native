/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

/**
 * Mock implementation of DefaultToolLauncher to prevent actual browser
 * and debugger-shell launches during tests.
 */
const DefaultToolLauncher = {
  launchDebuggerAppWindow: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  launchDebuggerShell: jest.fn().mockImplementation(() => Promise.resolve()),
  prepareDebuggerShell: jest.fn().mockResolvedValue({code: 'not_implemented'}),
};

export default DefaultToolLauncher;
