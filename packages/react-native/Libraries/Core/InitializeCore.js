/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use client';

/**
 * Sets up global variables typical in most JavaScript environments.
 *
 *   1. Global timers (via `setTimeout` etc).
 *   2. Global console object.
 *   3. Hooks for printing stack traces with source maps.
 *
 * Leaves enough room in the environment for implementing your own:
 *
 *   1. Require system.
 *   2. Bridged modules.
 *
 * @deprecated Since 0.87. Use `'react-native/setup-env'` instead.
 */

'use strict';

// NOTE: This delegates to the `'react-native/setup-env'` entry point (rather
// than calling `setUpDefaultReactNativeEnvironment` directly) so that
// `src/setup-env.js` is pulled into the module graph. Metro's
// `getModulesRunBeforeMainModule` only runs modules that are already part of
// the bundle, and `InitializeCore` is a guaranteed graph entry (via
// `ReactNativePrivateInitializeCore`). This keeps `'react-native/setup-env'`
// reachable so it runs before the main module.
require('../../src/setup-env');
