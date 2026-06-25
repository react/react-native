/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {RootTag} from '../Types/RootTagTypes';
import type {UIManagerJSInterface} from '../Types/UIManagerJSInterface';

import {unstable_hasComponent} from '../NativeComponent/NativeComponentRegistryUnstable';
import defineLazyObjectProperty from '../Utilities/defineLazyObjectProperty';
import Platform from '../Utilities/Platform';
import {getFabricUIManager} from './FabricUIManager';
import nullthrows from 'nullthrows';

function raiseSoftError(methodName: string, details?: string): void {
  console.error(
    `[ReactNative Architecture][JS] '${methodName}' is not available in the new React Native architecture.` +
      (details ? ` ${details}` : ''),
  );
}

const getUIManagerConstants: ?() => {[viewManagerName: string]: Object} =
  global.RN$LegacyInterop_UIManager_getConstants;

const getUIManagerConstantsCached = (function () {
  let wasCalledOnce = false;
  let result: {[viewManagerName: string]: Object} = {};
  return (): {[viewManagerName: string]: Object} => {
    if (!wasCalledOnce) {
      result = nullthrows(getUIManagerConstants)();
      wasCalledOnce = true;
    }
    return result;
  };
})();

const getConstantsForViewManager: ?(viewManagerName: string) => ?Object =
  global.RN$LegacyInterop_UIManager_getConstantsForViewManager;

const getDefaultEventTypes: ?() => Object =
  global.RN$LegacyInterop_UIManager_getDefaultEventTypes;

const getDefaultEventTypesCached = (function () {
  let wasCalledOnce = false;
  let result = null;
  return (): Object => {
    if (!wasCalledOnce) {
      result = nullthrows(getDefaultEventTypes)();
      wasCalledOnce = true;
    }
    return result;
  };
})();

/**
 * UIManager.js overrides these APIs.
 * Pull them out from the BridgelessUIManager implementation. So, we can ignore them.
 */
const UIManagerJSOverridenAPIs = {
  measure: (
    reactTag: number,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
      pageX: number,
      pageY: number,
    ) => void,
  ): void => {
    raiseSoftError('measure');
  },
  measureInWindow: (
    reactTag: number,
    callback: (x: number, y: number, width: number, height: number) => void,
  ): void => {
    raiseSoftError('measureInWindow');
  },
  measureLayout: (
    reactTag: number,
    ancestorReactTag: number,
    errorCallback: (error: Object) => void,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ): void => {
    raiseSoftError('measureLayout');
  },
  measureLayoutRelativeToParent: (
    reactTag: number,
    errorCallback: (error: Object) => void,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ): void => {
    raiseSoftError('measureLayoutRelativeToParent');
  },
  dispatchViewManagerCommand: (
    reactTag: number,
    commandID: number,
    commandArgs: ?Array<string | number | boolean>,
  ): void => {
    raiseSoftError('dispatchViewManagerCommand');
  },
};

/**
 * Leave Unimplemented: The only thing that called these methods was the paper renderer.
 * In OSS, the New Architecture will just use the Fabric renderer, which uses
 * different APIs.
 */
const UIManagerJSUnusedInNewArchAPIs = {
  createView: (
    reactTag: number,
    viewName: string,
    rootTag: RootTag,
    props: Object,
  ): void => {
    raiseSoftError('createView');
  },
  updateView: (reactTag: number, viewName: string, props: Object): void => {
    raiseSoftError('updateView');
  },
  setChildren: (containerTag: number, reactTags: Array<number>): void => {
    raiseSoftError('setChildren');
  },
  manageChildren: (
    containerTag: number,
    moveFromIndices: Array<number>,
    moveToIndices: Array<number>,
    addChildReactTags: Array<number>,
    addAtIndices: Array<number>,
    removeAtIndices: Array<number>,
  ): void => {
    raiseSoftError('manageChildren');
  },
  setJSResponder: (reactTag: number, blockNativeResponder: boolean): void => {
    raiseSoftError('setJSResponder');
  },
  clearJSResponder: (): void => {
    raiseSoftError('clearJSResponder');
  },
};

