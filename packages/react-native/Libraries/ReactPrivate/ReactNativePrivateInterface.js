/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import typeof dispatchNativeEvent from '../../src/private/renderer/events/dispatchNativeEvent';
import typeof CustomEvent from '../../src/private/webapis/dom/events/CustomEvent';
import typeof BatchedBridge from '../BatchedBridge/BatchedBridge';
import typeof legacySendAccessibilityEvent from '../Components/AccessibilityInfo/legacySendAccessibilityEvent';
import typeof TextInputState from '../Components/TextInput/TextInputState';
import typeof ExceptionsManager from '../Core/ExceptionsManager';
import typeof RawEventEmitter from '../Core/RawEventEmitter';
import typeof ReactFiberErrorDialog from '../Core/ReactFiberErrorDialog';
import typeof RCTEventEmitter from '../EventEmitter/RCTEventEmitter';
import typeof {
  createPublicInstance,
  createPublicRootInstance,
  createPublicTextInstance,
  getInternalInstanceHandleFromPublicInstance,
  getNativeTagFromPublicInstance,
  getNodeFromPublicInstance,
} from '../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance';
import typeof {
  create as createAttributePayload,
  diff as diffAttributePayloads,
} from '../ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload';
import typeof UIManager from '../ReactNative/UIManager';
import typeof * as ReactNativeViewConfigRegistry from '../Renderer/shims/ReactNativeViewConfigRegistry';
import typeof flattenStyle from '../StyleSheet/flattenStyle';
import type {DangerouslyImpreciseStyleProp} from '../StyleSheet/StyleSheet';
import typeof deepFreezeAndThrowOnMutationInDev from '../Utilities/deepFreezeAndThrowOnMutationInDev';
import typeof deepDiffer from '../Utilities/differ/deepDiffer';
import typeof Platform from '../Utilities/Platform';

export type {PublicRootInstance} from '../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance';
export type PublicTextInstance = ReturnType<createPublicTextInstance>;

// flowlint unsafe-getters-setters:off
// eslint-disable-next-line @react-native/monorepo/no-commonjs-exports
module.exports = {
  get BatchedBridge(): BatchedBridge {
    return require('../BatchedBridge/BatchedBridge').default;
  },
  get ExceptionsManager(): ExceptionsManager {
    return require('../Core/ExceptionsManager').default;
  },
  get Platform(): Platform {
    return require('../Utilities/Platform').default;
  },
  get RCTEventEmitter(): RCTEventEmitter {
    return require('../EventEmitter/RCTEventEmitter').default;
  },
  get ReactNativeViewConfigRegistry(): ReactNativeViewConfigRegistry {
    return require('../Renderer/shims/ReactNativeViewConfigRegistry');
  },
  get TextInputState(): TextInputState {
    return require('../Components/TextInput/TextInputState').default;
  },
  get UIManager(): UIManager {
    return require('../ReactNative/UIManager').default;
  },
  // TODO: Remove when React has migrated to `createAttributePayload` and `diffAttributePayloads`
  get deepDiffer(): deepDiffer {
    return require('../Utilities/differ/deepDiffer').default;
  },
  get deepFreezeAndThrowOnMutationInDev(): deepFreezeAndThrowOnMutationInDev<
    {...} | Array<unknown>,
  > {
    return require('../Utilities/deepFreezeAndThrowOnMutationInDev').default;
  },
  // TODO: Remove when React has migrated to `createAttributePayload` and `diffAttributePayloads`
  get flattenStyle(): flattenStyle<DangerouslyImpreciseStyleProp> {
    // $FlowFixMe[underconstrained-implicit-instantiation]
    // $FlowFixMe[incompatible-type]
    return require('../StyleSheet/flattenStyle').default;
  },
  get ReactFiberErrorDialog(): ReactFiberErrorDialog {
    return require('../Core/ReactFiberErrorDialog').default;
  },
  get legacySendAccessibilityEvent(): legacySendAccessibilityEvent {
    return require('../Components/AccessibilityInfo/legacySendAccessibilityEvent')
      .default;
  },
  get RawEventEmitter(): RawEventEmitter {
    return require('../Core/RawEventEmitter').default;
  },
  get CustomEvent(): CustomEvent {
    return require('../../src/private/webapis/dom/events/CustomEvent').default;
  },
  get createAttributePayload(): createAttributePayload {
    return require('../ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload')
      .create;
  },
  get diffAttributePayloads(): diffAttributePayloads {
    return require('../ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload')
      .diff;
  },
  get createPublicRootInstance(): createPublicRootInstance {
    return require('../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance')
      .createPublicRootInstance;
  },
  get createPublicInstance(): createPublicInstance {
    return require('../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance')
      .createPublicInstance;
  },
  get createPublicTextInstance(): createPublicTextInstance {
    return require('../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance')
      .createPublicTextInstance;
  },
  get getNativeTagFromPublicInstance(): getNativeTagFromPublicInstance {
    return require('../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance')
      .getNativeTagFromPublicInstance;
  },
  get getNodeFromPublicInstance(): getNodeFromPublicInstance {
    return require('../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance')
      .getNodeFromPublicInstance;
  },
  get getInternalInstanceHandleFromPublicInstance(): getInternalInstanceHandleFromPublicInstance {
    return require('../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance')
      .getInternalInstanceHandleFromPublicInstance;
  },
  get dispatchNativeEvent(): dispatchNativeEvent {
    return require('../../src/private/renderer/events/dispatchNativeEvent')
      .default;
  },
};
