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

// ----------------------------------------------------------------------------
// react-native/react-private-interface
//
// This is a private entry point allowing React to require React Native
// internals (previously, Libaries/ReactNativePrivateInterface.js).
//
// These APIs should ONLY be used by first party React internals and are not
// part of our public API.
//
// IMPORTANT: Keep this file in sync with react-private-interface.js.flow.
// ----------------------------------------------------------------------------

import typeof BatchedBridge from '../Libraries/BatchedBridge/BatchedBridge';
import typeof legacySendAccessibilityEvent from '../Libraries/Components/AccessibilityInfo/legacySendAccessibilityEvent';
import typeof TextInputState from '../Libraries/Components/TextInput/TextInputState';
import typeof ExceptionsManager from '../Libraries/Core/ExceptionsManager';
import typeof RawEventEmitter from '../Libraries/Core/RawEventEmitter';
import typeof ReactFiberErrorDialog from '../Libraries/Core/ReactFiberErrorDialog';
import typeof RCTEventEmitter from '../Libraries/EventEmitter/RCTEventEmitter';
import typeof {
  createPublicInstance,
  createPublicRootInstance,
  createPublicTextInstance,
  getInternalInstanceHandleFromPublicInstance,
  getNativeTagFromPublicInstance,
  getNodeFromPublicInstance,
} from '../Libraries/ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance';
import typeof {
  create as createAttributePayload,
  diff as diffAttributePayloads,
} from '../Libraries/ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload';
import typeof UIManager from '../Libraries/ReactNative/UIManager';
import typeof * as ReactNativeViewConfigRegistry from '../Libraries/Renderer/shims/ReactNativeViewConfigRegistry';
import typeof flattenStyle from '../Libraries/StyleSheet/flattenStyle';
import type {DangerouslyImpreciseStyleProp} from '../Libraries/StyleSheet/StyleSheet';
import typeof deepFreezeAndThrowOnMutationInDev from '../Libraries/Utilities/deepFreezeAndThrowOnMutationInDev';
import typeof deepDiffer from '../Libraries/Utilities/differ/deepDiffer';
import typeof Platform from '../Libraries/Utilities/Platform';
import typeof dispatchNativeEvent from './private/renderer/events/dispatchNativeEvent';
import typeof CustomEvent from './private/webapis/dom/events/CustomEvent';

export type {PublicRootInstance} from '../Libraries/ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance';
export type PublicTextInstance = ReturnType<createPublicTextInstance>;

// flowlint unsafe-getters-setters:off
// eslint-disable-next-line @react-native/monorepo/no-commonjs-exports
module.exports = {
  get BatchedBridge(): BatchedBridge {
    return require('../Libraries/BatchedBridge/BatchedBridge').default;
  },
  get ExceptionsManager(): ExceptionsManager {
    return require('../Libraries/Core/ExceptionsManager').default;
  },
  get Platform(): Platform {
    return require('../Libraries/Utilities/Platform').default;
  },
  get RCTEventEmitter(): RCTEventEmitter {
    return require('../Libraries/EventEmitter/RCTEventEmitter').default;
  },
  get ReactNativeViewConfigRegistry(): ReactNativeViewConfigRegistry {
    return require('../Libraries/Renderer/shims/ReactNativeViewConfigRegistry');
  },
  get TextInputState(): TextInputState {
    return require('../Libraries/Components/TextInput/TextInputState').default;
  },
  get UIManager(): UIManager {
    return require('../Libraries/ReactNative/UIManager').default;
  },
  // TODO: Remove when React has migrated to `createAttributePayload` and `diffAttributePayloads`
  get deepDiffer(): deepDiffer {
    return require('../Libraries/Utilities/differ/deepDiffer').default;
  },
  get deepFreezeAndThrowOnMutationInDev(): deepFreezeAndThrowOnMutationInDev<
    {...} | Array<unknown>,
  > {
    return require('../Libraries/Utilities/deepFreezeAndThrowOnMutationInDev')
      .default;
  },
  // TODO: Remove when React has migrated to `createAttributePayload` and `diffAttributePayloads`
  get flattenStyle(): flattenStyle<DangerouslyImpreciseStyleProp> {
    // $FlowFixMe[underconstrained-implicit-instantiation]
    // $FlowFixMe[incompatible-type]
    return require('../Libraries/StyleSheet/flattenStyle').default;
  },
  get ReactFiberErrorDialog(): ReactFiberErrorDialog {
    return require('../Libraries/Core/ReactFiberErrorDialog').default;
  },
  get legacySendAccessibilityEvent(): legacySendAccessibilityEvent {
    return require('../Libraries/Components/AccessibilityInfo/legacySendAccessibilityEvent')
      .default;
  },
  get RawEventEmitter(): RawEventEmitter {
    return require('../Libraries/Core/RawEventEmitter').default;
  },
  get CustomEvent(): CustomEvent {
    return require('./private/webapis/dom/events/CustomEvent').default;
  },
  get createAttributePayload(): createAttributePayload {
    return require('../Libraries/ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload')
      .create;
  },
  get diffAttributePayloads(): diffAttributePayloads {
    return require('../Libraries/ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload')
      .diff;
  },
  get createPublicRootInstance(): createPublicRootInstance {
    return require('../Libraries/ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance')
      .createPublicRootInstance;
  },
  get createPublicInstance(): createPublicInstance {
    return require('../Libraries/ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance')
      .createPublicInstance;
  },
  get createPublicTextInstance(): createPublicTextInstance {
    return require('../Libraries/ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance')
      .createPublicTextInstance;
  },
  get getNativeTagFromPublicInstance(): getNativeTagFromPublicInstance {
    return require('../Libraries/ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance')
      .getNativeTagFromPublicInstance;
  },
  get getNodeFromPublicInstance(): getNodeFromPublicInstance {
    return require('../Libraries/ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance')
      .getNodeFromPublicInstance;
  },
  get getInternalInstanceHandleFromPublicInstance(): getInternalInstanceHandleFromPublicInstance {
    return require('../Libraries/ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance')
      .getInternalInstanceHandleFromPublicInstance;
  },
  get dispatchNativeEvent(): dispatchNativeEvent {
    return require('./private/renderer/events/dispatchNativeEvent').default;
  },
};
