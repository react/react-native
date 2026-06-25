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

type VirtualizedSectionListType =
  typeof VirtualizedLists.VirtualizedSectionList;
const VirtualizedSectionList: VirtualizedSectionListType =
  VirtualizedLists.VirtualizedSectionList;

export type VirtualizedSectionListInstance =
  React.ElementRef<VirtualizedSectionListType>;

export type {
  SectionBase,
  ScrollToLocationParamsType,
  VirtualizedSectionListProps,
} from '@react-native/virtualized-lists';
export default VirtualizedSectionList;
