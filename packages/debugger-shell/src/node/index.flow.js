/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {prepareDebuggerShellFromDotSlashFile} from './private/LaunchUtils';

const {spawn} = require('cross-spawn');
const debug = require('debug')('Metro:DebuggerShell');
const path = require('path');

// The 'prebuilt' flavor will use the prebuilt shell binary (and the JavaScript embedded in it).
// The 'dev' flavor will use a stock Electron binary and run the shell code from the `electron/` directory.
type DebuggerShellFlavor = 'prebuilt' | 'dev';

const DEVTOOLS_BINARY_DOTSLASH_FILE = path.join(
  __dirname,
  '../../bin/react-native-devtools',
);

async function unstable_spawnDebuggerShellWithArgs(
  args: string[],
  {
    mode = 'detached',
    flavor = process.env.RNDT_DEV === '1' ? 'dev' : 'prebuilt',
    prebuiltBinaryPath,
    silent = process.env.NODE_ENV === 'test',
  }: Readonly<{
    // In 'syncAndExit' mode, the current process will block until the spawned process exits, and then it will exit
    // with the same exit code as the spawned process.
    // In 'detached' mode, the spawned process will be detached from the current process and the current process will
    // continue to run normally.
    mode?: 'syncThenExit' | 'detached',
    flavor?: DebuggerShellFlavor,
    prebuiltBinaryPath?: ?string,
    silent?: boolean,
  }> = {},
): Promise<void> {
  const [binaryPath, baseArgs] = getShellBinaryAndArgs(
    flavor,
    prebuiltBinaryPath,
  );

  return new Promise((resolve, reject) => {
    const {
      // If this package is used in an Electron app (e.g. inside a VS Code extension),
      // ELECTRON_RUN_AS_NODE=1 can leak from the parent process.
      // Since this is never the right way to launch the Fusebox shell, we guard against it here.
      ELECTRON_RUN_AS_NODE: _,
      ...env
    } = process.env;
    const child = spawn(binaryPath, [...baseArgs, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      detached: mode === 'detached',
      env,
    });
    if (mode === 'detached') {
      child.on('spawn', () => {
        debug('Debugger spawned in detached mode');
        resolve();
      });
      child.on('close', (code: number, signal: string) => {
        debug('Debugger closed with code %s and signal %s', code, signal);
        if (code !== 0) {
          if (!silent) {
            console.error(
              'Debugger exited with non-zero code (code: %s, signal: %s)',
              code,
              signal,
            );
          }
          reject(
            new Error(
              `Failed to open debugger shell: exited with code ${code}`,
            ),
          );
        }
      });
      child.on('error', error => {
        debug('Debugger shell encountered error: %s', error);
        reject(error);
      });
      if (!silent) {
        child.stdout.on('data', data =>
          console.log('[debugger-shell stdout] ' + String(data)),
        );
        child.stderr.on('data', data =>
          console.warn('[debugger-shell stderr] ' + String(data)),
        );
      }
      child.unref();
    } else if (mode === 'syncThenExit') {
      child.on('close', function (code, signal) {
        debug('Debugger exited with code %s and signal %s', code, signal);
        if (code == null && !silent) {
          console.error(
            'Debugger exited with code %s and signal %s',
            code,
            signal,
          );
          process.exit(1);
        }
        process.exit(code);
      });

      const handleTerminationSignal = function (signal: string) {
        process.on(signal, function signalHandler() {
          debug('Received signal %s. Killing debugger shell.', signal);
          if (!child.killed) {
            child.kill(signal);
          }
        });
      };

      handleTerminationSignal('SIGINT');
      handleTerminationSignal('SIGTERM');
    }
  });
}

export type DebuggerShellPreparationResult = Readonly<{
  code:
    | 'success'
    | 'not_implemented'
    | 'likely_offline'
    | 'platform_not_supported'
    | 'possible_corruption'
    | 'unexpected_error',
  humanReadableMessage?: string,
  verboseInfo?: string,
}>;

/**
 * Attempts to prepare the debugger shell for use and returns a coded result
 * that can be used to advise the user on how to proceed in case of failure.
 * In particular, this function will attempt to download and extract an
 * appropriate binary for the "prebuilt" flavor.
 *
 * This function should be called early during dev server startup, in parallel
 * with other initialization steps, so that the debugger shell is ready to use
 * instantly when the user tries to open it (and conversely, the user is
 * informed ASAP if it is not ready to use).
 */
async function unstable_prepareDebuggerShell({
  prebuiltBinaryPath,
  flavor = process.env.RNDT_DEV === '1' ? 'dev' : 'prebuilt',
}: {
  prebuiltBinaryPath?: ?string,
  flavor?: DebuggerShellFlavor,
} = {}): Promise<DebuggerShellPreparationResult> {
  try {
    switch (flavor) {
      case 'prebuilt':
        const prebuiltResult = await prepareDebuggerShellFromDotSlashFile(
          prebuiltBinaryPath ?? DEVTOOLS_BINARY_DOTSLASH_FILE,
        );
        if (prebuiltResult.code !== 'success') {
          return prebuiltResult;
        }
        break;
      case 'dev':
        break;
      default:
        flavor as empty;
        throw new Error(`Unknown flavor: ${flavor}`);
    }

    return {code: 'success'};
  } catch (e) {
    return {
      code: 'unexpected_error',
      verboseInfo: e.message,
    };
  }
}

function getShellBinaryAndArgs(
  flavor: DebuggerShellFlavor,
  prebuiltBinaryPath: ?string,
): [string, Array<string>] {
  switch (flavor) {
    case 'prebuilt':
      return [
        require('fb-dotslash'),
        [prebuiltBinaryPath ?? DEVTOOLS_BINARY_DOTSLASH_FILE],
      ];
    case 'dev':
      return [
        // NOTE: Internally at Meta, this is aliased to a workspace that is
        // API-compatible with the 'electron' package, but contains prebuilt binaries
        // that do not need to be downloaded in a postinstall action.
        require('electron'),
        [require.resolve('../electron')],
      ];
    default:
      flavor as empty;
      throw new Error(`Unknown flavor: ${flavor}`);
  }
}

export {unstable_spawnDebuggerShellWithArgs, unstable_prepareDebuggerShell};
