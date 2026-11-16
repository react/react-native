/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import typeof FillRateHelperT from './Lists/FillRateHelper';
import typeof ViewabilityHelperT from './Lists/ViewabilityHelper';
import type VirtualizedListInstanceT from './Lists/VirtualizedList';
import typeof VirtualizedListT from './Lists/VirtualizedList';
import type {AnyVirtualizedSectionList as AnyVirtualizedSectionListT} from './Lists/VirtualizedSectionList';

import {typeof VirtualizedListContextResetter as VirtualizedListContextResetterT} from './Lists/VirtualizedListContext';
import {keyExtractor} from './Lists/VirtualizeUtils';

export type {
  ViewToken as ListViewToken,
  ViewabilityConfig,
  ViewabilityConfigCallbackPair,
  ViewabilityConfigCallbackPairs,
} from './Lists/ViewabilityHelper';
export type {
  CellRendererProps,
  ListRenderItemInfo,
  ListRenderItem,
  Separators,
  VirtualizedListProps,
} from './Lists/VirtualizedListProps';
export type {
  VirtualizedSectionListProps,
  ScrollToLocationParamsType,
  SectionBase,
  SectionData,
} from './Lists/VirtualizedSectionList';
export type {FillRateInfo} from './Lists/FillRateHelper';
export type VirtualizedListInstance = VirtualizedListInstanceT;

export default {
  keyExtractor,

  get VirtualizedList(): VirtualizedListT {
    return require('./Lists/VirtualizedList').default;
  },
  get VirtualizedSectionList(): AnyVirtualizedSectionListT {
    return require('./Lists/VirtualizedSectionList').default;
  },
  get VirtualizedListContextResetter(): VirtualizedListContextResetterT {
    const VirtualizedListContext = require('./Lists/VirtualizedListContext');
    return VirtualizedListContext.VirtualizedListContextResetter;
  },
  get ViewabilityHelper(): ViewabilityHelperT {
    return require('./Lists/ViewabilityHelper').default;
  },
  get FillRateHelper(): FillRateHelperT {
    return require('./Lists/FillRateHelper').default;
  },
};
