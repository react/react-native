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
  /**
   * Logs to console only if the native logging hook is unavailable.
   * If available, delegates to native logging and reports warnings to LogBox.
   *
   * @param {string} level - Log level: 'log', 'info', 'warn', 'error', or 'fatal'
   * @param {...any} args - Arguments to log
   */
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

  /**
   * Logs to console regardless of native logging hook availability.
   * Throws an invariant if the log level is invalid.
   *
   * @param {string} level - Log level: 'log', 'info', 'warn', 'error', or 'fatal'
   * @param {...any} args - Arguments to log
   * @throws Invariant error if level is not a valid log level
   */
  logToConsole(level: string, ...args: Array<unknown>): void {
    // $FlowFixMe[invalid-computed-prop]
    const logFn = levelsMap[level];
    invariant(
      logFn,
      'Level "' + level + '" not one of ' + Object.keys(levelsMap).toString(),
    );

    console[logFn](...args);
  },

  /**
   * Sets a custom warning handler to process warnings reported to LogBox.
   *
   * @param {?Function} handler - Function to handle warnings, or null to remove the handler
   */
  setWarningHandler(handler: typeof warningHandler): void {
    warningHandler = handler;
  },
};

export default RCTLog;
