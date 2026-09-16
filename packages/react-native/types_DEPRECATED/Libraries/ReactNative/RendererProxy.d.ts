/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';

export type NodeHandle = number;

export function findNodeHandle(
  componentOrHandle:
    null | number | React.Component<any, any> | React.ComponentClass<any>,
): null | NodeHandle;
