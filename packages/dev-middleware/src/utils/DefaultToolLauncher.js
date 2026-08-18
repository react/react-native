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
const open = require('open');

const {apps, openApp} = open;

/**
 * Default `DevToolLauncher` implementation which handles opening apps on the
 * local machine.
 */
const DefaultToolLauncher = {
  launchDebuggerAppWindow: async (url: string): Promise<void> => {
    if (process.env.NODE_ENV === 'test') {
      assertMockedInTests();
    }

    // NOTE: Since 0.88 this is a simplified approach, since app launching is
    // now handled by `launchDebuggerShell`. Frameworks may still override
    // `DevToolLauncher` with an improved fallback stack.
    try {
      const subprocess = await openApp(apps.chrome, {
        arguments: [`--app=${url}`],
        newInstance: true,
      });
      await new Promise<void>((resolve, reject) => {
        subprocess.once('error', reject);
        subprocess.once('exit', code => {
          code === 0
            ? resolve()
            : reject(new Error(`openApp exited with code ${code}`));
        });
      });
    } catch (e: unknown) {
      // Fall back to default browser - the frontend will warn if the browser
      // is not supported.
      await open(url);
    }
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
