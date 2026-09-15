/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

export type EdgeInsets = {
  top: number,
  right: number,
  bottom: number,
  left: number,
};

export type Rect = {
  x: number,
  y: number,
  width: number,
  height: number,
};

export type Metrics = {
  insets: EdgeInsets,
  frame: Rect,
};

export type Edge = 'top' | 'right' | 'bottom' | 'left';

export type EdgeMode = 'off' | 'additive' | 'maximum';

export type EdgeRecord = Partial<{[edge: Edge]: EdgeMode}>;

export type Edges = ReadonlyArray<Edge> | Readonly<EdgeRecord>;
