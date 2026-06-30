/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import type {
  ListRenderItem,
  ViewToken,
  VirtualizedListProps,
  ViewabilityConfig,
} from '@react-native/virtualized-lists';
import type {PublicScrollViewInstance} from '../Components/ScrollView/ScrollView';
import type {StyleProp} from '../StyleSheet/StyleSheet';
import type {ViewStyle} from '../StyleSheet/StyleSheetTypes';

export interface FlatListProps<ItemT> extends VirtualizedListProps<ItemT> {
  /**
   * Optional custom style for multi-item rows generated when numColumns > 1
   */
  columnWrapperStyle?: StyleProp<ViewStyle> | undefined;

  /**
   * Determines when the keyboard should stay visible after a tap.
   * - 'never' (the default), tapping outside of the focused text input when the keyboard is up dismisses the keyboard. When this happens, children won't receive the tap.
   * - 'always', the keyboard will not dismiss automatically, and the scroll view will not catch taps, but children of the scroll view can catch taps.
   * - 'handled', the keyboard will not dismiss automatically when the tap was handled by a children, (or captured by an ancestor).
   */
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled' | undefined;

  /**
   * An array (or array-like list) of items to render. Other data types can be
   * used by targeting VirtualizedList directly.
   */
  data: ArrayLike<ItemT> | null | undefined;

  /**
   * A marker property for telling the list to re-render (since it implements PureComponent).
   * If any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the `data` prop,
   * stick it here and treat it immutably.
   */
  extraData?: any | undefined;

  /**
   * `getItemLayout` is an optional optimization that lets us skip measurement of dynamic
   * content if you know the height of items a priori. getItemLayout is the most efficient,
   * and is easy to use if you have fixed height items, for example:
   * ```
   * getItemLayout={(data, index) => (
   *   {length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index}
   * )}
   * ```
   * Remember to include separator length (height or width) in your offset calculation if you specify
   * `ItemSeparatorComponent`.
   */
  getItemLayout?:
    | ((
        data: ArrayLike<ItemT> | null | undefined,
        index: number,
      ) => {length: number; offset: number; index: number})
    | undefined;

  /**
   * If true, renders items next to each other horizontally instead of stacked vertically.
   */
  horizontal?: boolean | null | undefined;

  /**
   * How many items to render in the initial batch
   */
  initialNumToRender?: number | undefined;

  /**
   * Instead of starting at the top with the first item, start at initialScrollIndex
   */
  initialScrollIndex?: number | null | undefined;

  /**
   * Used to extract a unique key for a given item at the specified index. Key is used for caching
   * and as the react key to track item re-ordering. The default extractor checks `item.key`, then
   * falls back to using the index, like React does.
   */
  keyExtractor?: ((item: ItemT, index: number) => string) | undefined;

  /**
   * Uses legacy MetroListView instead of default VirtualizedSectionList
   */
  legacyImplementation?: boolean | undefined;

  /**
   * Multiple columns can only be rendered with `horizontal={false}` and will zig-zag like a `flexWrap` layout.
   * Items should all be the same height - masonry layouts are not supported.
   */
  numColumns?: number | undefined;

  /**
   * If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality.
   * Make sure to also set the refreshing prop correctly.
   */
  onRefresh?: (() => void) | null | undefined;

  /**
   * Called when the viewability of rows changes, as defined by the `viewablePercentThreshold` prop.
   */
  onViewableItemsChanged?:
    | ((info: {
        viewableItems: Array<ViewToken<ItemT>>;
        changed: Array<ViewToken<ItemT>>;
      }) => void)
    | null
    | undefined;

  /**
   * Set this true while waiting for new data from a refresh.
   */
  refreshing?: boolean | null | undefined;

  /**
   * Takes an item from data and renders it into the list. Typical usage:
   * ```
   * _renderItem = ({item}) => (
   *   <TouchableOpacity onPress={() => this._onPress(item)}>
   *     <Text>{item.title}</Text>
   *   </TouchableOpacity>
   * );
   * ...
   * <FlatList data={[{title: 'Title Text', key: 'item1'}]} renderItem={this._renderItem} />
   * ```
   * Provides additional metadata like `index` if you need it.
   */
  renderItem: ListRenderItem<ItemT> | null | undefined;

  /**
   * See `ViewabilityHelper` for flow type and further documentation.
   */
  viewabilityConfig?: ViewabilityConfig | undefined;

  /**
   * Note: may have bugs (missing content) in some circumstances - use at your own risk.
   *
   * This may improve scroll performance for large lists.
   */
  removeClippedSubviews?: boolean | undefined;

  /**
   * Controls the fading effect at the edges of the scroll content.
   *
   * A value greater than 0 will apply the fading effect, indicating more content is available
   * to scroll.
   *
   * You can specify a single number to apply the same fading length to both edges.
   * Alternatively, use an object with `start` and `end` properties to set different
   * fading lengths for the start and end of the scroll content.
   *
   * The default value is 0.
   *
   * @platform android
   */
  fadingEdgeLength?: number | {start: number; end: number} | undefined;
}

export abstract class FlatListComponent<
  ItemT,
  Props,
> extends React.Component<Props> {
  /**
   * Scrolls to the end of the content. May be janky without `getItemLayout` prop.
   */
  scrollToEnd: (params?: {animated?: boolean | null | undefined}) => void;

  /**
   * Scrolls to the item at the specified index such that it is positioned in the viewable area
   * such that viewPosition 0 places it at the top, 1 at the bottom, and 0.5 centered in the middle.
   * Cannot scroll to locations outside the render window without specifying the getItemLayout prop.
   */
  scrollToIndex: (params: {
    animated?: boolean | null | undefined;
    index: number;
    viewOffset?: number | undefined;
    viewPosition?: number | undefined;
  }) => void;

  /**
   * Requires linear scan through data - use `scrollToIndex` instead if possible.
   * May be janky without `getItemLayout` prop.
   */
  scrollToItem: (params: {
    animated?: boolean | null | undefined;
    item: ItemT;
    viewOffset?: number | undefined;
    viewPosition?: number | undefined;
  }) => void;

  /**
   * Scroll to a specific content pixel offset, like a normal `ScrollView`.
   */
  scrollToOffset: (params: {
    animated?: boolean | null | undefined;
    offset: number;
  }) => void;

  /**
   * Tells the list an interaction has occurred, which should trigger viewability calculations,
   * e.g. if waitForInteractions is true and the user has not scrolled. This is typically called
   * by taps on items or by navigation actions.
   */
  recordInteraction: () => void;

  /**
   * Displays the scroll indicators momentarily.
   */
  flashScrollIndicators: () => void;

  /**
   * Provides a handle to the underlying scroll responder.
   */
  getScrollResponder: () => React.JSX.Element | null | undefined;

  /**
   * Returns a reference to the underlying native scroll view, or null if the
   * native instance is not mounted.
   */
  getNativeScrollRef: () => PublicScrollViewInstance | null;

  getScrollableNode: () => any;

  setNativeProps: (props: {[key: string]: unknown}) => void;
}

export class FlatList<ItemT = any> extends FlatListComponent<
  ItemT,
  FlatListProps<ItemT>
> {}
