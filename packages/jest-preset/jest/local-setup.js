/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// Global setup for tests local to the react-native repo. This setup is not
// included in the react-native Jest preset.

import './setup';

const consoleError = console.error;
const consoleWarn = console.warn;

// $FlowFixMe[cannot-write]
console.error = (...args) => {
  consoleError(...args);
  throw new Error('console.error() was called (see error above)');
};

// $FlowFixMe[cannot-write]
console.warn = (...args) => {
  consoleWarn(...args);
  throw new Error('console.warn() was called (see warning above)');
};
