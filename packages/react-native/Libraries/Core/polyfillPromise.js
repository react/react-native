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
 * Set up Promise. All supported JS engines provide a spec-compliant native
 * Promise implementation, so it no longer needs to be polyfilled. In DEV,
 * enable unhandled rejection tracking where the engine supports it.
 */

if (__DEV__) {
  if (typeof global.Promise !== 'function') {
    console.error('Promise does not exist');
  }
  global.HermesInternal?.enablePromiseRejectionTracker?.(
    require('../promiseRejectionTrackingOptions').default,
  );
}
