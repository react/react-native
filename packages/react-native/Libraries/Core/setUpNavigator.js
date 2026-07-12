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

const {polyfillObjectProperty} = require('../Utilities/PolyfillFunctions');

const navigator = global.navigator;
if (navigator === undefined) {
  // $FlowExpectedError[cannot-write] The global isn't writable anywhere but here, where we define it.
  Object.defineProperty(global, 'navigator', {
    value: {product: 'ReactNative'},
    configurable: true,
    enumerable: true,
    writable: false,
  });
} else {
  // see https://github.com/facebook/react-native/issues/10881
  polyfillObjectProperty(navigator, 'product', () => 'ReactNative');
}
