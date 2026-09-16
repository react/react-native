/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// flowlint unsafe-getters-setters:off

import {setPlatformObject} from '../webidl/PlatformObjects';

/**
 * The [`ResizeObserverSize`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverSize)
 * interface of the Resize Observer API is used to store the block and inline
 * sizes of a box as separate properties.
 *
 * It is returned by the `borderBoxSize`, `contentBoxSize` and
 * `devicePixelContentBoxSize` properties of `ResizeObserverEntry`.
 */
export default class ResizeObserverSize {
  _inlineSize: number;
  _blockSize: number;

  constructor(inlineSize: number, blockSize: number) {
    this._inlineSize = inlineSize;
    this._blockSize = blockSize;
  }

  /**
   * The length of the observed box in the inline dimension. For boxes with a
   * horizontal writing-mode, this is the horizontal dimension, or width; if
   * the writing-mode is vertical, this is the vertical dimension, or height.
   *
   * React Native assumes a horizontal writing-mode, so this is the width.
   */
  get inlineSize(): number {
    return this._inlineSize;
  }

  /**
   * The length of the observed box in the block dimension. For boxes with a
   * horizontal writing-mode, this is the vertical dimension, or height; if the
   * writing-mode is vertical, this is the horizontal dimension, or width.
   *
   * React Native assumes a horizontal writing-mode, so this is the height.
   */
  get blockSize(): number {
    return this._blockSize;
  }
}

setPlatformObject(ResizeObserverSize);

// `ResizeObserverSize` is not constructible from user code on the Web (its IDL
// declares no constructor). We expose this wrapper as the global instead of the
// class above, which we still use internally to build entries.
export const ResizeObserverSize_public: typeof ResizeObserverSize =
  /* eslint-disable no-shadow */
  // $FlowExpectedError[incompatible-type]
  function ResizeObserverSize() {
    throw new TypeError(
      "Failed to construct 'ResizeObserverSize': Illegal constructor",
    );
  };

// $FlowExpectedError[prop-missing]
ResizeObserverSize_public.prototype = ResizeObserverSize.prototype;
