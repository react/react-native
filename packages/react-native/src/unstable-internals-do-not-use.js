/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

'use strict';
'use client';

// ----------------------------------------------------------------------------
// react-native/unstable-internals-do-not-use
//
// UNSTABLE WITH NO SEMVER GUARANTEES.
// SHOULD NOT BE DEPENDED ON BY NEW CODE.
//
// This is a secondary entry point for frameworks and libraries that depend on
// specific React Native internals, serving as a compatibility bridge.
//
// Consuming codebases must opt in via tsconfig.json:
//   "customConditions": ["react-native-unstable-internals"]
//
// Having this entry point:
// - Maintains a known list of which React Native internals are in use.
// - Enables us to relocate supporting files more freely.
// - Gives us time to decide on the future of these APIs (independent from
//   removal of the Strict API opt out).
//
// The long term future of these exports is to formalize/delete them where
// appropriate, and collapse this entry point.
//
// Replaces RFC0985
// https://github.com/react-native-community/discussions-and-proposals/pull/985
// where we reviewed internal APIs used in the ecosystem.
//
// IMPORTANT: Keep this file in sync with unstable-internals-do-not-use.d.ts.
// ----------------------------------------------------------------------------

// eslint-disable-next-line @react-native/monorepo/no-commonjs-exports
module.exports = {
  get AppContainer() {
    return require('../Libraries/ReactNative/AppContainer').default;
  },
  get AssetSourceResolver() {
    return require('../Libraries/Image/AssetSourceResolver').default;
  },
  get customDirectEventTypes() {
    return require('../Libraries/Renderer/shims/ReactNativeViewConfigRegistry')
      .customDirectEventTypes;
  },
  get DevLoadingView() {
    return require('../Libraries/Utilities/DevLoadingView').default;
  },
  get getDevServer() {
    return require('../Libraries/Core/Devtools/getDevServer').default;
  },
  get HMRClient() {
    return require('../Libraries/Utilities/HMRClient').default;
  },
  get NativeExceptionsManager() {
    return require('../Libraries/Core/NativeExceptionsManager').default;
  },
  get NativeRedBox() {
    return require('../Libraries/NativeModules/specs/NativeRedBox').default;
  },
  get NativeSourceCode() {
    return require('../Libraries/NativeModules/specs/NativeSourceCode').default;
  },
  get PressabilityDebugView() {
    return require('../Libraries/Pressability/PressabilityDebug')
      .PressabilityDebugView;
  },
};