/**
 * Leave unimplemented: These APIs are deprecated in UIManager. We will eventually remove
 * them from React Native.
 */
const UIManagerJSDeprecatedPlatformAPIs = Platform.select({
  android: {},
});

const UIManagerJSPlatformAPIs = Platform.select({
  android: {
    getConstantsForViewManager: (viewManagerName: string): ?Object => {
      if (getConstantsForViewManager) {
        return getConstantsForViewManager(viewManagerName);
      }

      raiseSoftError('getConstantsForViewManager');
      return {};
    },
    getDefaultEventTypes: (): Array<string> => {
      if (getDefaultEventTypes) {
        return getDefaultEventTypesCached();
      }

      raiseSoftError('getDefaultEventTypes');
      return [];
    },
    setLayoutAnimationEnabledExperimental: (enabled: boolean): void => {
      if (__DEV__) {
        console.warn(
          'setLayoutAnimationEnabledExperimental is currently a no-op in the New Architecture.',
        );
      }
    },
    sendAccessibilityEvent: (reactTag: number, eventType: number): void => {
      // Keep this in sync with java:FabricUIManager.sendAccessibilityEventFromJS
      // and legacySendAccessibilityEvent.android.js
      const AccessibilityEvent = {
        TYPE_VIEW_FOCUSED: 0x00000008,
        TYPE_WINDOW_STATE_CHANGED: 0x00000020,
        TYPE_VIEW_CLICKED: 0x00000001,
        TYPE_VIEW_HOVER_ENTER: 0x00000080,
      };

      let eventName = null;
      if (eventType === AccessibilityEvent.TYPE_VIEW_FOCUSED) {
        eventName = 'focus';
      } else if (eventType === AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
        eventName = 'windowStateChange';
      } else if (eventType === AccessibilityEvent.TYPE_VIEW_CLICKED) {
        eventName = 'click';
      } else if (eventType === AccessibilityEvent.TYPE_VIEW_HOVER_ENTER) {
        eventName = 'viewHoverEnter';
      } else {
        console.error(
          `sendAccessibilityEvent() dropping event: Called with unsupported eventType: ${eventType}`,
        );
        return;
      }

      const FabricUIManager = nullthrows(getFabricUIManager());
      const shadowNode =
        FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      if (!shadowNode) {
        console.error(
          `sendAccessibilityEvent() dropping event: Cannot find view with tag #${reactTag}`,
        );
        return;
      }

      FabricUIManager.sendAccessibilityEvent(shadowNode, eventName);
    },
  },
  ios: {
    /**
     * TODO(T174674274): Implement lazy loading of legacy view managers in the new architecture.
     *
     * Leave this unimplemented until we implement lazy loading of legacy modules and view managers in the new architecture.
     */
    lazilyLoadView: (name: string): Object => {
      raiseSoftError('lazilyLoadView');
      return {};
    },
    focus: (reactTag: number): void => {
      const FabricUIManager = nullthrows(getFabricUIManager());
      const shadowNode =
        FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      if (!shadowNode) {
        console.error(`focus() noop: Cannot find view with tag #${reactTag}`);
        return;
      }
      FabricUIManager.dispatchCommand(shadowNode, 'focus', []);
    },
    blur: (reactTag: number): void => {
      const FabricUIManager = nullthrows(getFabricUIManager());
      const shadowNode =
        FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      if (!shadowNode) {
        console.error(`blur() noop: Cannot find view with tag #${reactTag}`);
        return;
      }
      FabricUIManager.dispatchCommand(shadowNode, 'blur', []);
    },
  },
});

