/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
} from '../../types/public/ReactNativeTypes';

export interface UIManagerStatic {
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
  measure(node: number, callback: MeasureOnSuccessCallback): void;

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
    node: number,
    callback: MeasureInWindowOnSuccessCallback,
  ): void;

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
    node: number,
    relativeToNativeNode: number,
    onFail: () => void /* currently unused */,
    onSuccess: MeasureLayoutOnSuccessCallback,
  ): void;

  /**
   * Automatically animates views to their new positions when the
   * next layout happens.
   *
   * A common way to use this API is to call it before calling `setState`.
   *
   * Note that in order to get this to work on **Android** you need to set the following flags via `UIManager`:
   *
   *     UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
   */
  setLayoutAnimationEnabledExperimental?:
    ((value: boolean) => void) | undefined;

  getViewManagerConfig: (name: string) => {
    Commands: {[key: string]: number};
  };

  hasViewManagerConfig: (name: string) => boolean;

  /**
   * Used to call a native view method from JavaScript
   *
   * reactTag - Id of react view.
   * commandID - Id of the native method that should be called.
   * commandArgs - Args of the native method that we can pass from JS to native.
   */
  dispatchViewManagerCommand: (
    reactTag: number | null,
    commandID: number | string,
    commandArgs?: Array<any>,
  ) => void;
}

export const UIManager: UIManagerStatic;
export type UIManager = UIManagerStatic;
export default UIManager;
