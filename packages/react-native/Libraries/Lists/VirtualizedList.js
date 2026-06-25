/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import VirtualizedLists from '@react-native/virtualized-lists';
import * as React from 'react';

type VirtualizedListType = typeof VirtualizedLists.VirtualizedList;
const VirtualizedListComponent: VirtualizedListType =
  VirtualizedLists.VirtualizedList;

export type VirtualizedListInstance = React.ElementRef<VirtualizedListType>;

export type {
  ListRenderItemInfo,
  ListRenderItem,
  ListViewToken,
  Separators,
  VirtualizedListProps,
} from '@react-native/virtualized-lists';
export default VirtualizedListComponent;
