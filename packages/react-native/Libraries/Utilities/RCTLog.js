/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const invariant = require('invariant');

const levelsMap = {
  log: 'log',
  info: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'error',
};

let warningHandler: ?(...Array<unknown>) => void = null;

const RCTLog = {
  // level one of log, info, warn, error, mustfix
  logIfNoNativeHook(level: string, ...args: Array<unknown>): void {
    // We already printed in the native console, so only log here if using a js debugger
    if (typeof global.nativeLoggingHook === 'undefined') {
      RCTLog.logToConsole(level, ...args);
    } else {
      // Report native warnings to LogBox
      if (warningHandler && level === 'warn') {
        warningHandler(...args);
      }
    }
  },

  // Log to console regardless of nativeLoggingHook
  logToConsole(level: string, ...args: Array<unknown>): void {
    // $FlowFixMe[invalid-computed-prop]
    const logFn = levelsMap[level];
    invariant(
      logFn,
      'Level "' + level + '" not one of ' + Object.keys(levelsMap).toString(),
    );

    console[logFn](...args);
  },

  setWarningHandler(handler: typeof warningHandler): void {
    warningHandler = handler;
  },
};

export default RCTLog;
