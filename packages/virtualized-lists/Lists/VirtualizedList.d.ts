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
  StyleProp,
  ViewStyle,
  ScrollViewProps,
  LayoutChangeEvent,
  View,
  ScrollResponderMixin,
  ScrollView,
} from 'react-native';

export interface ViewToken<ItemT = any> {
  item: ItemT;
  key: string;
  index: number | null;
  isViewable: boolean;
  section?: any | undefined;
}

export interface ViewabilityConfig {
  /**
   * Minimum amount of time (in milliseconds) that an item must be physically viewable before the
   * viewability callback will be fired. A high number means that scrolling through content without
   * stopping will not mark the content as viewable.
   */
  minimumViewTime?: number | undefined;

  /**
   * Percent of viewport that must be covered for a partially occluded item to count as
   * "viewable", 0-100. Fully visible items are always considered viewable. A value of 0 means
   * that a single pixel in the viewport makes the item viewable, and a value of 100 means that
   * an item must be either entirely visible or cover the entire viewport to count as viewable.
   */
  viewAreaCoveragePercentThreshold?: number | undefined;

  /**
   * Similar to `viewAreaCoveragePercentThreshold`, but considers the percent of the item that is visible,
   * rather than the fraction of the viewable area it covers.
   */
  itemVisiblePercentThreshold?: number | undefined;

  /**
   * Nothing is considered viewable until the user scrolls or `recordInteraction` is called after
   * render.
   */
  waitForInteraction?: boolean | undefined;
}

export interface ViewabilityConfigCallbackPair {
  viewabilityConfig: ViewabilityConfig;
  onViewableItemsChanged:
    | ((info: {
        viewableItems: Array<ViewToken>;
        changed: Array<ViewToken>;
      }) => void)
    | null;
}

export type ViewabilityConfigCallbackPairs = ViewabilityConfigCallbackPair[];

/**
 * @see https://reactnative.dev/docs/flatlist#props
 */

export interface ListRenderItemInfo<ItemT> {
  item: ItemT;

  index: number;

  separators: {
    highlight: () => void;
    unhighlight: () => void;
    updateProps: (select: 'leading' | 'trailing', newProps: any) => void;
  };
}

export type ListRenderItem<ItemT> = (
  info: ListRenderItemInfo<ItemT>,
) => React.ReactElement | null;

export interface CellRendererProps<ItemT> {
  cellKey: string;
  children: React.ReactNode;
  index: number;
  item: ItemT;
  onFocusCapture?: ((event: FocusEvent) => void) | undefined;
  onLayout?: ((event: LayoutChangeEvent) => void) | undefined;
  style: StyleProp<ViewStyle> | undefined;
}

/**
 * @see https://reactnative.dev/docs/virtualizedlist
 */
export class VirtualizedList<ItemT> extends React.Component<
  VirtualizedListProps<ItemT>
> {
  scrollToEnd: (params?: {animated?: boolean | undefined}) => void;
  scrollToIndex: (params: {
    animated?: boolean | undefined;
    index: number;
    viewOffset?: number | undefined;
    viewPosition?: number | undefined;
  }) => void;
  scrollToItem: (params: {
    animated?: boolean | undefined;
    item: ItemT;
    viewOffset?: number | undefined;
    viewPosition?: number | undefined;
  }) => void;

  /**
   * Scroll to a specific content pixel offset in the list.
   * Param `offset` expects the offset to scroll to. In case of horizontal is true, the
   * offset is the x-value, in any other case the offset is the y-value.
   * Param `animated` (true by default) defines whether the list should do an animation while scrolling.
   */
  scrollToOffset: (params: {
    animated?: boolean | undefined;
    offset: number;
  }) => void;

  recordInteraction: () => void;

  getScrollRef: () =>
    | React.ComponentRef<typeof ScrollView>
    | React.ComponentRef<typeof View>
    | null;

  getScrollResponder: () => ScrollResponderMixin | null;
}

