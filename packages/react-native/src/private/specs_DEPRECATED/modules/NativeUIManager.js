/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {RootTag} from '../../../../Libraries/TurboModule/RCTExport';
import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export type NativeMeasureOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number,
) => void;

export type NativeMeasureInWindowOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
) => void;

export type NativeMeasureLayoutOnSuccessCallback = (
  left: number,
  top: number,
  width: number,
  height: number,
) => void;

export interface Spec extends TurboModule {
  readonly getConstants: () => Object;
  readonly createView: (
    reactTag: number,
    viewName: string,
    rootTag: RootTag,
    props: Object,
  ) => void;
  readonly updateView: (
    reactTag: number,
    viewName: string,
    props: Object,
  ) => void;
  readonly findSubviewIn: (
    reactTag: number,
    point: Array<number>,
    callback: (
      nativeViewTag: number,
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ) => void;
  /**
   * Used to call a native view method from JavaScript
   *
   * reactTag - Id of react view.
   * commandID - Id of the native method that should be called.
   * commandArgs - Args of the native method that we can pass from JS to native.
   */
  readonly dispatchViewManagerCommand: (
    reactTag: number,
    commandID: number, // number || string
    commandArgs?: Array<any>,
  ) => void;
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
  readonly measure: (
    reactTag: number,
    callback: NativeMeasureOnSuccessCallback,
  ) => void;
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
  readonly measureInWindow: (
    reactTag: number,
    callback: NativeMeasureInWindowOnSuccessCallback,
  ) => void;
  readonly viewIsDescendantOf: (
    reactTag: number,
    ancestorReactTag: number,
    callback: (result: Array<boolean>) => void,
  ) => void;
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
  readonly measureLayout: (
    reactTag: number,
    ancestorReactTag: number,
    errorCallback: (error: Object) => void,
    callback: NativeMeasureLayoutOnSuccessCallback,
  ) => void;
  readonly measureLayoutRelativeToParent: (
    reactTag: number,
    errorCallback: (error: Object) => void,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ) => void;
  readonly setJSResponder: (
    reactTag: number,
    blockNativeResponder: boolean,
  ) => void;
  readonly clearJSResponder: () => void;
  readonly configureNextLayoutAnimation: (
    config: Object,
    callback: () => void, // check what is returned here
    errorCallback: (error: Object) => void,
  ) => void;
  readonly setChildren: (
    containerTag: number,
    reactTags: Array<number>,
  ) => void;
  readonly manageChildren: (
    containerTag: number,
    moveFromIndices: Array<number>,
    moveToIndices: Array<number>,
    addChildReactTags: Array<number>,
    addAtIndices: Array<number>,
    removeAtIndices: Array<number>,
  ) => void;

  // Android only
  readonly getConstantsForViewManager?: (viewManagerName: string) => ?Object;
  readonly getDefaultEventTypes?: () => Array<string>;
  /**
   * Automatically animates views to their new positions when the
   * next layout happens.
   *
   * A common way to use this API is to call it before calling `setState`.
   *
   * Note that in order to get this to work on **Android** you need to set the following flags via `UIManager`:
   *
   * ```js
   * UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
   * ```
   */
  readonly setLayoutAnimationEnabledExperimental?: (enabled: boolean) => void;
  readonly sendAccessibilityEvent?: (
    reactTag: number,
    eventType: number,
  ) => void;

  // ios only
  readonly lazilyLoadView?: (name: string) => Object; // revisit return
  readonly focus?: (reactTag: number) => void;
  readonly blur?: (reactTag: number) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('UIManager') as Spec;
