/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {UIManagerJSInterface} from '../Types/UIManagerJSInterface';

import {getFabricUIManager} from './FabricUIManager';
import nullthrows from 'nullthrows';

function isFabricReactTag(reactTag: number): boolean {
  // React reserves even numbers for Fabric.
  return reactTag % 2 === 0;
}

const UIManagerImpl: UIManagerJSInterface =
  global.RN$Bridgeless === true
    ? require('./BridgelessUIManager').default
    : require('./PaperUIManager').default;

// $FlowFixMe[cannot-spread-interface]
const UIManager: UIManagerJSInterface = {
  ...UIManagerImpl,
  /**
   * Determines the location on screen, width, and height of the given view and
   * returns the values via an async callback. If successful, the callback will
   * be called with the following arguments:
   *
   *  - x
   *  - y
   *  - width
   *  - height
   *  - pageX
   *  - pageY
   *
   * Note that these measurements are not available until after the rendering
   * has been completed in native. If you need the measurements as soon as
   * possible, consider using the [`onLayout`
   * prop](docs/view.html#onlayout) instead.
   *
   * @deprecated Use `ref.measure` instead.
   */
  measure(
    reactTag: number,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
      pageX: number,
      pageY: number,
    ) => void,
  ): void {
    if (isFabricReactTag(reactTag)) {
      const FabricUIManager = nullthrows(getFabricUIManager());
      const shadowNode =
        FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      if (shadowNode) {
        FabricUIManager.measure(shadowNode, callback);
      } else {
        console.warn(`measure cannot find view with tag #${reactTag}`);
        // $FlowFixMe[incompatible-type]
        callback();
      }
    } else {
      // Paper
      UIManagerImpl.measure(reactTag, callback);
    }
  },

  /**
   * Determines the location of the given view in the window and returns the
   * values via an async callback. If the React root view is embedded in
   * another native view, this will give you the absolute coordinates. If
   * successful, the callback will be called with the following
   * arguments:
   *
   *  - x
   *  - y
   *  - width
   *  - height
   *
   * Note that these measurements are not available until after the rendering
   * has been completed in native.
   *
   * @deprecated Use `ref.measureInWindow` instead.
   */
  measureInWindow(
    reactTag: number,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ): void {
    if (isFabricReactTag(reactTag)) {
      const FabricUIManager = nullthrows(getFabricUIManager());
      const shadowNode =
        FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      if (shadowNode) {
        FabricUIManager.measureInWindow(shadowNode, callback);
      } else {
        console.warn(`measure cannot find view with tag #${reactTag}`);
        // $FlowFixMe[incompatible-type]
        callback();
      }
    } else {
      // Paper
      UIManagerImpl.measureInWindow(reactTag, callback);
    }
  },

  /**
   * Like [`measure()`](#measure), but measures the view relative an ancestor,
   * specified as `relativeToNativeNode`. This means that the returned x, y
   * are relative to the origin x, y of the ancestor view.
   *
   * As always, to obtain a native node handle for a component, you can use
   * `React.findNodeHandle(component)`.
   *
   * @deprecated Use `ref.measureLayout` instead.
   */
  measureLayout(
    reactTag: number,
    ancestorReactTag: number,
    errorCallback: (error: Object) => void,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ): void {
    if (isFabricReactTag(reactTag)) {
      const FabricUIManager = nullthrows(getFabricUIManager());
      const shadowNode =
        FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      const ancestorShadowNode =
        FabricUIManager.findShadowNodeByTag_DEPRECATED(ancestorReactTag);

      if (!shadowNode || !ancestorShadowNode) {
        return;
      }

      FabricUIManager.measureLayout(
        shadowNode,
        ancestorShadowNode,
        errorCallback,
        callback,
      );
    } else {
      // Paper
      UIManagerImpl.measureLayout(
        reactTag,
        ancestorReactTag,
        errorCallback,
        callback,
      );
    }
  },

  measureLayoutRelativeToParent(
    reactTag: number,
    errorCallback: (error: Object) => void,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ): void {
    if (isFabricReactTag(reactTag)) {
      console.warn(
        'RCTUIManager.measureLayoutRelativeToParent method is deprecated and it will not be implemented in newer versions of RN (Fabric) - T47686450',
      );
      const FabricUIManager = nullthrows(getFabricUIManager());
      const shadowNode =
        FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      if (shadowNode) {
        FabricUIManager.measure(
          shadowNode,
          (left, top, width, height, pageX, pageY) => {
            callback(left, top, width, height);
          },
        );
      }
    } else {
      // Paper
      UIManagerImpl.measureLayoutRelativeToParent(
        reactTag,
        errorCallback,
        callback,
      );
    }
  },

  /**
   * Used to call a native view method from JavaScript
   *
   * reactTag - Id of react view.
   * commandID - Id of the native method that should be called.
   * commandArgs - Args of the native method that we can pass from JS to native.
   */
  dispatchViewManagerCommand(
    reactTag: number,
    commandName: number | string,
    commandArgs: any[],
  ) {
    // Sometimes, libraries directly pass in the output of `findNodeHandle` to
    // this function without checking if it's null. This guards against that
    // case. We throw early here in Javascript so we can get a JS stacktrace
    // instead of a harder-to-debug native Java or Objective-C stacktrace.
    if (typeof reactTag !== 'number') {
      throw new Error('dispatchViewManagerCommand: found null reactTag');
    }

    if (isFabricReactTag(reactTag)) {
      const FabricUIManager = nullthrows(getFabricUIManager());
      const shadowNode =
        FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      if (shadowNode) {
        // Transform the accidental CommandID into a CommandName which is the stringified number.
        // The interop layer knows how to convert this number into the right method name.
        // Stringify a string is a no-op, so it's safe.
        commandName = `${commandName}`;
        FabricUIManager.dispatchCommand(shadowNode, commandName, commandArgs);
      }
    } else {
      UIManagerImpl.dispatchViewManagerCommand(
        reactTag,
        // We have some legacy components that are actually already using strings. ¯\_(ツ)_/¯
        // $FlowFixMe[incompatible-type]
        commandName,
        commandArgs,
      );
    }
  },
};

export default UIManager;
