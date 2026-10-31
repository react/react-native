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
 * Set up Promise. Hermes provides a native Promise implementation that
 * satisfies all requirements of React Native.
 *
 * If you don't need these polyfills, don't use InitializeCore; just directly
 * require the modules you need from InitializeCore for setup.
 */

// Hermes is the only supported JS engine and always provides Promise natively.
const HermesPromise = global.Promise;

if (__DEV__) {
  if (typeof HermesPromise !== 'function') {
    console.error('HermesPromise does not exist');
  }
  global.HermesInternal?.enablePromiseRejectionTracker?.(
    require('../promiseRejectionTrackingOptions').default,
  );
}