/**
 * @see https://reactnative.dev/docs/virtualizedlist#props
 */

export interface VirtualizedListProps<
  ItemT,
> extends VirtualizedListWithoutRenderItemProps<ItemT> {
  renderItem: ListRenderItem<ItemT> | null | undefined;
}

export interface VirtualizedListWithoutRenderItemProps<
  ItemT,
> extends ScrollViewProps {
  /**
   * Rendered in between each item, but not at the top or bottom
   */
  ItemSeparatorComponent?:
    React.ComponentType<any> | React.ReactElement | null | undefined;

  /**
   * Rendered when the list is empty. Can be a React Component Class, a render function, or
   * a rendered element.
   */
  ListEmptyComponent?:
    React.ComponentType<any> | React.ReactElement | null | undefined;

  /**
   * Rendered at the bottom of all the items. Can be a React Component Class, a render function, or
   * a rendered element.
   */
  ListFooterComponent?:
    React.ComponentType<any> | React.ReactElement | null | undefined;

  /**
   * Styling for internal View for ListFooterComponent
   */
  ListFooterComponentStyle?: StyleProp<ViewStyle> | undefined;

  /**
   * Rendered at the top of all the items. Can be a React Component Class, a render function, or
   * a rendered element.
   */
  ListHeaderComponent?:
    React.ComponentType<any> | React.ReactElement | null | undefined;

  /**
   * Styling for internal View for ListHeaderComponent
   */
  ListHeaderComponentStyle?: StyleProp<ViewStyle> | undefined;

  /**
   * The default accessor functions assume this is an Array<{key: string}> but you can override
   * getItem, getItemCount, and keyExtractor to handle any type of index-based data.
   */
  data?: any | undefined;

  /**
   * `debug` will turn on extra logging and visual overlays to aid with debugging both usage and
   * implementation, but with a significant perf hit.
   */
  debug?: boolean | undefined;

  /**
   * DEPRECATED: Virtualization provides significant performance and memory optimizations, but fully
   * unmounts react instances that are outside of the render window. You should only need to disable
   * this for debugging purposes.
   */
  disableVirtualization?: boolean | undefined;

  /**
   * A marker property for telling the list to re-render (since it implements `PureComponent`). If
   * any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the
   * `data` prop, stick it here and treat it immutably.
   */
  extraData?: any | undefined;

  /**
   * A generic accessor for extracting an item from any sort of data blob.
   */
  getItem?: ((data: any, index: number) => ItemT) | undefined;

  /**
   * Determines how many items are in the data blob.
   */
  getItemCount?: ((data: any) => number) | undefined;

  getItemLayout?:
    | ((
        data: any,
        index: number,
      ) => {
        length: number;
        offset: number;
        index: number;
      })
    | undefined;

  horizontal?: boolean | null | undefined;

  /**
   * How many items to render in the initial batch. This should be enough to fill the screen but not
   * much more. Note these items will never be unmounted as part of the windowed rendering in order
   * to improve perceived performance of scroll-to-top actions.
   */
  initialNumToRender?: number | undefined;

  /**
   * Instead of starting at the top with the first item, start at `initialScrollIndex`. This
   * disables the "scroll to top" optimization that keeps the first `initialNumToRender` items
   * always rendered and immediately renders the items starting at this initial index. Requires
   * `getItemLayout` to be implemented.
   */
  initialScrollIndex?: number | null | undefined;

  /**
   * Reverses the direction of scroll. Uses scale transforms of -1.
   */
  inverted?: boolean | null | undefined;

  keyExtractor?: ((item: ItemT, index: number) => string) | undefined;

  /**
   * The maximum number of items to render in each incremental render batch. The more rendered at
   * once, the better the fill rate, but responsiveness may suffer because rendering content may
   * interfere with responding to button taps or other interactions.
   */
  maxToRenderPerBatch?: number | undefined;

  /**
   * Called once when the scroll position gets within within `onEndReachedThreshold`
   * from the logical end of the list.
   */
  onEndReached?: ((info: {distanceFromEnd: number}) => void) | null | undefined;

  /**
   * How far from the end (in units of visible length of the list) the trailing edge of the
   * list must be from the end of the content to trigger the `onEndReached` callback.
   * Thus, a value of 0.5 will trigger `onEndReached` when the end of the content is
   * within half the visible length of the list.
   */
  onEndReachedThreshold?: number | null | undefined;

  onLayout?: ((event: LayoutChangeEvent) => void) | undefined;

  /**
   * If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make
   * sure to also set the `refreshing` prop correctly.
   */
  onRefresh?: (() => void) | null | undefined;

  /**
   * Used to handle failures when scrolling to an index that has not been measured yet.
   * Recommended action is to either compute your own offset and `scrollTo` it, or scroll as far
   * as possible and then try again after more items have been rendered.
   */
  onScrollToIndexFailed?:
    | ((info: {
        index: number;
        highestMeasuredFrameIndex: number;
        averageItemLength: number;
      }) => void)
    | undefined;

  /**
   * Called once when the scroll position gets within within `onStartReachedThreshold`
   * from the logical start of the list.
   */
  onStartReached?:
    ((info: {distanceFromStart: number}) => void) | null | undefined;

  /**
   * How far from the start (in units of visible length of the list) the leading edge of the
   * list must be from the start of the content to trigger the `onStartReached` callback.
   * Thus, a value of 0.5 will trigger `onStartReached` when the start of the content is
   * within half the visible length of the list.
   */
  onStartReachedThreshold?: number | null | undefined;

  /**
   * Called when the viewability of rows changes, as defined by the
   * `viewabilityConfig` prop.
   */
  onViewableItemsChanged?:
    | ((info: {
        viewableItems: Array<ViewToken<ItemT>>;
        changed: Array<ViewToken<ItemT>>;
      }) => void)
    | null
    | undefined;

  /**
   * Set this when offset is needed for the loading indicator to show correctly.
   * @platform android
   */
  progressViewOffset?: number | undefined;

  /**
   * Set this true while waiting for new data from a refresh.
   */
  refreshing?: boolean | null | undefined;

  /**
   * Note: may have bugs (missing content) in some circumstances - use at your own risk.
   *
   * This may improve scroll performance for large lists.
   */
  removeClippedSubviews?: boolean | undefined;

  /**
   * Render a custom scroll component, e.g. with a differently styled `RefreshControl`.
   */
  renderScrollComponent?:
    | ((props: ScrollViewProps) => React.ReactElement<ScrollViewProps>)
    | undefined;

  /**
   * Amount of time between low-pri item render batches, e.g. for rendering items quite a ways off
   * screen. Similar fill rate/responsiveness tradeoff as `maxToRenderPerBatch`.
   */
  updateCellsBatchingPeriod?: number | undefined;

  viewabilityConfig?: ViewabilityConfig | undefined;

  viewabilityConfigCallbackPairs?: ViewabilityConfigCallbackPairs | undefined;

  /**
   * Determines the maximum number of items rendered outside of the visible area, in units of
   * visible lengths. So if your list fills the screen, then `windowSize={21}` (the default) will
   * render the visible screen area plus up to 10 screens above and 10 below the viewport. Reducing
   * this number will reduce memory consumption and may improve performance, but will increase the
   * chance that fast scrolling may reveal momentary blank areas of unrendered content.
   */
  windowSize?: number | undefined;

  /**
   * CellRendererComponent allows customizing how cells rendered by
   * `renderItem`/`ListItemComponent` are wrapped when placed into the
   * underlying ScrollView. This component must accept event handlers which
   * notify VirtualizedList of changes within the cell.
   */
  CellRendererComponent?:
    React.ComponentType<CellRendererProps<ItemT>> | null | undefined;
}
