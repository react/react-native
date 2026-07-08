/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const path = require('path');

let frontEndPath /*:string */ = path.join(
  __dirname,
  'dist',
  'third-party',
  'front_end',
);

if (process.env.REACT_NATIVE_DEBUGGER_FRONTEND_PATH != null) {
  frontEndPath = process.env.REACT_NATIVE_DEBUGGER_FRONTEND_PATH;
  const ANSI_YELLOW = '\x1b[33m';
  const ANSI_GREY = '\x1b[90m';
  const ANSI_WHITE = '\x1b[37m';
  const ANSI_RESET = '\x1b[0m';
  console.warn(
    '\n' +
      ANSI_YELLOW +
      'Using custom debugger frontend path from ' +
      ANSI_WHITE +
      'process.env.REACT_NATIVE_DEBUGGER_FRONTEND_PATH' +
      ANSI_YELLOW +
      ': ' +
      ANSI_GREY +
      frontEndPath +
      ANSI_RESET +
      '\n',
  );
}

module.exports = frontEndPath;
