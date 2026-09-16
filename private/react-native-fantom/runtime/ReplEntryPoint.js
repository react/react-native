/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/**
 * Entrypoint for the Fantom REPL (`fantom-cli`).
 *
 * This is loaded once by the native tester binary in interactive mode to set up
 * the React Native environment and the REPL runtime helpers before any user
 * input is evaluated. Unlike test entrypoints, it does NOT register or run any
 * tests.
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';
import './repl-setup';
