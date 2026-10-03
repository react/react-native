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

/**
 * Path suffixes identifying stack frames from React Native internals. Used
 * to collapse internal callsites in the symbolicator and to detect
 * third-party modules in the serializer.
 *
 * Plain JavaScript with no dependencies: this module is also required
 * directly (bypassing `src/index.js`) from runtimes without the monorepo
 * toolchain, like the Buck worker zip, where `scripts/shared/babelRegister`
 * cannot be resolved and Flow syntax cannot be parsed.
 */
const INTERNAL_CALLSITES_PATTERNS = [
  '/react-native/Libraries/BatchedBridge/MessageQueue\\.js$',
  '/react-native/Libraries/Core/.+\\.js$',
  '/react-native/Libraries/LogBox/.+\\.js$',
  '/react-native/Libraries/Network/.+\\.js$',
  '/react-native/Libraries/Pressability/.+\\.js$',
  '/react-native/Libraries/Renderer/implementations/.+\\.js$',
  '/react-native/Libraries/Utilities/.+\\.js$',
  '/react-native/Libraries/vendor/.+\\.js$',
  '/react-native/Libraries/WebSocket/.+\\.js$',
  '/react-native/src/private/renderer/errorhandling/.+\\.js$',
  '/metro-runtime/.+\\.js$',
  '/node_modules/@babel/runtime/.+\\.js$',
  '/node_modules/@react-native/js-polyfills/.+\\.js$',
  '/node_modules/invariant/.+\\.js$',
  '/node_modules/react-devtools-core/.+\\.js$',
  '/node_modules/react-native/index.js$',
  '/node_modules/react-refresh/.+\\.js$',
  '/node_modules/scheduler/.+\\.js$',
  '^\\[native code\\]$',
];

module.exports = {INTERNAL_CALLSITES_PATTERNS};