const UIManagerJS: UIManagerJSInterface & {[string]: any} = {
  ...UIManagerJSOverridenAPIs,
  ...UIManagerJSDeprecatedPlatformAPIs,
  ...UIManagerJSPlatformAPIs,
  ...UIManagerJSUnusedInNewArchAPIs,
  getViewManagerConfig: (viewManagerName: string): unknown => {
    if (getUIManagerConstants) {
      const constants = getUIManagerConstantsCached();
      if (
        !constants[viewManagerName] &&
        UIManagerJS.getConstantsForViewManager
      ) {
        constants[viewManagerName] =
          UIManagerJS.getConstantsForViewManager(viewManagerName);
      }
      return constants[viewManagerName];
    } else {
      raiseSoftError(
        `getViewManagerConfig('${viewManagerName}')`,
        `If '${viewManagerName}' has a ViewManager and you want to retrieve its native ViewConfig, please turn on the native ViewConfig interop layer. If you want to see if this component is registered with React Native, please call hasViewManagerConfig('${viewManagerName}') instead.`,
      );
      return null;
    }
  },
  hasViewManagerConfig: (viewManagerName: string): boolean => {
    return unstable_hasComponent(viewManagerName);
  },
  getConstants: (): Object => {
    if (getUIManagerConstants) {
      return getUIManagerConstantsCached();
    } else {
      raiseSoftError('getConstants');
      return null;
    }
  },
  findSubviewIn: (
    reactTag: number,
    point: Array<number>,
    callback: (
      nativeViewTag: number,
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ): void => {
    const FabricUIManager = nullthrows(getFabricUIManager());
    const shadowNode = FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);

    if (!shadowNode) {
      console.error(
        `findSubviewIn() noop: Cannot find view with reactTag ${reactTag}`,
      );
      return;
    }

    FabricUIManager.findNodeAtPoint(
      shadowNode,
      point[0],
      point[1],
      function (internalInstanceHandle) {
        if (internalInstanceHandle == null) {
          console.error('findSubviewIn(): Cannot find node at point');
          return;
        }

        let instanceHandle: Object = internalInstanceHandle;
        let node = instanceHandle.stateNode.node;

        if (!node) {
          console.error('findSubviewIn(): Cannot find node at point');
          return;
        }

        let nativeViewTag: number =
          instanceHandle.stateNode.canonical.nativeTag;

        FabricUIManager.measure(
          node,
          function (x, y, width, height, pageX, pageY) {
            callback(nativeViewTag, pageX, pageY, width, height);
          },
        );
      },
    );
  },
  viewIsDescendantOf: (
    reactTag: number,
    ancestorReactTag: number,
    callback: (result: Array<boolean>) => void,
  ): void => {
    const FabricUIManager = nullthrows(getFabricUIManager());
    const shadowNode = FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
    if (!shadowNode) {
      console.error(
        `viewIsDescendantOf() noop: Cannot find view with reactTag ${reactTag}`,
      );
      return;
    }

    const ancestorShadowNode =
      FabricUIManager.findShadowNodeByTag_DEPRECATED(ancestorReactTag);
    if (!ancestorShadowNode) {
      console.error(
        `viewIsDescendantOf() noop: Cannot find view with ancestorReactTag ${ancestorReactTag}`,
      );
      return;
    }

    // Keep this in sync with ReadOnlyNode.js
    const DOCUMENT_POSITION_CONTAINED_BY = 16;

    let result = FabricUIManager.compareDocumentPosition(
      ancestorShadowNode,
      shadowNode,
    );

    // eslint-disable-next-line no-bitwise
    let isAncestor = (result & DOCUMENT_POSITION_CONTAINED_BY) !== 0;

    callback([isAncestor]);
  },
  configureNextLayoutAnimation: (
    config: Object,
    callback: () => void,
    errorCallback: (error: Object) => void,
  ): void => {
    const FabricUIManager = nullthrows(getFabricUIManager());
    FabricUIManager.configureNextLayoutAnimation(
      config,
      callback,
      errorCallback,
    );
  },
};

if (getUIManagerConstants) {
  Object.keys(getUIManagerConstantsCached()).forEach(viewConfigName => {
    UIManagerJS[viewConfigName] = getUIManagerConstantsCached()[viewConfigName];
  });

  if (UIManagerJS.getConstants().ViewManagerNames) {
    UIManagerJS.getConstants().ViewManagerNames.forEach(viewManagerName => {
      defineLazyObjectProperty(UIManagerJS, viewManagerName, {
        get: () =>
          nullthrows(UIManagerJS.getConstantsForViewManager)(viewManagerName),
      });
    });
  }
}

export default UIManagerJS;
