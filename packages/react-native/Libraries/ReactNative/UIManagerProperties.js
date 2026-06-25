/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

/**
 * The list of non-ViewManager related UIManager properties.
 *
 * In an effort to improve startup performance by lazily loading view managers,
 * the interface to access view managers will change from
 * UIManager['viewManagerName'] to UIManager.getViewManagerConfig('viewManagerName').
 * By using a function call instead of a property access, the UIManager will
 * be able to initialize and load the required view manager from native
 * synchronously. All of React Native's core components have been updated to
 * use getViewManagerConfig(). For the next few releases, any usage of
 * UIManager['viewManagerName'] will result in a warning. Because React Native
 * does not support Proxy objects, a view manager access is implied if any of
 * UIManager's properties that are not one of the properties below is being
 * accessed. Once UIManager property accesses for view managers has been fully
 * deprecated, this file will also be removed.
 */
const UIManagerProperties: ReadonlyArray<string> = [
  'clearJSResponder',
  'configureNextLayoutAnimation',
  'createView',
  'dispatchViewManagerCommand',
  'findSubviewIn',
  'getConstantsForViewManager',
  'getDefaultEventTypes',
  'manageChildren',
  'measure',
  'measureInWindow',
  'measureLayout',
  'measureLayoutRelativeToParent',
  'removeRootView',
  'sendAccessibilityEvent',
  'setChildren',
  'setJSResponder',
  'setLayoutAnimationEnabledExperimental',
  'updateView',
  'viewIsDescendantOf',
  'LazyViewManagersEnabled',
  'ViewManagerNames',
  'StyleConstants',
  'AccessibilityEventTypes',
  'UIView',
  'getViewManagerConfig',
  'hasViewManagerConfig',
  'blur',
  'focus',
  'genericBubblingEventTypes',
  'genericDirectEventTypes',
  'lazilyLoadView',
];

export default UIManagerProperties;
