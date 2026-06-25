/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {DebuggerShellPreparationResult} from '../types/DevToolLauncher';

const {
  unstable_prepareDebuggerShell,
  unstable_spawnDebuggerShellWithArgs,
} = require('@react-native/debugger-shell');
const {spawn} = require('child_process');
const ChromeLauncher = require('chrome-launcher');
const {Launcher: EdgeLauncher} = require('chromium-edge-launcher');
const open = require('open');

/**
 * Default `DevToolLauncher` implementation which handles opening apps on the
 * local machine.
 */
const DefaultToolLauncher = {
  launchDebuggerAppWindow: async (url: string): Promise<void> => {
    if (process.env.NODE_ENV === 'test') {
      assertMockedInTests();
    }

    let chromePath;

    try {
      // Locate Chrome installation path, will throw if not found
      chromePath = ChromeLauncher.getChromePath();
    } catch (e) {
      // Fall back to Microsoft Edge
      chromePath = EdgeLauncher.getFirstInstallation();
    }

    if (chromePath == null) {
      // Fall back to default browser - the frontend will warn if the browser
      // is not supported.
      await open(url);
      return;
    }

    const chromeFlags = [`--app=${url}`, '--window-size=1200,600'];

    return new Promise((resolve, reject) => {
      const childProcess = spawn(chromePath, chromeFlags, {
        detached: true,
        stdio: 'ignore',
      });

      childProcess.on('data', () => {
        resolve();
      });
      childProcess.on('close', (code: number) => {
        if (code !== 0) {
          reject(
            new Error(
              `Failed to launch debugger app window: ${chromePath} exited with code ${code}`,
            ),
          );
        }
      });
    });
  },

  async launchDebuggerShell(url: string, windowKey: string): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      assertMockedInTests();
    }

    return await unstable_spawnDebuggerShellWithArgs([
      '--frontendUrl=' + url,
      '--windowKey=' + windowKey,
    ]);
  },

  async prepareDebuggerShell(
    prebuiltBinaryPath?: ?string,
  ): Promise<DebuggerShellPreparationResult> {
    if (process.env.NODE_ENV === 'test') {
      assertMockedInTests();
    }

    return await unstable_prepareDebuggerShell();
  },
};

function assertMockedInTests(): void {
  if (process.env.NODE_ENV === 'test') {
    throw new Error(
      'DefaultToolLauncher must be mocked or overridden in tests. ' +
        "Add jest.mock('../utils/DefaultAppLauncher') to test setup.",
    );
  }
}

export default DefaultToolLauncher;
