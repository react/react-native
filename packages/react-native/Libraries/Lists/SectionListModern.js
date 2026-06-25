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

import type {ScrollResponderType} from '../Components/ScrollView/ScrollView';
import type {
  ScrollToLocationParamsType,
  SectionBase as _SectionBase,
  SectionData,
  VirtualizedSectionListProps,
} from '@react-native/virtualized-lists';

import Platform from '../Utilities/Platform';
import VirtualizedLists from '@react-native/virtualized-lists';
import * as React from 'react';
import {useImperativeHandle, useRef} from 'react';

const VirtualizedSectionList = VirtualizedLists.VirtualizedSectionList;

type DefaultSectionT = {
  [key: string]: any,
};

export type SectionBase<
  SectionItemT,
  SectionT = DefaultSectionT,
> = _SectionBase<SectionItemT, SectionT>;

type RequiredProps<ItemT, SectionT = DefaultSectionT> = {
  /**
   * The actual data to render, akin to the `data` prop in [`<FlatList>`](https://reactnative.dev/docs/flatlist).
   *
   * General shape:
   *
   *     sections: $ReadOnlyArray<{
   *       data: $ReadOnlyArray<SectionItem>,
   *       renderItem?: ({item: SectionItem, ...}) => ?React.MixedElement,
   *       ItemSeparatorComponent?: ?ReactClass<{highlighted: boolean, ...}>,
   *     }>
   */
  sections: ReadonlyArray<SectionData<ItemT, SectionT>>,
};

type OptionalProps<ItemT, SectionT = DefaultSectionT> = {
  /**
   * Default renderer for every item in every section. Can be over-ridden on a per-section basis.
   */
  renderItem?: (info: {
    item: ItemT,
    index: number,
    section: SectionData<ItemT, SectionT>,
    separators: {
      highlight: () => void,
      unhighlight: () => void,
      updateProps: (select: 'leading' | 'trailing', newProps: Object) => void,
      ...
    },
    ...
  }) => null | React.MixedElement,
  /**
   * A marker property for telling the list to re-render (since it implements `PureComponent`). If
   * any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the
   * `data` prop, stick it here and treat it immutably.
   */
  extraData?: any,
  /**
   * How many items to render in the initial batch. This should be enough to fill the screen but not
   * much more. Note these items will never be unmounted as part of the windowed rendering in order
   * to improve perceived performance of scroll-to-top actions.
   */
  initialNumToRender?: ?number,
  /**
   * Reverses the direction of scroll. Uses scale transforms of -1.
   */
  inverted?: ?boolean,
  /**
   * Used to extract a unique key for a given item at the specified index. Key is used for caching
   * and as the react key to track item re-ordering. The default extractor checks item.key, then
   * falls back to using the index, like react does. Note that this sets keys for each item, but
   * each overall section still needs its own key.
   */
  keyExtractor?: ?(item: ItemT, index: number) => string,
  /**
   * Called once when the scroll position gets within `onEndReachedThreshold` of the rendered
   * content.
   */
  onEndReached?: ?(info: {distanceFromEnd: number, ...}) => void,
  /**
   * Note: may have bugs (missing content) in some circumstances - use at your own risk.
   *
   * This may improve scroll performance for large lists.
   */
  removeClippedSubviews?: boolean,
};

export type Props<ItemT, SectionT = DefaultSectionT> = Readonly<{
  ...Omit<
    VirtualizedSectionListProps<ItemT, SectionT>,
    'getItem' | 'getItemCount' | 'renderItem' | 'keyExtractor',
  >,
  ...RequiredProps<ItemT, SectionT>,
  ...OptionalProps<ItemT, SectionT>,
}>;

