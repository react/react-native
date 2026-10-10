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
// IMPORTANT: Keep this file in sync with unstable-internals-do-not-use.d.ts
// and unstable-internals-do-not-use.js.flow.
// ----------------------------------------------------------------------------

import typeof {colorAttribute} from '../Libraries/Components/View/ReactNativeStyleAttributes';
import typeof getDevServer from '../Libraries/Core/Devtools/getDevServer';
import typeof NativeExceptionsManager from '../Libraries/Core/NativeExceptionsManager';
import typeof AssetSourceResolver from '../Libraries/Image/AssetSourceResolver';
import typeof {ConditionallyIgnoredEventHandlers} from '../Libraries/NativeComponent/ViewConfigIgnore';
import typeof NativeRedBox from '../Libraries/NativeModules/specs/NativeRedBox';
import typeof NativeSourceCode from '../Libraries/NativeModules/specs/NativeSourceCode';
import typeof {PressabilityDebugView} from '../Libraries/Pressability/PressabilityDebug';
import typeof AppContainer from '../Libraries/ReactNative/AppContainer';
import typeof * as Renderer from '../Libraries/ReactNative/RendererProxy';
import typeof {dispatchCommand} from '../Libraries/ReactNative/RendererProxy';
import typeof {customDirectEventTypes} from '../Libraries/Renderer/shims/ReactNativeViewConfigRegistry';
import typeof processColorArray from '../Libraries/StyleSheet/processColorArray';
import typeof DevLoadingView from '../Libraries/Utilities/DevLoadingView';
import typeof insetsDiffer from '../Libraries/Utilities/differ/insetsDiffer';
import typeof pointsDiffer from '../Libraries/Utilities/differ/pointsDiffer';
import typeof HMRClient from '../Libraries/Utilities/HMRClient';

// flowlint unsafe-getters-setters:off
// eslint-disable-next-line @react-native/monorepo/no-commonjs-exports
module.exports = {
  get AppContainer(): AppContainer {
    return require('../Libraries/ReactNative/AppContainer').default;
  },
  get AssetSourceResolver(): AssetSourceResolver {
    return require('../Libraries/Image/AssetSourceResolver').default;
  },
  get ConditionallyIgnoredEventHandlers(): ConditionallyIgnoredEventHandlers<{
    readonly [name: string]: true,
  }> {
    return require('../Libraries/NativeComponent/ViewConfigIgnore')
      .ConditionallyIgnoredEventHandlers;
  },
  get customDirectEventTypes(): customDirectEventTypes {
    return require('../Libraries/Renderer/shims/ReactNativeViewConfigRegistry')
      .customDirectEventTypes;
  },
  get dispatchCommand(): dispatchCommand {
    return require('../Libraries/ReactNative/RendererProxy').dispatchCommand;
  },
  get DevLoadingView(): DevLoadingView {
    return require('../Libraries/Utilities/DevLoadingView').default;
  },
  get getDevServer(): getDevServer {
    return require('../Libraries/Core/Devtools/getDevServer').default;
  },
  get HMRClient(): HMRClient {
    if (__DEV__) {
      return require('../Libraries/Utilities/HMRClient').default;
    }
    return require('../Libraries/Utilities/HMRClientProdShim').default;
  },
  get NativeExceptionsManager(): NativeExceptionsManager {
    return require('../Libraries/Core/NativeExceptionsManager').default;
  },
  get NativeRedBox(): NativeRedBox {
    return require('../Libraries/NativeModules/specs/NativeRedBox').default;
  },
  get NativeSourceCode(): NativeSourceCode {
    return require('../Libraries/NativeModules/specs/NativeSourceCode').default;
  },
  get PressabilityDebugView(): PressabilityDebugView {
    return require('../Libraries/Pressability/PressabilityDebug')
      .PressabilityDebugView;
  },
  // Generated Codegen modules can be emitted outside this package, so they
  // cannot use package-relative imports to access these implementations.
  get colorAttribute(): colorAttribute {
    return require('../Libraries/Components/View/ReactNativeStyleAttributes')
      .colorAttribute;
  },
  get insetsDiffer(): insetsDiffer {
    return require('../Libraries/Utilities/differ/insetsDiffer').default;
  },
  get pointsDiffer(): pointsDiffer {
    return require('../Libraries/Utilities/differ/pointsDiffer').default;
  },
  get processColorArray(): processColorArray {
    return require('../Libraries/StyleSheet/processColorArray').default;
  },
  get Renderer(): Renderer {
    return require('../Libraries/ReactNative/RendererProxy');
  },
};
