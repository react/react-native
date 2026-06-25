/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {
  ViewabilityConfig,
  ViewabilityConfigCallbackPair,
  ViewToken,
} from './ViewabilityHelper';
import type {
  FocusEvent,
  LayoutChangeEvent,
  ScrollViewProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

import * as React from 'react';

export type Item = any;

export type Separators = {
  highlight: () => void,
  unhighlight: () => void,
  updateProps: (select: 'leading' | 'trailing', newProps: Object) => void,
  ...
};

export type ListRenderItemInfo<ItemT> = {
  item: ItemT,
  index: number,
  separators: Separators,
  ...
};

export type CellRendererProps<ItemT> = Readonly<{
  cellKey: string,
  children: React.Node,
  index: number,
  item: ItemT,
  onFocusCapture?: (event: FocusEvent) => void,
  onLayout?: (event: LayoutChangeEvent) => void,
  style: StyleProp<ViewStyle>,
}>;

export type ListRenderItem<ItemT> = (
  info: ListRenderItemInfo<ItemT>,
) => React.Node;

type RequiredVirtualizedListProps = {
  /**
   * The default accessor functions assume this is an Array<{key: string} | {id: string}> but you can override
   * getItem, getItemCount, and keyExtractor to handle any type of index-based data.
   */
  data?: any,
  /**
   * A generic accessor for extracting an item from any sort of data blob.
   */
  getItem: (data: any, index: number) => ?Item,
  /**
   * Determines how many items are in the data blob.
   */
  getItemCount: (data: any) => number,
};
type OptionalVirtualizedListProps = {
  renderItem?: ?ListRenderItem<Item>,
  /**
   * `debug` will turn on extra logging and visual overlays to aid with debugging both usage and
   * implementation, but with a significant perf hit.
   */
  debug?: ?boolean,
  /**
   * DEPRECATED: Virtualization provides significant performance and memory optimizations, but fully
   * unmounts react instances that are outside of the render window. You should only need to disable
   * this for debugging purposes. Defaults to false.
   */
  disableVirtualization?: ?boolean,
  /**
   * A marker property for telling the list to re-render (since it implements `PureComponent`). If
   * any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the
   * `data` prop, stick it here and treat it immutably.
   */
  extraData?: any,
  // e.g. height, y
  getItemLayout?: (
    data: any,
    index: number,
  ) => {
    length: number,
    offset: number,
    index: number,
    ...
  },
  horizontal?: ?boolean,
  /**
   * How many items to render in the initial batch. This should be enough to fill the screen but not
   * much more. Note these items will never be unmounted as part of the windowed rendering in order
   * to improve perceived performance of scroll-to-top actions.
   */
  initialNumToRender?: ?number,
  /**
   * Instead of starting at the top with the first item, start at `initialScrollIndex`. This
   * disables the "scroll to top" optimization that keeps the first `initialNumToRender` items
   * always rendered and immediately renders the items starting at this initial index. Requires
   * `getItemLayout` to be implemented.
   */
  initialScrollIndex?: ?number,
  /**
   * Reverses the direction of scroll. Uses scale transforms of -1.
   */
  inverted?: ?boolean,
  keyExtractor?: ?(item: Item, index: number) => string,
  /**
   * CellRendererComponent allows customizing how cells rendered by
   * `renderItem`/`ListItemComponent` are wrapped when placed into the
   * underlying ScrollView. This component must accept event handlers which
   * notify VirtualizedList of changes within the cell.
   */
  CellRendererComponent?: ?React.ComponentType<CellRendererProps<Item>>,
  /**
   * Rendered in between each item, but not at the top or bottom. By default, `highlighted` and
   * `leadingItem` props are provided. `renderItem` provides `separators.highlight`/`unhighlight`
   * which will update the `highlighted` prop, but you can also add custom props with
   * `separators.updateProps`.
   */
  ItemSeparatorComponent?: ?(React.ComponentType<any> | React.MixedElement),
  /**
   * Takes an item from `data` and renders it into the list. Example usage:
   *
   *     <FlatList
   *       ItemSeparatorComponent={Platform.OS !== 'android' && ({highlighted}) => (
   *         <View style={[style.separator, highlighted && {marginLeft: 0}]} />
   *       )}
   *       data={[{title: 'Title Text', key: 'item1'}]}
   *       ListItemComponent={({item, separators}) => (
   *         <TouchableHighlight
   *           onPress={() => this._onPress(item)}
   *           onShowUnderlay={separators.highlight}
   *           onHideUnderlay={separators.unhighlight}>
   *           <View style={{backgroundColor: 'white'}}>
   *             <Text>{item.title}</Text>
   *           </View>
   *         </TouchableHighlight>
   *       )}
   *     />
   *
   * Provides additional metadata like `index` if you need it, as well as a more generic
   * `separators.updateProps` function which let's you set whatever props you want to change the
   * rendering of either the leading separator or trailing separator in case the more common
   * `highlight` and `unhighlight` (which set the `highlighted: boolean` prop) are insufficient for
   * your use-case.
   */
  ListItemComponent?: ?(React.ComponentType<any> | React.MixedElement),
  /**
   * Rendered when the list is empty. Can be a React Component Class, a render function, or
   * a rendered element.
   */
  ListEmptyComponent?: ?(React.ComponentType<any> | React.MixedElement),
  /**
   * Rendered at the bottom of all the items. Can be a React Component Class, a render function, or
   * a rendered element.
   */
  ListFooterComponent?: ?(React.ComponentType<any> | React.MixedElement),
  /**
   * Styling for internal View for ListFooterComponent
   */
  ListFooterComponentStyle?: StyleProp<ViewStyle>,
  /**
   * Rendered at the top of all the items. Can be a React Component Class, a render function, or
   * a rendered element.
   */
  ListHeaderComponent?: ?(React.ComponentType<any> | React.MixedElement),
  /**
   * Styling for internal View for ListHeaderComponent
   */
  ListHeaderComponentStyle?: StyleProp<ViewStyle>,
  /**
   * The maximum number of items to render in each incremental render batch. The more rendered at
   * once, the better the fill rate, but responsiveness may suffer because rendering content may
   * interfere with responding to button taps or other interactions.
   */
  maxToRenderPerBatch?: ?number,
  /**
   * Called once when the scroll position gets within within `onEndReachedThreshold`
   * from the logical end of the list.
   */
  onEndReached?: ?(info: {distanceFromEnd: number, ...}) => void,
  /**
   * How far from the end (in units of visible length of the list) the trailing edge of the
   * list must be from the end of the content to trigger the `onEndReached` callback.
   * Thus, a value of 0.5 will trigger `onEndReached` when the end of the content is
   * within half the visible length of the list.
   */
  onEndReachedThreshold?: ?number,
  /**
   * If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make
   * sure to also set the `refreshing` prop correctly.
   */
  onRefresh?: ?() => void,
  /**
   * Used to handle failures when scrolling to an index that has not been measured yet. Recommended
   * action is to either compute your own offset and `scrollTo` it, or scroll as far as possible and
   * then try again after more items have been rendered.
   */
  onScrollToIndexFailed?: ?(info: {
    index: number,
    highestMeasuredFrameIndex: number,
    averageItemLength: number,
    ...
  }) => void,
  /**
   * Called once when the scroll position gets within within `onStartReachedThreshold`
   * from the logical start of the list.
   */
  onStartReached?: ?(info: {distanceFromStart: number, ...}) => void,
  /**
   * How far from the start (in units of visible length of the list) the leading edge of the
   * list must be from the start of the content to trigger the `onStartReached` callback.
   * Thus, a value of 0.5 will trigger `onStartReached` when the start of the content is
   * within half the visible length of the list.
   */
  onStartReachedThreshold?: ?number,
  /**
   * Called when the viewability of rows changes, as defined by the
   * `viewabilityConfig` prop.
   */
  onViewableItemsChanged?: ?(info: {
    viewableItems: Array<ViewToken>,
    changed: Array<ViewToken>,
    ...
  }) => void,
  persistentScrollbar?: ?boolean,
  /**
   * Set this when offset is needed for the loading indicator to show correctly.
   */
  progressViewOffset?: number,
  /**
   * A custom refresh control element. When set, it overrides the default
   * <RefreshControl> component built internally. The onRefresh and refreshing
   * props are also ignored. Only works for vertical VirtualizedList.
   */
  refreshControl?: ?React.MixedElement,
  /**
   * Set this true while waiting for new data from a refresh.
   */
  refreshing?: ?boolean,
  /**
   * Note: may have bugs (missing content) in some circumstances - use at your own risk.
   *
   * This may improve scroll performance for large lists.
   */
  removeClippedSubviews?: boolean,
  /**
   * Render a custom scroll component, e.g. with a differently styled `RefreshControl`.
   */
  renderScrollComponent?: (props: ScrollViewProps) => React.MixedElement,
  /**
   * Amount of time between low-pri item render batches, e.g. for rendering items quite a ways off
   * screen. Similar fill rate/responsiveness tradeoff as `maxToRenderPerBatch`.
   */
  updateCellsBatchingPeriod?: ?number,
  /**
   * See `ViewabilityHelper` for flow type and further documentation.
   */
  viewabilityConfig?: ViewabilityConfig,
  /**
   * List of ViewabilityConfig/onViewableItemsChanged pairs. A specific onViewableItemsChanged
   * will be called when its corresponding ViewabilityConfig's conditions are met.
   */
  viewabilityConfigCallbackPairs?: Array<ViewabilityConfigCallbackPair>,
  /**
   * Determines the maximum number of items rendered outside of the visible area, in units of
   * visible lengths. So if your list fills the screen, then `windowSize={21}` (the default) will
   * render the visible screen area plus up to 10 screens above and 10 below the viewport. Reducing
   * this number will reduce memory consumption and may improve performance, but will increase the
   * chance that fast scrolling may reveal momentary blank areas of unrendered content.
   */
  windowSize?: ?number,
};

export type VirtualizedListProps = {
  ...ScrollViewProps,
  ...RequiredVirtualizedListProps,
  ...OptionalVirtualizedListProps,
};

/**
 * Default Props Helper Functions
 * Use the following helper functions for default values
 */

// horizontalOrDefault(this.props.horizontal)
export function horizontalOrDefault(horizontal: ?boolean): boolean {
  return horizontal ?? false;
}

// initialNumToRenderOrDefault(this.props.initialNumToRender)
export function initialNumToRenderOrDefault(
  initialNumToRender: ?number,
): number {
  return initialNumToRender ?? 10;
}

// maxToRenderPerBatchOrDefault(this.props.maxToRenderPerBatch)
export function maxToRenderPerBatchOrDefault(
  maxToRenderPerBatch: ?number,
): number {
  return maxToRenderPerBatch ?? 10;
}

// onStartReachedThresholdOrDefault(this.props.onStartReachedThreshold)
export function onStartReachedThresholdOrDefault(
  onStartReachedThreshold: ?number,
): number {
  return onStartReachedThreshold ?? 2;
}

// onEndReachedThresholdOrDefault(this.props.onEndReachedThreshold)
export function onEndReachedThresholdOrDefault(
  onEndReachedThreshold: ?number,
): number {
  return onEndReachedThreshold ?? 2;
}

// windowSizeOrDefault(this.props.windowSize)
export function windowSizeOrDefault(windowSize: ?number): number {
  return windowSize ?? 21;
}