/**
 * A performant interface for rendering sectioned lists, supporting the most handy features:
 *
 *  - Fully cross-platform.
 *  - Configurable viewability callbacks.
 *  - List header support.
 *  - List footer support.
 *  - Item separator support.
 *  - Section header support.
 *  - Section separator support.
 *  - Heterogeneous data and item rendering support.
 *  - Pull to Refresh.
 *  - Scroll loading.
 *
 * If you don't need section support and want a simpler interface, use
 * [`<FlatList>`](https://reactnative.dev/docs/flatlist).
 *
 * Simple Examples:
 *
 *     <SectionList
 *       renderItem={({item}) => <ListItem title={item} />}
 *       renderSectionHeader={({section}) => <Header title={section.title} />}
 *       sections={[ // homogeneous rendering between sections
 *         {data: [...], title: ...},
 *         {data: [...], title: ...},
 *         {data: [...], title: ...},
 *       ]}
 *     />
 *
 *     <SectionList
 *       sections={[ // heterogeneous rendering between sections
 *         {data: [...], renderItem: ...},
 *         {data: [...], renderItem: ...},
 *         {data: [...], renderItem: ...},
 *       ]}
 *     />
 *
 * This is a convenience wrapper around [`<VirtualizedList>`](docs/virtualizedlist),
 * and thus inherits its props (as well as those of `ScrollView`) that aren't explicitly listed
 * here, along with the following caveats:
 *
 * - Internal state is not preserved when content scrolls out of the render window. Make sure all
 *   your data is captured in the item data or external stores like Flux, Redux, or Relay.
 * - This is a `PureComponent` which means that it will not re-render if `props` remain shallow-
 *   equal. Make sure that everything your `renderItem` function depends on is passed as a prop
 *   (e.g. `extraData`) that is not `===` after updates, otherwise your UI may not update on
 *   changes. This includes the `data` prop and parent component state.
 * - In order to constrain memory and enable smooth scrolling, content is rendered asynchronously
 *   offscreen. This means it's possible to scroll faster than the fill rate and momentarily see
 *   blank content. This is a tradeoff that can be adjusted to suit the needs of each application,
 *   and we are working on improving it behind the scenes.
 * - By default, the list looks for a `key` prop on each item and uses that for the React key.
 *   Alternatively, you can provide a custom `keyExtractor` prop.
 *
 */
const SectionList: component(
  ref?: React.RefSetter<any>,
  ...Props<any, DefaultSectionT>
) = ({
  ref,
  ...props
}: {
  ref?: React.RefSetter<any>,
  ...Props<any, DefaultSectionT>,
}) => {
  const propsWithDefaults = {
    stickySectionHeadersEnabled: Platform.OS === 'ios',
    ...props,
  };

  const wrapperRef = useRef<?React.ElementRef<typeof VirtualizedSectionList>>();

  useImperativeHandle(
    ref,
    () => ({
      /**
       * Scrolls to the item at the specified `sectionIndex` and `itemIndex` (within the section)
       * positioned in the viewable area such that `viewPosition` 0 places it at the top (and may be
       * covered by a sticky header), 1 at the bottom, and 0.5 centered in the middle. `viewOffset` is a
       * fixed number of pixels to offset the final target position, e.g. to compensate for sticky
       * headers.
       *
       * Note: cannot scroll to locations outside the render window without specifying the
       * `getItemLayout` prop.
       */
      scrollToLocation(params: ScrollToLocationParamsType) {
        wrapperRef.current?.scrollToLocation(params);
      },

      /**
       * Tells the list an interaction has occurred, which should trigger viewability calculations, e.g.
       * if `waitForInteractions` is true and the user has not scrolled. This is typically called by
       * taps on items or by navigation actions.
       */
      recordInteraction() {
        wrapperRef.current?.getListRef()?.recordInteraction();
      },

      /**
       * Displays the scroll indicators momentarily.
       *
       * @platform ios
       */
      flashScrollIndicators() {
        wrapperRef.current?.getListRef()?.flashScrollIndicators();
      },

      /**
       * Provides a handle to the underlying scroll responder.
       */
      getScrollResponder(): ?ScrollResponderType {
        wrapperRef.current?.getListRef()?.getScrollResponder();
      },

      getScrollableNode(): any {
        wrapperRef.current?.getListRef()?.getScrollableNode();
      },

      setNativeProps(nativeProps: Object) {
        wrapperRef.current?.getListRef()?.setNativeProps(nativeProps);
      },
    }),
    [wrapperRef],
  );

  return (
    <VirtualizedSectionList
      {...propsWithDefaults}
      ref={wrapperRef}
      getItemCount={items => items.length}
      getItem={(items, index) => items[index]}
    />
  );
};

export default SectionList;
