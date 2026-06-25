/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {RootTag} from '../Types/RootTagTypes';
import type {UIManagerJSInterface} from '../Types/UIManagerJSInterface';

import NativeUIManager from './NativeUIManager';
import nullthrows from 'nullthrows';

const NativeModules = require('../BatchedBridge/NativeModules').default;
const defineLazyObjectProperty =
  require('../Utilities/defineLazyObjectProperty').default;
const Platform = require('../Utilities/Platform').default;
const UIManagerProperties = require('./UIManagerProperties').default;

const viewManagerConfigs: {[string]: any | null} = {};

const triedLoadingConfig = new Set<string>();

let NativeUIManagerConstants = {};
let isNativeUIManagerConstantsSet = false;
function getConstants(): Object {
  if (!isNativeUIManagerConstantsSet) {
    NativeUIManagerConstants = NativeUIManager.getConstants();
    isNativeUIManagerConstantsSet = true;
  }
  return NativeUIManagerConstants;
}

function getViewManagerConfig(viewManagerName: string): any {
  if (
    viewManagerConfigs[viewManagerName] === undefined &&
    NativeUIManager.getConstantsForViewManager
  ) {
    try {
      viewManagerConfigs[viewManagerName] =
        NativeUIManager.getConstantsForViewManager(viewManagerName);
    } catch (e) {
      console.error(
        "NativeUIManager.getConstantsForViewManager('" +
          viewManagerName +
          "') threw an exception.",
        e,
      );
      viewManagerConfigs[viewManagerName] = null;
    }
  }

  const config = viewManagerConfigs[viewManagerName];
  if (config) {
    return config;
  }

  // If we're in the Chrome Debugger, let's not even try calling the sync
  // method.
  if (!global.nativeCallSyncHook) {
    return config;
  }

  if (
    NativeUIManager.lazilyLoadView &&
    !triedLoadingConfig.has(viewManagerName)
  ) {
    const result = nullthrows(NativeUIManager.lazilyLoadView)(viewManagerName);
    triedLoadingConfig.add(viewManagerName);
    if (result != null && result.viewConfig != null) {
      getConstants()[viewManagerName] = result.viewConfig;
      lazifyViewManagerConfig(viewManagerName);
    }
  }

  return viewManagerConfigs[viewManagerName];
}

// $FlowFixMe[cannot-spread-interface]
const UIManagerJS: UIManagerJSInterface = {
  ...NativeUIManager,
  createView(
    reactTag: number,
    viewName: string,
    rootTag: RootTag,
    props: Object,
  ): void {
    if (Platform.OS === 'ios' && viewManagerConfigs[viewName] === undefined) {
      // This is necessary to force the initialization of native viewManager
      // classes in iOS when using static ViewConfigs
      getViewManagerConfig(viewName);
    }

    NativeUIManager.createView(reactTag, viewName, rootTag, props);
  },
  getConstants(): Object {
    return getConstants();
  },
  getViewManagerConfig(viewManagerName: string): any {
    return getViewManagerConfig(viewManagerName);
  },
  hasViewManagerConfig(viewManagerName: string): boolean {
    return getViewManagerConfig(viewManagerName) != null;
  },
};

// TODO (T45220498): Remove this.
// 3rd party libs may be calling `NativeModules.UIManager.getViewManagerConfig()`
// instead of `UIManager.getViewManagerConfig()` off UIManager.js.
// This is a workaround for now.
// $FlowFixMe[prop-missing]
NativeUIManager.getViewManagerConfig = UIManagerJS.getViewManagerConfig;

function lazifyViewManagerConfig(viewName: string) {
  const viewConfig = getConstants()[viewName];
  viewManagerConfigs[viewName] = viewConfig;
  if (viewConfig.Manager) {
    defineLazyObjectProperty(viewConfig, 'Constants', {
      get: () => {
        const viewManager = NativeModules[viewConfig.Manager];
        const constants: {[string]: unknown} = {};
        viewManager &&
          Object.keys(viewManager).forEach(key => {
            const value = viewManager[key];
            if (typeof value !== 'function') {
              constants[key] = value;
            }
          });
        return constants;
      },
    });
    defineLazyObjectProperty(viewConfig, 'Commands', {
      get: () => {
        const viewManager = NativeModules[viewConfig.Manager];
        const commands: {[string]: number} = {};
        let index = 0;
        viewManager &&
          Object.keys(viewManager).forEach(key => {
            const value = viewManager[key];
            if (typeof value === 'function') {
              commands[key] = index++;
            }
          });
        return commands;
      },
    });
  }
}

/**
 * Copies the ViewManager constants and commands into UIManager. This is
 * only needed for iOS, which puts the constants in the ViewManager
 * namespace instead of UIManager, unlike Android.
 */
if (Platform.OS === 'ios') {
  Object.keys(getConstants()).forEach(viewName => {
    lazifyViewManagerConfig(viewName);
  });
} else if (getConstants().ViewManagerNames) {
  NativeUIManager.getConstants().ViewManagerNames.forEach(viewManagerName => {
    defineLazyObjectProperty(NativeUIManager, viewManagerName, {
      get: () =>
        nullthrows(NativeUIManager.getConstantsForViewManager)(viewManagerName),
    });
  });
}

if (!global.nativeCallSyncHook) {
  Object.keys(getConstants()).forEach(viewManagerName => {
    if (!UIManagerProperties.includes(viewManagerName)) {
      if (!viewManagerConfigs[viewManagerName]) {
        viewManagerConfigs[viewManagerName] = getConstants()[viewManagerName];
      }
      defineLazyObjectProperty(NativeUIManager, viewManagerName, {
        get: () => {
          console.warn(
            `Accessing view manager configs directly off UIManager via UIManager['${viewManagerName}'] ` +
              `is no longer supported. Use UIManager.getViewManagerConfig('${viewManagerName}') instead.`,
          );

          return UIManagerJS.getViewManagerConfig(viewManagerName);
        },
      });
    }
  });
}

export default UIManagerJS;
