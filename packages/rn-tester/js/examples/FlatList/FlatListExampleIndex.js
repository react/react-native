/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModule} from '../../types/RNTesterTypes';

import BasicExample from './FlatList-basic';
import ContentInsetExample from './FlatList-contentInset';
import InvertedExample from './FlatList-inverted';
import MaintainVisibleContentPosition from './FlatList-maintainVisibleContentPosition';
import MultiColumnExample from './FlatList-multiColumn';
import NestedExample from './FlatList-nested';
import OnEndReachedExample from './FlatList-onEndReached';
import OnStartReachedExample from './FlatList-onStartReached';
import onViewableItemsChangedExample from './FlatList-onViewableItemsChanged';
import onViewableItemsChanged_horizontal_noWaitForInteraction from './FlatList-onViewableItemsChanged-horizontal-noWaitForInteraction';
import onViewableItemsChanged_horizontal_offScreen from './FlatList-onViewableItemsChanged-horizontal-offScreen';
import onViewableItemsChanged_horizontal_waitForInteraction from './FlatList-onViewableItemsChanged-horizontal-waitForInteraction';
import onViewableItemsChanged_noWaitwaitForInteractionExample from './FlatList-onViewableItemsChanged-noWaitForInteraction';
import onViewableItemsChanged_offScreen from './FlatList-onViewableItemsChanged-offScreen';
import onViewableItemsChanged_waitForInteractionExample from './FlatList-onViewableItemsChanged-waitForInteraction';
import StickyHeadersExample from './FlatList-stickyHeaders';
import WithSeparatorsExample from './FlatList-withSeparators';

export default {
  framework: 'React',
  title: 'FlatList',
  category: 'ListView',
  documentationURL: 'https://reactnative.dev/docs/flatlist',
  description: 'Performant, scrollable list of data.',
  showIndividualExamples: true,
  examples: [
    BasicExample,
    MaintainVisibleContentPosition,
    OnStartReachedExample,
    OnEndReachedExample,
    ContentInsetExample,
    InvertedExample,
    onViewableItemsChangedExample,
    WithSeparatorsExample,
    MultiColumnExample,
    StickyHeadersExample,
    NestedExample,
    onViewableItemsChanged_waitForInteractionExample,
    onViewableItemsChanged_noWaitwaitForInteractionExample,
    onViewableItemsChanged_horizontal_waitForInteraction,
    onViewableItemsChanged_horizontal_noWaitForInteraction,
    onViewableItemsChanged_offScreen,
    onViewableItemsChanged_horizontal_offScreen,
  ],
} as RNTesterModule;
