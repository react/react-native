/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use client';
'use strict';

/**
 * Sets up global variables for React Native.
 * You can use this module directly, or just require InitializeCore.
 */
if (globalThis.window === undefined) {
  // $FlowExpectedError[cannot-write] The global isn't writable anywhere but here, where we define it.
  Object.defineProperty(globalThis, 'window', {
    value: globalThis,
    configurable: false,
    enumerable: true,
    writable: false,
  });
}

if (globalThis.self === undefined) {
  // $FlowExpectedError[cannot-write] The global isn't writable anywhere but here, where we define it.
  globalThis.self = globalThis;
}

// Set up process
// $FlowExpectedError[cannot-write] The global isn't writable anywhere but here, where we define it.
global.process = global.process || {};
// $FlowExpectedError[cannot-write] The global isn't writable anywhere but here, where we define it.
global.process.env = global.process.env || {};
if (!global.process.env.NODE_ENV) {
  // $FlowExpectedError[cannot-write] The global isn't writable anywhere but here, where we define it.
  global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';
}
