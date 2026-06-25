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

/**
 * Small utility that can be used as an error handler. You cannot just pass
 * `console.error` as a failure callback - it's not properly bound.  If passes an
 * `Error` object, it will print the message and stack.
 */
const logError = function (...args: ReadonlyArray<unknown>) {
  if (args.length === 1 && args[0] instanceof Error) {
    const err = args[0];
    console.error('Error: "' + err.message + '".  Stack:\n' + err.stack);
  } else {
    console.error.apply(console, args);
  }
};

export default logError;
