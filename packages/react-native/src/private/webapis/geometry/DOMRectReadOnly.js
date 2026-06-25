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
 * The JSDoc comments in this file have been extracted from [DOMRectReadOnly](https://developer.mozilla.org/en-US/docs/Web/API/DOMRectReadOnly).
 * Content by [Mozilla Contributors](https://developer.mozilla.org/en-US/docs/Web/API/DOMRectReadOnly/contributors.txt),
 * licensed under [CC-BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5/).
 */

import {setPlatformObject} from '../webidl/PlatformObjects';

// flowlint sketchy-null:off, unsafe-getters-setters:off

export interface DOMRectInit {
  x?: ?number;
  y?: ?number;
  width?: ?number;
  height?: ?number;
}

function castToNumber(value: unknown): number {
  return value ? Number(value) : 0;
}

/**
 * The `DOMRectReadOnly` interface specifies the standard properties used by `DOMRect` to define a rectangle whose properties are immutable.
 *
 * This is a (mostly) spec-compliant version of `DOMRectReadOnly` (https://developer.mozilla.org/en-US/docs/Web/API/DOMRectReadOnly).
 */
export default class DOMRectReadOnly {
  #x: number;
  #y: number;
  #width: number;
  #height: number;

  constructor(x: ?number, y: ?number, width: ?number, height: ?number) {
    this.__setInternalX(x);
    this.__setInternalY(y);
    this.__setInternalWidth(width);
    this.__setInternalHeight(height);
  }

  /**
   * The x coordinate of the `DOMRectReadOnly`'s origin.
   */
  get x(): number {
    return this.#x;
  }

  /**
   * The y coordinate of the `DOMRectReadOnly`'s origin.
   */
  get y(): number {
    return this.#y;
  }

  /**
   * The width of the `DOMRectReadOnly`.
   */
  get width(): number {
    return this.#width;
  }

  /**
   * The height of the `DOMRectReadOnly`.
   */
  get height(): number {
    return this.#height;
  }

  /**
   * Returns the top coordinate value of the `DOMRect` (has the same value as `y`, or `y + height` if `height` is negative).
   */
  get top(): number {
    const height = this.#height;
    const y = this.#y;

    if (height < 0) {
      return y + height;
    }

    return y;
  }

  /**
   * Returns the right coordinate value of the `DOMRect` (has the same value as ``x + width`, or `x` if `width` is negative).
   */
  get right(): number {
    const width = this.#width;
    const x = this.#x;

    if (width < 0) {
      return x;
    }

    return x + width;
  }

  /**
   * Returns the bottom coordinate value of the `DOMRect` (has the same value as `y + height`, or `y` if `height` is negative).
   */
  get bottom(): number {
    const height = this.#height;
    const y = this.#y;

    if (height < 0) {
      return y;
    }

    return y + height;
  }

  /**
   * Returns the left coordinate value of the `DOMRect` (has the same value as `x`, or `x + width` if `width` is negative).
   */
  get left(): number {
    const width = this.#width;
    const x = this.#x;

    if (width < 0) {
      return x + width;
    }

    return x;
  }

  toJSON(): {
    x: number,
    y: number,
    width: number,
    height: number,
    top: number,
    left: number,
    bottom: number,
    right: number,
  } {
    const {x, y, width, height, top, left, bottom, right} = this;
    return {x, y, width, height, top, left, bottom, right};
  }

  /**
   * Creates a new `DOMRectReadOnly` object with a given location and dimensions.
   */
  static fromRect(rect?: ?DOMRectInit): DOMRectReadOnly {
    if (!rect) {
      return new DOMRectReadOnly();
    }

    return new DOMRectReadOnly(rect.x, rect.y, rect.width, rect.height);
  }

  __getInternalX(): number {
    return this.#x;
  }

  __getInternalY(): number {
    return this.#y;
  }

  __getInternalWidth(): number {
    return this.#width;
  }

  __getInternalHeight(): number {
    return this.#height;
  }

  __setInternalX(x: ?number) {
    this.#x = castToNumber(x);
  }

  __setInternalY(y: ?number) {
    this.#y = castToNumber(y);
  }

  __setInternalWidth(width: ?number) {
    this.#width = castToNumber(width);
  }

  __setInternalHeight(height: ?number) {
    this.#height = castToNumber(height);
  }
}

setPlatformObject(DOMRectReadOnly, {
  clone: rect => new DOMRectReadOnly(rect.x, rect.y, rect.width, rect.height),
});
