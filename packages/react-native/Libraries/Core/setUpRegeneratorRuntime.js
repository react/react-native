/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {hasNativeConstructor} = require('../Utilities/FeatureDetection');
const {polyfillGlobal} = require('../Utilities/PolyfillFunctions');

/**
 * Set up regenerator.
 * You can use this module directly, or just require InitializeCore.
 */

let hasNativeGenerator;
try {
  // If this function was lowered by regenerator-transform, it will try to
  // access `global.regeneratorRuntime` which doesn't exist yet and will throw.
  hasNativeGenerator = hasNativeConstructor(
    function* () {},
    'GeneratorFunction',
  );
} catch {
  // In this case, we know generators are not provided natively.
  hasNativeGenerator = false;
}

// If generators are provided natively, which suggests that there was no
// regenerator-transform, then there is no need to set up the runtime.
if (!hasNativeGenerator) {
  polyfillGlobal('regeneratorRuntime', () => {
    // The require just sets up the global, so make sure when we first
    // invoke it the global does not exist
    delete global.regeneratorRuntime;

    // regenerator-runtime/runtime exports the regeneratorRuntime object, so we
    // can return it safely.
    // $FlowFixMe[untyped-import]
    return require('regenerator-runtime/runtime');
  });
}
