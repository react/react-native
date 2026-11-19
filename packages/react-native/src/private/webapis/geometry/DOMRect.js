/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/**
 * The JSDoc comments in this file have been extracted from [DOMRect](https://developer.mozilla.org/en-US/docs/Web/API/DOMRect).
 * Content by [Mozilla Contributors](https://developer.mozilla.org/en-US/docs/Web/API/DOMRect/contributors.txt),
 * licensed under [CC-BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5/).
 */

import {setPlatformObject} from '../webidl/PlatformObjects';
import DOMRectReadOnly, {type DOMRectInit} from './DOMRectReadOnly';

/**
 * A `DOMRect` describes the size and position of a rectangle.
 * The type of box represented by the `DOMRect` is specified by the method or property that returned it.
 *
 * This is a (mostly) spec-compliant version of `DOMRect` (https://developer.mozilla.org/en-US/docs/Web/API/DOMRect).
 */
export default class DOMRect extends DOMRectReadOnly {
  /**
   * The x coordinate of the `DOMRect`'s origin.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get x(): number {
    return this.__getInternalX();
  }

  // $FlowFixMe[unsafe-getters-setters]
  set x(x: ?number) {
    this.__setInternalX(x);
  }

  /**
   * The y coordinate of the `DOMRect`'s origin.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get y(): number {
    return this.__getInternalY();
  }

  // $FlowFixMe[unsafe-getters-setters]
  set y(y: ?number) {
    this.__setInternalY(y);
  }

  /**
   * The width of the `DOMRect`.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get width(): number {
    return this.__getInternalWidth();
  }

  // $FlowFixMe[unsafe-getters-setters]
  set width(width: ?number) {
    this.__setInternalWidth(width);
  }

  /**
   * The height of the `DOMRect`.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get height(): number {
    return this.__getInternalHeight();
  }

  // $FlowFixMe[unsafe-getters-setters]
  set height(height: ?number) {
    this.__setInternalHeight(height);
  }

  /**
   * Creates a new `DOMRect` object with a given location and dimensions.
   */
  static fromRect(rect?: ?DOMRectInit): DOMRect {
    if (!rect) {
      return new DOMRect();
    }

    return new DOMRect(rect.x, rect.y, rect.width, rect.height);
  }
}

setPlatformObject(DOMRect, {
  clone: rect => new DOMRect(rect.x, rect.y, rect.width, rect.height),
});
