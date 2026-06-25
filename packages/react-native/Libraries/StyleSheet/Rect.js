/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

export type Rect = Readonly<{
  bottom?: ?number,
  left?: ?number,
  right?: ?number,
  top?: ?number,
}>;

export type Insets = Rect;
export type RectOrSize = Rect | number;

export function createSquare(size: number): Rect {
  return {bottom: size, left: size, right: size, top: size};
}

export function normalizeRect(rectOrSize: ?RectOrSize): ?Rect {
  return typeof rectOrSize === 'number' ? createSquare(rectOrSize) : rectOrSize;
}
