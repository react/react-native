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
'use client';

// ----------------------------------------------------------------------------
// react-native/setup-env
//
// Side-effectful module that sets up the core React Native JavaScript
// environment. This includes global timers (`setTimeout` etc), the global
// `console` object, and hooks for printing stack traces with source maps.
// ----------------------------------------------------------------------------

require('./private/setup/setUpDefaultReactNativeEnvironment').default();
