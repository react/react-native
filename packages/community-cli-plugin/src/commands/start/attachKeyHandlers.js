/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TerminalReporter} from 'metro';

import OpenDebuggerKeyboardHandler from './OpenDebuggerKeyboardHandler';
import invariant from 'invariant';
import readline from 'readline';
import {ReadStream} from 'tty';
import {styleText} from 'util';

const CTRL_C = '\u0003';
const CTRL_D = '\u0004';
const RELOAD_TIMEOUT = 500;

const throttle = (callback: () => void, timeout: number) => {
  let previousCallTimestamp = 0;
  return () => {
    const currentCallTimestamp = new Date().getTime();
    if (currentCallTimestamp - previousCallTimestamp > timeout) {
      previousCallTimestamp = currentCallTimestamp;
      callback();
    }
  };
};

type KeyEvent = {
  sequence: string,
  name: string,
  ctrl: boolean,
  meta: boolean,
  shift: boolean,
};

export default function attachKeyHandlers({
  devServerUrl,
  messageSocket,
  reporter,
}: {
  devServerUrl: string,
  messageSocket: Readonly<{
    broadcast: (type: string, params?: Record<string, unknown> | null) => void,
    ...
  }>,
  reporter: TerminalReporter,
}) {
  if (process.stdin.isTTY !== true) {
    reporter.update({
      type: 'unstable_server_log',
      level: 'info',
      data: 'Interactive mode is not supported in this environment',
    });
    return;
  }

  readline.emitKeypressEvents(process.stdin);
  setRawMode(true);

  const reload = throttle(() => {
    reporter.update({
      type: 'unstable_server_log',
      level: 'info',
      data: 'Reloading connected app(s)...',
    });
    messageSocket.broadcast('reload', null);
  }, RELOAD_TIMEOUT);

  const openDebuggerKeyboardHandler = new OpenDebuggerKeyboardHandler({
    reporter,
    devServerUrl,
  });

  process.stdin.on('keypress', (str: string, key: KeyEvent) => {
    if (openDebuggerKeyboardHandler.maybeHandleTargetSelection(key.name)) {
      return;
    }

    switch (key.sequence) {
      case 'r':
        reload();
        break;
      case 'd':
        reporter.update({
          type: 'unstable_server_log',
          level: 'info',
          data: 'Opening Dev Menu...',
        });
        messageSocket.broadcast('devMenu', null);
        break;
      case 'j':
        void openDebuggerKeyboardHandler.handleOpenDebugger();
        break;
      case CTRL_C:
      case CTRL_D:
        openDebuggerKeyboardHandler.dismiss();
        reporter.update({
          type: 'unstable_server_log',
          level: 'info',
          data: 'Stopping server',
        });
        setRawMode(false);
        process.stdin.pause();
        process.emit('SIGINT');
        process.exit();
    }
  });

  reporter.update({
    type: 'unstable_server_log',
    level: 'info',
    data: `Key commands available:

  ${styleText(['bold', 'inverse'], ' r ')} - reload app(s)
  ${styleText(['bold', 'inverse'], ' d ')} - open Dev Menu
  ${styleText(['bold', 'inverse'], ' j ')} - open DevTools
`,
  });
}

function setRawMode(enable: boolean) {
  invariant(
    process.stdin instanceof ReadStream,
    'process.stdin must be a readable stream to modify raw mode',
  );
  process.stdin.setRawMode(enable);
}
