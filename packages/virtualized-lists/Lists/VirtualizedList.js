/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {CellMetricProps, ListOrientation} from './ListMetricsAggregator';
import type {ViewToken} from './ViewabilityHelper';
import type {
  Item,
  ListRenderItem,
  ListRenderItemInfo,
  Separators,
  VirtualizedListProps,
} from './VirtualizedListProps';
import type {
  LayoutChangeEvent,
  ScrollEvent,
  ScrollResponderType,
  StyleProp,
  ViewStyle,
} from 'react-native';

import clamp from '../Utilities/clamp';
import infoLog from '../Utilities/infoLog';
import {CellRenderMask} from './CellRenderMask';
import ChildListCollection from './ChildListCollection';
import FillRateHelper from './FillRateHelper';
import ListMetricsAggregator from './ListMetricsAggregator';
import StateSafePureComponent from './StateSafePureComponent';
import ViewabilityHelper from './ViewabilityHelper';
import CellRenderer from './VirtualizedListCellRenderer';
import {
  VirtualizedListCellContextProvider,
  VirtualizedListContext,
  VirtualizedListContextProvider,
} from './VirtualizedListContext.js';
import {
  horizontalOrDefault,
  initialNumToRenderOrDefault,
  maxToRenderPerBatchOrDefault,
  onEndReachedThresholdOrDefault,
  onStartReachedThresholdOrDefault,
  windowSizeOrDefault,
} from './VirtualizedListProps';
import {
  computeWindowedRenderLimits,
  keyExtractor as defaultKeyExtractor,
} from './VirtualizeUtils';
import invariant from 'invariant';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {cloneElement, isValidElement} from 'react';
import {
  I18nManager,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  findNodeHandle,
} from 'react-native';
import * as ReactNativeFeatureFlags from 'react-native/src/private/featureflags/ReactNativeFeatureFlags';

export type {ListRenderItemInfo, ListRenderItem, Separators};

const ON_EDGE_REACHED_EPSILON = 0.001;

let _usedIndexForKey = false;
let _keylessItemComponentName: string = '';

type ViewabilityHelperCallbackTuple = {
  viewabilityHelper: ViewabilityHelper,
  onViewableItemsChanged: (info: {
    viewableItems: Array<ViewToken>,
    changed: Array<ViewToken>,
    ...
  }) => void,
  ...
};

type State = {
  renderMask: CellRenderMask,
  cellsAroundViewport: {first: number, last: number},
  // Used to track items added at the start of the list for maintainVisibleContentPosition.
  firstVisibleItemKey: ?string,
  // When > 0 the scroll position available in JS is considered stale and should not be used.
  pendingScrollUpdateCount: number,
};

function getScrollingThreshold(threshold: number, visibleLength: number) {
  return (threshold * visibleLength) / 2;
}

/**
 * Base implementation for the more convenient [`<FlatList>`](https://reactnative.dev/docs/flatlist)
 * and [`<SectionList>`](https://reactnative.dev/docs/sectionlist) components, which are also better
 * documented. In general, this should only really be used if you need more flexibility than
 * `FlatList` provides, e.g. for use with immutable data instead of plain arrays.
 *
 * Virtualization massively improves memory consumption and performance of large lists by
 * maintaining a finite render window of active items and replacing all items outside of the render
 * window with appropriately sized blank space. The window adapts to scrolling behavior, and items
 * are rendered incrementally with low-pri (after any running interactions) if they are far from the
 * visible area, or with hi-pri otherwise to minimize the potential of seeing blank space.
 *
 * Some caveats:
 *
 * - Internal state is not preserved when content scrolls out of the render window. Make sure all
 *   your data is captured in the item data or external stores like Flux, Redux, or Relay.
 * - This is a `PureComponent` which means that it will not re-render if `props` remain shallow-
 *   equal. Make sure that everything your `renderItem` function depends on is passed as a prop
 *   (e.g. `extraData`) that is not `===` after updates, otherwise your UI may not update on
 *   changes. This includes the `data` prop and parent component state.
 * - In order to constrain memory and enable smooth scrolling, content is rendered asynchronously
 *   offscreen. This means it's possible to scroll faster than the fill rate ands momentarily see
 *   blank content. This is a tradeoff that can be adjusted to suit the needs of each application,
 *   and we are working on improving it behind the scenes.
 * - By default, the list looks for a `key` or `id` prop on each item and uses that for the React key.
 *   Alternatively, you can provide a custom `keyExtractor` prop.
 * - As an effort to remove defaultProps, use helper functions when referencing certain props
 *
 */
class VirtualizedList extends StateSafePureComponent<
  VirtualizedListProps,
  State,
> {
  static contextType: typeof VirtualizedListContext = VirtualizedListContext;

  // scrollToEnd may be janky without getItemLayout prop
  scrollToEnd(params?: ?{animated?: ?boolean, ...}) {
    const animated = params ? params.animated : true;
    const veryLast = this.props.getItemCount(this.props.data) - 1;
    if (veryLast < 0) {
      return;
    }
    const frame = this._listMetrics.getCellMetricsApprox(veryLast, this.props);
    const offset = Math.max(
      0,
      frame.offset +
        frame.length +
        this._footerLength -
        this._scrollMetrics.visibleLength,
    );

    // TODO: consider using `ref.scrollToEnd` directly
    this.scrollToOffset({animated, offset});
  }

  // scrollToIndex may be janky without getItemLayout prop
  scrollToIndex(params: {
    animated?: ?boolean,
    index: number,
    viewOffset?: number,
    viewPosition?: number,
    ...
  }): $FlowFixMe {
    const {data, getItemCount, getItemLayout, onScrollToIndexFailed} =
      this.props;
    const {animated, index, viewOffset, viewPosition} = params;
    invariant(
      index >= 0,
      `scrollToIndex out of range: requested index ${index} but minimum is 0`,
    );
    invariant(
      getItemCount(data) >= 1,
      `scrollToIndex out of range: item length ${getItemCount(data)} but minimum is 1`,
    );
    invariant(
      index < getItemCount(data),
      `scrollToIndex out of range: requested index ${index} is out of 0 to ${
        getItemCount(data) - 1
      }`,
    );
    if (
      !getItemLayout &&
      index > this._listMetrics.getHighestMeasuredCellIndex()
    ) {
      invariant(
        !!onScrollToIndexFailed,
        'scrollToIndex should be used in conjunction with getItemLayout or onScrollToIndexFailed, ' +
          'otherwise there is no way to know the location of offscreen indices or handle failures.',
      );
      onScrollToIndexFailed({
        averageItemLength: this._listMetrics.getAverageCellLength(),
        highestMeasuredFrameIndex:
          this._listMetrics.getHighestMeasuredCellIndex(),
        index,
      });
      return;
    }
    const frame = this._listMetrics.getCellMetricsApprox(
      Math.floor(index),
      this.props,
    );
    const offset =
      Math.max(
        0,
        this._listMetrics.getCellOffsetApprox(index, this.props) -
          (viewPosition || 0) *
            (this._scrollMetrics.visibleLength - frame.length),
      ) - (viewOffset || 0);

    this.scrollToOffset({offset, animated});
  }

  // scrollToItem may be janky without getItemLayout prop. Required linear scan through items -
  // use scrollToIndex instead if possible.
  scrollToItem(params: {
    animated?: ?boolean,
    item: Item,
    viewOffset?: number,
    viewPosition?: number,
    ...
  }) {
    const {item} = params;
    const {data, getItem, getItemCount} = this.props;
    const itemCount = getItemCount(data);
    for (let index = 0; index < itemCount; index++) {
      if (getItem(data, index) === item) {
        this.scrollToIndex({...params, index});
        break;
      }
    }
  }

  /**
   * Scroll to a specific content pixel offset in the list.
   *
   * Param `offset` expects the offset to scroll to.
   * In case of `horizontal` is true, the offset is the x-value,
   * in any other case the offset is the y-value.
   *
   * Param `animated` (`true` by default) defines whether the list
   * should do an animation while scrolling.
   */
  scrollToOffset(params: {animated?: ?boolean, offset: number, ...}) {
    const {animated, offset} = params;
    const scrollRef = this._scrollRef;

    if (scrollRef == null) {
      return;
    }

    if (scrollRef.scrollTo == null) {
      console.warn(
        'No scrollTo method provided. This may be because you have two nested ' +
          'VirtualizedLists with the same orientation, or because you are ' +
          'using a custom component that does not implement scrollTo.',
      );
      return;
    }

    const {horizontal, rtl} = this._orientation();
    if (horizontal && rtl && !this._listMetrics.hasContentLength()) {
      console.warn(
        'scrollToOffset may not be called in RTL before content is laid out',
      );
      return;
    }

    // $FlowFixMe[incompatible-type]
    scrollRef.scrollTo({
      animated,
      ...this._scrollToParamsFromOffset(offset),
    });
  }

  _scrollToParamsFromOffset(offset: number): {x?: number, y?: number} {
    const {horizontal, rtl} = this._orientation();
    if (horizontal && rtl) {
      // Add the visible length of the scrollview so that the offset is right-aligned
      const cartOffset = this._listMetrics.cartesianOffset(
        offset + this._scrollMetrics.visibleLength,
      );
      /* $FlowFixMe[constant-condition] Error discovered during Constant
       * Condition roll out. See https://fburl.com/workplace/1v97vimq. */
      return horizontal ? {x: cartOffset} : {y: cartOffset};
    } else {
      return horizontal ? {x: offset} : {y: offset};
    }
  }

  recordInteraction() {
    this._nestedChildLists.forEach(childList => {
      childList.recordInteraction();
    });
    this._viewabilityTuples.forEach(t => {
      t.viewabilityHelper.recordInteraction();
    });
    this._updateViewableItems(this.props, this.state.cellsAroundViewport);
  }

  flashScrollIndicators() {
    if (this._scrollRef == null) {
      return;
    }

    this._scrollRef.flashScrollIndicators();
  }

  /**
   * Provides a handle to the underlying scroll responder.
   * Note that `this._scrollRef` might not be a `ScrollView`, so we
   * need to check that it responds to `getScrollResponder` before calling it.
   */
  getScrollResponder(): ?ScrollResponderType {
    if (this._scrollRef && this._scrollRef.getScrollResponder) {
      return this._scrollRef.getScrollResponder();
    }
  }

  getScrollableNode(): ?number {
    if (this._scrollRef && this._scrollRef.getScrollableNode) {
      return this._scrollRef.getScrollableNode();
    } else {
      return findNodeHandle<$FlowFixMe>(this._scrollRef);
    }
  }

  getScrollRef(): ?React.ElementRef<typeof ScrollView> {
    // $FlowFixMe[prop-missing]
    if (this._scrollRef && this._scrollRef.getScrollRef) {
      // $FlowFixMe[not-a-function]
      return this._scrollRef.getScrollRef();
    } else {
      return this._scrollRef;
    }
  }

  setNativeProps(props: Object) {
    if (this._scrollRef) {
      this._scrollRef.setNativeProps(props);
    }
  }

  _getCellKey(): string {
    return this.context?.cellKey || 'rootList';
  }

  // $FlowFixMe[missing-local-annot]
  _getScrollMetrics = () => {
    return this._scrollMetrics;
  };

  hasMore(): boolean {
    return this._hasMore;
  }

  // $FlowFixMe[missing-local-annot]
  _getOutermostParentListRef = () => {
    if (this._isNestedWithSameOrientation()) {
      return this.context.getOutermostParentListRef();
    } else {
      return this;
    }
  };

  _registerAsNestedChild = (childList: {
    cellKey: string,
    ref: VirtualizedList,
  }): void => {
    this._nestedChildLists.add(childList.ref, childList.cellKey);
    if (this._hasInteracted) {
      childList.ref.recordInteraction();
    }
  };

  _unregisterAsNestedChild = (childList: {ref: VirtualizedList}): void => {
    this._nestedChildLists.remove(childList.ref);
  };

  state: State;

  constructor(props: VirtualizedListProps) {
    super(props);
    this._checkProps(props);

    this._fillRateHelper = new FillRateHelper(this._listMetrics);

    if (this.props.viewabilityConfigCallbackPairs) {
      this._viewabilityTuples = this.props.viewabilityConfigCallbackPairs.map(
        pair => ({
          viewabilityHelper: new ViewabilityHelper(pair.viewabilityConfig),
          onViewableItemsChanged: pair.onViewableItemsChanged,
        }),
      );
    } else {
      const {onViewableItemsChanged, viewabilityConfig} = this.props;
      if (onViewableItemsChanged) {
        this._viewabilityTuples.push({
          viewabilityHelper: new ViewabilityHelper(viewabilityConfig),
          onViewableItemsChanged: onViewableItemsChanged,
        });
      }
    }

    const initialRenderRegion = VirtualizedList._initialRenderRegion(props);

    const minIndexForVisible =
      this.props.maintainVisibleContentPosition?.minIndexForVisible ?? 0;

    this.state = {
      cellsAroundViewport: initialRenderRegion,
      renderMask: VirtualizedList._createRenderMask(props, initialRenderRegion),
      firstVisibleItemKey:
        this.props.getItemCount(this.props.data) > minIndexForVisible
          ? VirtualizedList._getItemKey(this.props, minIndexForVisible)
          : null,
      // When we have a non-zero initialScrollIndex, we will receive a
      // scroll event later so this will prevent the window from updating
      // until we get a valid offset.
      pendingScrollUpdateCount:
        this.props.initialScrollIndex != null &&
        this.props.initialScrollIndex > 0
          ? 1
          : 0,
    };
  }

  _checkProps(props: VirtualizedListProps) {
    const {onScroll, windowSize, getItemCount, data, initialScrollIndex} =
      props;

    invariant(
      // $FlowFixMe[prop-missing]
      !onScroll || !onScroll.__isNative,
      'Components based on VirtualizedList must be wrapped with Animated.createAnimatedComponent ' +
        'to support native onScroll events with useNativeDriver',
    );
    invariant(
      windowSizeOrDefault(windowSize) > 0,
      'VirtualizedList: The windowSize prop must be present and set to a value greater than 0.',
    );

    invariant(
      /* $FlowFixMe[constant-condition] Error discovered during Constant
       * Condition roll out. See https://fburl.com/workplace/1v97vimq. */
      getItemCount,
      'VirtualizedList: The "getItemCount" prop must be provided',
    );

    const itemCount = getItemCount(data);

    if (
      initialScrollIndex != null &&
      !this._hasTriggeredInitialScrollToIndex &&
      (initialScrollIndex < 0 ||
        (itemCount > 0 && initialScrollIndex >= itemCount)) &&
      !this._hasWarned.initialScrollIndex
    ) {
      console.warn(
        `initialScrollIndex "${initialScrollIndex}" is not valid (list has ${itemCount} items)`,
      );
      this._hasWarned.initialScrollIndex = true;
    }

    if (__DEV__ && !this._hasWarned.flexWrap) {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const flatStyles = StyleSheet.flatten(this.props.contentContainerStyle);
      if (flatStyles != null && flatStyles.flexWrap === 'wrap') {
        console.warn(
          '`flexWrap: `wrap`` is not supported with the `VirtualizedList` components.' +
            'Consider using `numColumns` with `FlatList` instead.',
        );
        this._hasWarned.flexWrap = true;
      }
    }
  }

  static _findItemIndexWithKey(
    props: VirtualizedListProps,
    key: string,
    hint: ?number,
  ): ?number {
    const itemCount = props.getItemCount(props.data);
    if (hint != null && hint >= 0 && hint < itemCount) {
      const curKey = VirtualizedList._getItemKey(props, hint);
      if (curKey === key) {
        return hint;
      }
    }
    for (let ii = 0; ii < itemCount; ii++) {
      const curKey = VirtualizedList._getItemKey(props, ii);
      if (curKey === key) {
        return ii;
      }
    }
    return null;
  }

  static _getItemKey(
    props: {
      data: VirtualizedListProps['data'],
      getItem: VirtualizedListProps['getItem'],
      keyExtractor: VirtualizedListProps['keyExtractor'],
      ...
    },
    index: number,
  ): string {
    const item = props.getItem(props.data, index);
    return VirtualizedList._keyExtractor(item, index, props);
  }

  static _createRenderMask(
    props: VirtualizedListProps,
    cellsAroundViewport: {first: number, last: number},
    additionalRegions?: ?ReadonlyArray<{first: number, last: number}>,
  ): CellRenderMask {
    const itemCount = props.getItemCount(props.data);

    invariant(
      cellsAroundViewport.first >= 0 &&
        cellsAroundViewport.last >= cellsAroundViewport.first - 1 &&
        cellsAroundViewport.last < itemCount,
      `Invalid cells around viewport "[${cellsAroundViewport.first}, ${cellsAroundViewport.last}]" was passed to VirtualizedList._createRenderMask`,
    );

    const renderMask = new CellRenderMask(itemCount);

    if (itemCount > 0) {
      const allRegions = [cellsAroundViewport, ...(additionalRegions ?? [])];
      for (const region of allRegions) {
        renderMask.addCells(region);
      }

      // The initially rendered cells are retained as part of the
      // "scroll-to-top" optimization
      if (props.initialScrollIndex == null || props.initialScrollIndex <= 0) {
        const initialRegion = VirtualizedList._initialRenderRegion(props);
        renderMask.addCells(initialRegion);
      }

      // The layout coordinates of sticky headers may be off-screen while the
      // actual header is on-screen. Keep the most recent before the viewport
      // rendered, even if its layout coordinates are not in viewport.
      const stickyHeaderIndices = props.stickyHeaderIndices;
      if (stickyHeaderIndices != null && stickyHeaderIndices.length > 0) {
        VirtualizedList._ensureClosestStickyHeader(
          props,
          stickyHeaderIndices,
          renderMask,
          cellsAroundViewport.first,
        );
      }
    }

    return renderMask;
  }

  static _initialRenderRegion(props: VirtualizedListProps): {
    first: number,
    last: number,
  } {
    const itemCount = props.getItemCount(props.data);

    const firstCellIndex = Math.max(
      0,
      Math.min(itemCount - 1, Math.floor(props.initialScrollIndex ?? 0)),
    );

    const lastCellIndex =
      Math.min(
        itemCount,
        firstCellIndex + initialNumToRenderOrDefault(props.initialNumToRender),
      ) - 1;

    return {
      first: firstCellIndex,
      last: lastCellIndex,
    };
  }

  static _ensureClosestStickyHeader(
    props: VirtualizedListProps,
    stickyHeaderIndices: ReadonlyArray<number>,
    renderMask: CellRenderMask,
    cellIdx: number,
  ) {
    const stickyOffset = props.ListHeaderComponent ? 1 : 0;
    const targetStickyIndex = cellIdx + stickyOffset;
    let closestStickyIndex = null;

    for (let itemIdx = 0; itemIdx < stickyHeaderIndices.length; itemIdx++) {
      const stickyIndex = stickyHeaderIndices[itemIdx];
      if (
        Number.isInteger(stickyIndex) &&
        stickyIndex < targetStickyIndex &&
        stickyIndex >= stickyOffset &&
        (closestStickyIndex == null || stickyIndex > closestStickyIndex)
      ) {
        closestStickyIndex = stickyIndex;
      }
    }

    if (closestStickyIndex != null) {
      const itemIdx = closestStickyIndex - stickyOffset;
      renderMask.addCells({first: itemIdx, last: itemIdx});
    }
  }

  _adjustCellsAroundViewport(
    props: VirtualizedListProps,
    cellsAroundViewport: {first: number, last: number},
    pendingScrollUpdateCount: number,
  ): {first: number, last: number} {
    const {data, getItemCount} = props;
    const onEndReachedThreshold = onEndReachedThresholdOrDefault(
      props.onEndReachedThreshold,
    );
    const {offset, visibleLength} = this._scrollMetrics;
    const contentLength = this._listMetrics.getContentLength();
    const distanceFromEnd = contentLength - visibleLength - offset;

    // Wait until the scroll view metrics have been set up. And until then,
    // we will trust the initialNumToRender suggestion
    if (visibleLength <= 0 || contentLength <= 0) {
      return cellsAroundViewport.last >= getItemCount(data)
        ? VirtualizedList._constrainToItemCount(cellsAroundViewport, props)
        : cellsAroundViewport;
    }

    let newCellsAroundViewport: {first: number, last: number};
    if (props.disableVirtualization) {
      const renderAhead =
        distanceFromEnd < onEndReachedThreshold * visibleLength
          ? maxToRenderPerBatchOrDefault(props.maxToRenderPerBatch)
          : 0;

      newCellsAroundViewport = {
        first: 0,
        last: Math.min(
          cellsAroundViewport.last + renderAhead,
          getItemCount(data) - 1,
        ),
      };
    } else {
      // If we have a pending scroll update, we should not adjust the render window as it
      // might override the correct window.
      if (pendingScrollUpdateCount > 0) {
        return cellsAroundViewport.last >= getItemCount(data)
          ? VirtualizedList._constrainToItemCount(cellsAroundViewport, props)
          : cellsAroundViewport;
      }

      newCellsAroundViewport = computeWindowedRenderLimits(
        props,
        maxToRenderPerBatchOrDefault(props.maxToRenderPerBatch),
        windowSizeOrDefault(props.windowSize),
        cellsAroundViewport,
        this._listMetrics,
        this._scrollMetrics,
      );
      invariant(
        newCellsAroundViewport.last < getItemCount(data),
        'computeWindowedRenderLimits() should return range in-bounds',
      );
    }

    if (this._nestedChildLists.size() > 0) {
      // If some cell in the new state has a child list in it, we should only render
      // up through that item, so that we give that list a chance to render.
      // Otherwise there's churn from multiple child lists mounting and un-mounting
      // their items.

      // Will this prevent rendering if the nested list doesn't realize the end?
      const childIdx = this._findFirstChildWithMore(
        newCellsAroundViewport.first,
        newCellsAroundViewport.last,
      );

      newCellsAroundViewport.last = childIdx ?? newCellsAroundViewport.last;
    }

    return newCellsAroundViewport;
  }

  _findFirstChildWithMore(first: number, last: number): number | null {
    for (let ii = first; ii <= last; ii++) {
      const cellKeyForIndex = this._indicesToKeys.get(ii);
      if (
        cellKeyForIndex != null &&
        this._nestedChildLists.anyInCell(cellKeyForIndex, childList =>
          childList.hasMore(),
        )
      ) {
        return ii;
      }
    }

    return null;
  }

  componentDidMount() {
    if (this._isNestedWithSameOrientation()) {
      this.context.registerAsNestedChild({
        ref: this,
        cellKey: this.context.cellKey,
      });
    }
  }

  componentWillUnmount() {
    if (this._isNestedWithSameOrientation()) {
      this.context.unregisterAsNestedChild({ref: this});
    }
    clearTimeout(this._updateCellsToRenderTimeoutID);
    this._viewabilityTuples.forEach(tuple => {
      tuple.viewabilityHelper.dispose();
    });
    this._fillRateHelper.deactivateAndFlush();
  }

  static getDerivedStateFromProps(
    newProps: VirtualizedListProps,
    prevState: State,
  ): State {
    // first and last could be stale (e.g. if a new, shorter items props is passed in), so we make
    // sure we're rendering a reasonable range here.
    const itemCount = newProps.getItemCount(newProps.data);
    if (itemCount === prevState.renderMask.numCells()) {
      return prevState;
    }

    let maintainVisibleContentPositionAdjustment: ?number = null;
    const prevFirstVisibleItemKey = prevState.firstVisibleItemKey;
    const minIndexForVisible =
      newProps.maintainVisibleContentPosition?.minIndexForVisible ?? 0;
    const newFirstVisibleItemKey =
      newProps.getItemCount(newProps.data) > minIndexForVisible
        ? VirtualizedList._getItemKey(newProps, minIndexForVisible)
        : null;
    if (
      newProps.maintainVisibleContentPosition != null &&
      prevFirstVisibleItemKey != null &&
      newFirstVisibleItemKey != null
    ) {
      if (newFirstVisibleItemKey !== prevFirstVisibleItemKey) {
        // Fast path if items were added at the start of the list.
        const hint =
          itemCount - prevState.renderMask.numCells() + minIndexForVisible;
        const firstVisibleItemIndex = VirtualizedList._findItemIndexWithKey(
          newProps,
          prevFirstVisibleItemKey,
          hint,
        );
        maintainVisibleContentPositionAdjustment =
          firstVisibleItemIndex != null
            ? firstVisibleItemIndex - minIndexForVisible
            : null;
      } else {
        maintainVisibleContentPositionAdjustment = null;
      }
    }

    const constrainedCells = VirtualizedList._constrainToItemCount(
      maintainVisibleContentPositionAdjustment != null
        ? {
            first:
              prevState.cellsAroundViewport.first +
              maintainVisibleContentPositionAdjustment,
            last:
              prevState.cellsAroundViewport.last +
              maintainVisibleContentPositionAdjustment,
          }
        : prevState.cellsAroundViewport,
      newProps,
    );

    return {
      cellsAroundViewport: constrainedCells,
      renderMask: VirtualizedList._createRenderMask(newProps, constrainedCells),
      firstVisibleItemKey: newFirstVisibleItemKey,
      pendingScrollUpdateCount:
        maintainVisibleContentPositionAdjustment != null
          ? prevState.pendingScrollUpdateCount + 1
          : prevState.pendingScrollUpdateCount,
    };
  }

  _pushCells(
    cells: Array<Object>,
    stickyHeaderIndices: Array<number>,
    stickyIndicesFromProps: Set<number>,
    first: number,
    last: number,
    inversionStyle: StyleProp<ViewStyle>,
  ) {
    const {
      CellRendererComponent,
      ItemSeparatorComponent,
      ListHeaderComponent,
      ListItemComponent,
      data,
      debug,
      getItem,
      getItemCount,
      getItemLayout,
      horizontal,
      renderItem,
    } = this.props;
    const stickyOffset = ListHeaderComponent ? 1 : 0;
    const end = getItemCount(data) - 1;
    let prevCellKey;
    last = Math.min(end, last);

    for (let ii = first; ii <= last; ii++) {
      const item = getItem(data, ii);
      const key = VirtualizedList._keyExtractor(item, ii, this.props);

      this._indicesToKeys.set(ii, key);
      if (stickyIndicesFromProps.has(ii + stickyOffset)) {
        stickyHeaderIndices.push(cells.length);
      }

      const shouldListenForLayout =
        getItemLayout == null || debug || this._fillRateHelper.enabled();

      cells.push(
        <CellRenderer
          CellRendererComponent={CellRendererComponent}
          ItemSeparatorComponent={ii < end ? ItemSeparatorComponent : undefined}
          ListItemComponent={ListItemComponent}
          cellKey={key}
          horizontal={horizontal}
          index={ii}
          inversionStyle={inversionStyle}
          item={item}
          key={key}
          prevCellKey={prevCellKey}
          onUpdateSeparators={this._onUpdateSeparators}
          onCellFocusCapture={this._onCellFocusCapture}
          onUnmount={this._onCellUnmount}
          ref={ref => {
            this._cellRefs[key] = ref;
          }}
          renderItem={renderItem}
          {...(shouldListenForLayout && {
            onCellLayout: this._onCellLayout,
          })}
        />,
      );
      prevCellKey = key;
    }
  }

  static _constrainToItemCount(
    cells: {first: number, last: number},
    props: VirtualizedListProps,
  ): {first: number, last: number} {
    const itemCount = props.getItemCount(props.data);
    const lastPossibleCellIndex = itemCount - 1;

    // Constraining `last` may significantly shrink the window. Adjust `first`
    // to expand the window if the new `last` results in a new window smaller
    // than the number of cells rendered per batch.
    const maxToRenderPerBatch = maxToRenderPerBatchOrDefault(
      props.maxToRenderPerBatch,
    );
    const maxFirst = Math.max(0, lastPossibleCellIndex - maxToRenderPerBatch);

    return {
      first: clamp(0, cells.first, maxFirst),
      last: Math.min(lastPossibleCellIndex, cells.last),
    };
  }

  _onUpdateSeparators = (keys: Array<?string>, newProps: Object) => {
    keys.forEach(key => {
      const ref = key != null && this._cellRefs[key];
      ref && ref.updateSeparatorProps(newProps);
    });
  };

  _isNestedWithSameOrientation(): boolean {
    const nestedContext = this.context;
    return !!(
      nestedContext &&
      !!nestedContext.horizontal === horizontalOrDefault(this.props.horizontal)
    );
  }

  _getSpacerKey = (isVertical: boolean): string =>
    isVertical ? 'height' : 'width';

  static _keyExtractor(
    item: Item,
    index: number,
    props: {
      keyExtractor?: ?(item: Item, index: number) => string,
      ...
    },
  ): string {
    if (props.keyExtractor != null) {
      return props.keyExtractor(item, index);
    }

    const key = defaultKeyExtractor(item, index);
    if (key === String(index)) {
      _usedIndexForKey = true;
      if (item.type && item.type.displayName) {
        _keylessItemComponentName = item.type.displayName;
      }
    }
    return key;
  }

  _renderEmptyComponent(
    element: ExactReactElement_DEPRECATED<any>,
    inversionStyle: StyleProp<ViewStyle>,
  ): React.Node {
    // $FlowFixMe[prop-missing] React.Element internal inspection
    const isFragment = element.type === React.Fragment;

    if (isFragment) {
      return element;
    }

    return cloneElement(element, {
      onLayout: (event: LayoutChangeEvent) => {
        this._onLayoutEmpty(event);
        // $FlowFixMe[prop-missing] React.Element internal inspection
        if (element.props.onLayout) {
          element.props.onLayout(event);
        }
      },
      // $FlowFixMe[prop-missing] React.Element internal inspection
      style: StyleSheet.compose(inversionStyle, element.props.style),
    });
  }

  render(): React.Node {
    this._checkProps(this.props);
    const {ListEmptyComponent, ListFooterComponent, ListHeaderComponent} =
      this.props;
    const {data, horizontal} = this.props;
    const inversionStyle = this.props.inverted
      ? horizontalOrDefault(this.props.horizontal)
        ? styles.horizontallyInverted
        : styles.verticallyInverted
      : null;
    const cells: Array<any | React.Node> = [];
    const stickyIndicesFromProps = new Set(this.props.stickyHeaderIndices);
    const stickyHeaderIndices = [];

    // 1. Add cell for ListHeaderComponent
    if (ListHeaderComponent) {
      if (stickyIndicesFromProps.has(0)) {
        stickyHeaderIndices.push(0);
      }
      const element = isValidElement(ListHeaderComponent) ? (
        ListHeaderComponent
      ) : (
        // $FlowFixMe[not-a-component]
        // $FlowFixMe[incompatible-type]
        <ListHeaderComponent />
      );
      cells.push(
        <VirtualizedListCellContextProvider
          cellKey={this._getCellKey() + '-header'}
          key="$header">
          <View
            // We expect that header component will be a single native view so make it
            // not collapsable to avoid this view being flattened and make this assumption
            // no longer true.
            collapsable={false}
            onLayout={this._onLayoutHeader}
            style={StyleSheet.compose(
              inversionStyle,
              this.props.ListHeaderComponentStyle,
            )}>
            {
              // $FlowFixMe[incompatible-type] - Typing ReactNativeComponent revealed errors
              element
            }
          </View>
        </VirtualizedListCellContextProvider>,
      );
    }

    // 2a. Add a cell for ListEmptyComponent if applicable
    const itemCount = this.props.getItemCount(data);
    if (itemCount === 0 && ListEmptyComponent) {
      const element: ExactReactElement_DEPRECATED<any> = (
        isValidElement(ListEmptyComponent) ? (
          ListEmptyComponent
        ) : (
          // $FlowFixMe[not-a-component]
          // $FlowFixMe[incompatible-type]
          <ListEmptyComponent />
        )
      ) as any;
      cells.push(
        <VirtualizedListCellContextProvider
          cellKey={this._getCellKey() + '-empty'}
          key="$empty">
          {this._renderEmptyComponent(element, inversionStyle)}
        </VirtualizedListCellContextProvider>,
      );
    }

    // 2b. Add cells and spacers for each item
    if (itemCount > 0) {
      _usedIndexForKey = false;
      _keylessItemComponentName = '';
      const spacerKey = this._getSpacerKey(!horizontal);

      const renderRegions = this.state.renderMask.enumerateRegions();
      const lastRegion = renderRegions[renderRegions.length - 1];
      const lastSpacer = lastRegion?.isSpacer ? lastRegion : null;

      for (const section of renderRegions) {
        if (section.isSpacer) {
          // Legacy behavior is to avoid spacers when virtualization is
          // disabled (including head spacers on initial render).
          if (this.props.disableVirtualization) {
            continue;
          }

          // Without getItemLayout, we limit our tail spacer to the _highestMeasuredFrameIndex to
          // prevent the user for hyperscrolling into un-measured area because otherwise content will
          // likely jump around as it renders in above the viewport.
          const isLastSpacer = section === lastSpacer;
          const constrainToMeasured = isLastSpacer && !this.props.getItemLayout;
          const last = constrainToMeasured
            ? clamp(
                section.first - 1,
                section.last,
                this._listMetrics.getHighestMeasuredCellIndex(),
              )
            : section.last;

          const firstMetrics = this._listMetrics.getCellMetricsApprox(
            section.first,
            this.props,
          );
          const lastMetrics = this._listMetrics.getCellMetricsApprox(
            last,
            this.props,
          );
          const spacerSize =
            lastMetrics.offset + lastMetrics.length - firstMetrics.offset;
          cells.push(
            <View
              key={`$spacer-${section.first}`}
              // $FlowFixMe[incompatible-type]
              style={{[spacerKey]: spacerSize}}
            />,
          );
        } else {
          this._pushCells(
            cells,
            stickyHeaderIndices,
            stickyIndicesFromProps,
            section.first,
            section.last,
            inversionStyle,
          );
        }
      }

      if (!this._hasWarned.keys && _usedIndexForKey) {
        console.warn(
          'VirtualizedList: missing keys for items, make sure to specify a key or id property on each ' +
            'item or provide a custom keyExtractor.',
          _keylessItemComponentName,
        );
        this._hasWarned.keys = true;
      }
    }

    // 3. Add cell for ListFooterComponent
    if (ListFooterComponent) {
      const element = isValidElement(ListFooterComponent) ? (
        ListFooterComponent
      ) : (
        // $FlowFixMe[not-a-component]
        // $FlowFixMe[incompatible-type]
        <ListFooterComponent />
      );
      cells.push(
        <VirtualizedListCellContextProvider
          cellKey={this._getFooterCellKey()}
          key="$footer">
          <View
            onLayout={this._onLayoutFooter}
            style={StyleSheet.compose(
              inversionStyle,
              this.props.ListFooterComponentStyle,
            )}>
            {
              // $FlowFixMe[incompatible-type] - Typing ReactNativeComponent revealed errors
              element
            }
          </View>
        </VirtualizedListCellContextProvider>,
      );
    }

    // 4. Render the ScrollView
    const scrollProps = {
      ...this.props,
      onContentSizeChange: this._onContentSizeChange,
      onLayout: this._onLayout,
      onScroll: this._onScroll,
      onScrollBeginDrag: this._onScrollBeginDrag,
      onScrollEndDrag: this._onScrollEndDrag,
      onMomentumScrollBegin: this._onMomentumScrollBegin,
      onMomentumScrollEnd: this._onMomentumScrollEnd,
      // iOS/macOS requires a non-zero scrollEventThrottle to fire more than a
      // single notification while scrolling. This will otherwise no-op.
      scrollEventThrottle: this.props.scrollEventThrottle ?? 0.0001,
      invertStickyHeaders:
        this.props.invertStickyHeaders !== undefined
          ? this.props.invertStickyHeaders
          : this.props.inverted,
      stickyHeaderIndices,
      style: inversionStyle
        ? [inversionStyle, this.props.style]
        : this.props.style,
      isInvertedVirtualizedList: this.props.inverted,
      maintainVisibleContentPosition:
        this.props.maintainVisibleContentPosition != null
          ? {
              ...this.props.maintainVisibleContentPosition,
              // Adjust index to account for ListHeaderComponent.
              minIndexForVisible:
                this.props.maintainVisibleContentPosition.minIndexForVisible +
                (this.props.ListHeaderComponent ? 1 : 0),
            }
          : undefined,
    };

    this._hasMore = this.state.cellsAroundViewport.last < itemCount - 1;

    const innerRet = (
      <VirtualizedListContextProvider
        value={{
          cellKey: null,
          getScrollMetrics: this._getScrollMetrics,
          horizontal: horizontalOrDefault(this.props.horizontal),
          getOutermostParentListRef: this._getOutermostParentListRef,
          registerAsNestedChild: this._registerAsNestedChild,
          unregisterAsNestedChild: this._unregisterAsNestedChild,
        }}>
        {cloneElement(
          (
            this.props.renderScrollComponent ||
            this._defaultRenderScrollComponent
          )(
            // $FlowExpectedError[incompatible-type] scrollProps is a superset of ScrollViewProps
            scrollProps,
          ) as ExactReactElement_DEPRECATED<any>,
          {
            ref: this._captureScrollRef,
          },
          cells,
        )}
      </VirtualizedListContextProvider>
    );
    let ret: React.Node = innerRet;
    if (__DEV__) {
      ret = (
        <ScrollView.Context.Consumer>
          {scrollContext => {
            if (
              scrollContext != null &&
              !scrollContext.horizontal ===
                !horizontalOrDefault(this.props.horizontal) &&
              !this._hasWarned.nesting &&
              this.context == null &&
              this.props.scrollEnabled !== false
            ) {
              console.error(
                'VirtualizedLists should never be nested inside plain ScrollViews with the same ' +
                  'orientation because it can break windowing and other functionality - use another ' +
                  'VirtualizedList-backed container instead.',
              );
              this._hasWarned.nesting = true;
            }
            return innerRet;
          }}
        </ScrollView.Context.Consumer>
      );
    }
    if (this.props.debug) {
      return (
        <View style={styles.debug}>
          {ret}
          {this._renderDebugOverlay()}
        </View>
      );
    } else {
      return ret;
    }
  }

  componentDidUpdate(prevProps: VirtualizedListProps) {
    const {data, extraData, getItemLayout} = this.props;
    if (data !== prevProps.data || extraData !== prevProps.extraData) {
      // clear the viewableIndices cache to also trigger
      // the onViewableItemsChanged callback with the new data
      this._viewabilityTuples.forEach(tuple => {
        tuple.viewabilityHelper.resetViewableIndices();
      });
    }
    // The `this._hiPriInProgress` is guaranteeing a hiPri cell update will only happen
    // once per fiber update. The `_scheduleCellsToRenderUpdate` will set it to true
    // if a hiPri update needs to perform. If `componentDidUpdate` is triggered with
    // `this._hiPriInProgress=true`, means it's triggered by the hiPri update. The
    // `_scheduleCellsToRenderUpdate` will check this condition and not perform
    // another hiPri update.
    const hiPriInProgress = this._hiPriInProgress;
    this._scheduleCellsToRenderUpdate();
    // Make sure setting `this._hiPriInProgress` back to false after `componentDidUpdate`
    // is triggered with `this._hiPriInProgress = true`
    if (hiPriInProgress) {
      this._hiPriInProgress = false;
    }

    // We only call `onEndReached` after we render the last cell, but when
    // getItemLayout is present, we can scroll past the last rendered cell, and
    // never trigger a new layout or bounds change, so we need to check again
    // after rendering more cells.
    if (getItemLayout != null) {
      this._maybeCallOnEdgeReached();
    }
  }

  _cellRefs: {[string]: null | CellRenderer<any>} = {};
  _fillRateHelper: FillRateHelper;
  _listMetrics: ListMetricsAggregator = new ListMetricsAggregator();
  _footerLength = 0;
  // Used for preventing scrollToIndex from being called multiple times for initialScrollIndex
  _hasTriggeredInitialScrollToIndex = false;
  _hasInteracted = false;
  _hasMore = false;
  _hasWarned: {[string]: boolean} = {};
  _headerLength = 0;
  _hiPriInProgress: boolean = false; // flag to prevent infinite hiPri cell limit update
  _indicesToKeys: Map<number, string> = new Map();
  _lastFocusedCellKey: ?string = null;
  _nestedChildLists: ChildListCollection<VirtualizedList> =
    new ChildListCollection();
  _offsetFromParentVirtualizedList: number = 0;
  _pendingViewabilityUpdate: boolean = false;
  _prevParentOffset: number = 0;
  _scrollMetrics: {
    dOffset: number,
    dt: number,
    offset: number,
    timestamp: number,
    velocity: number,
    visibleLength: number,
    zoomScale: number,
  } = {
    dOffset: 0,
    dt: 10,
    offset: 0,
    timestamp: 0,
    velocity: 0,
    visibleLength: 0,
    zoomScale: 1,
  };
  _scrollRef: ?React.ElementRef<typeof ScrollView> = null;
  _sentStartForContentLength = 0;
  _sentEndForContentLength = 0;
  _updateCellsToRenderTimeoutID: ?TimeoutID = null;
  _viewabilityTuples: Array<ViewabilityHelperCallbackTuple> = [];

  _captureScrollRef = (ref: ?React.ElementRef<typeof ScrollView>) => {
    this._scrollRef = ref;
  };

  _computeBlankness() {
    this._fillRateHelper.computeBlankness(
      this.props,
      this.state.cellsAroundViewport,
      this._scrollMetrics,
    );
  }

  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  _defaultRenderScrollComponent = props => {
    const onRefresh = props.onRefresh;
    if (this._isNestedWithSameOrientation()) {
      // Prevent VirtualizedList._onContentSizeChange from being triggered by a bubbling onContentSizeChange event.
      // This could lead to internal inconsistencies within VirtualizedList.
      const {onContentSizeChange, ...otherProps} = props;
      return <View {...otherProps} />;
    } else if (onRefresh) {
      invariant(
        typeof props.refreshing === 'boolean',
        '`refreshing` prop must be set as a boolean in order to use `onRefresh`, but got `' +
          JSON.stringify(props.refreshing ?? 'undefined') +
          '`',
      );
      return (
        // $FlowFixMe[prop-missing] Invalid prop usage
        // $FlowFixMe[incompatible-use]
        <ScrollView
          {...props}
          refreshControl={
            props.refreshControl == null ? (
              <RefreshControl
                // $FlowFixMe[incompatible-type]
                refreshing={props.refreshing}
                onRefresh={onRefresh}
                progressViewOffset={props.progressViewOffset}
              />
            ) : (
              props.refreshControl
            )
          }
        />
      );
    } else {
      // $FlowFixMe[prop-missing] Invalid prop usage
      // $FlowFixMe[incompatible-use]
      return <ScrollView {...props} />;
    }
  };

  _onCellLayout = (
    e: LayoutChangeEvent,
    cellKey: string,
    cellIndex: number,
  ): void => {
    const layoutHasChanged = this._listMetrics.notifyCellLayout({
      cellIndex,
      cellKey,
      layout: e.nativeEvent.layout,
      orientation: this._orientation(),
    });

    if (layoutHasChanged) {
      this._scheduleCellsToRenderUpdate();
    }

    this._triggerRemeasureForChildListsInCell(cellKey);
    this._computeBlankness();
    this._updateViewableItems(this.props, this.state.cellsAroundViewport);
  };

  _onCellFocusCapture = (cellKey: string) => {
    this._lastFocusedCellKey = cellKey;
    if (ReactNativeFeatureFlags.deferFlatListFocusChangeRenderUpdate()) {
      // Schedule the cells to render update the same way we handle scroll or layout events.
      this._scheduleCellsToRenderUpdate();
    } else {
      this._updateCellsToRender();
    }
  };

  _onCellUnmount = (cellKey: string) => {
    delete this._cellRefs[cellKey];
    this._listMetrics.notifyCellUnmounted(cellKey);
  };

  _triggerRemeasureForChildListsInCell(cellKey: string): void {
    this._nestedChildLists.forEachInCell(cellKey, childList => {
      childList.measureLayoutRelativeToContainingList();
    });
  }

  measureLayoutRelativeToContainingList(): void {
    // TODO (T35574538): findNodeHandle sometimes crashes with "Unable to find
    // node on an unmounted component" during scrolling
    try {
      if (!this._scrollRef) {
        return;
      }
      // We are assuming that getOutermostParentListRef().getScrollRef()
      // is a non-null reference to a ScrollView
      this._scrollRef.measureLayout(
        this.context.getOutermostParentListRef().getScrollRef(),
        (x, y, width, height) => {
          this._offsetFromParentVirtualizedList = this._selectOffset({x, y});
          this._listMetrics.notifyListContentLayout({
            layout: {width, height},
            orientation: this._orientation(),
          });
          const scrollMetrics = this._convertParentScrollMetrics(
            this.context.getScrollMetrics(),
          );

          const metricsChanged =
            this._scrollMetrics.visibleLength !== scrollMetrics.visibleLength ||
            this._scrollMetrics.offset !== scrollMetrics.offset;

          if (metricsChanged) {
            this._scrollMetrics.visibleLength = scrollMetrics.visibleLength;
            this._scrollMetrics.offset = scrollMetrics.offset;

            // If metrics of the scrollView changed, then we triggered remeasure for child list
            // to ensure VirtualizedList has the right information.
            this._nestedChildLists.forEach(childList => {
              childList.measureLayoutRelativeToContainingList();
            });
          }
        },
        error => {
          console.warn(
            "VirtualizedList: Encountered an error while measuring a list's" +
              ' offset from its containing VirtualizedList.',
          );
        },
      );
    } catch (error) {
      console.warn(
        'measureLayoutRelativeToContainingList threw an error',
        error.stack,
      );
    }
  }

  _onLayout = (e: LayoutChangeEvent) => {
    if (this._isNestedWithSameOrientation()) {
      // Need to adjust our scroll metrics to be relative to our containing
      // VirtualizedList before we can make claims about list item viewability
      this.measureLayoutRelativeToContainingList();
    } else {
      this._scrollMetrics.visibleLength = this._selectLength(
        e.nativeEvent.layout,
      );
    }
    this.props.onLayout && this.props.onLayout(e);
    this._scheduleCellsToRenderUpdate();
    this._maybeCallOnEdgeReached();
  };

  _onLayoutEmpty = (e: LayoutChangeEvent) => {
    this.props.onLayout && this.props.onLayout(e);
  };

  _getFooterCellKey(): string {
    return this._getCellKey() + '-footer';
  }

  _onLayoutFooter = (e: LayoutChangeEvent) => {
    this._triggerRemeasureForChildListsInCell(this._getFooterCellKey());
    this._footerLength = this._selectLength(e.nativeEvent.layout);
  };

  _onLayoutHeader = (e: LayoutChangeEvent) => {
    this._headerLength = this._selectLength(e.nativeEvent.layout);
  };

  // $FlowFixMe[missing-local-annot]
  _renderDebugOverlay() {
    const normalize =
      this._scrollMetrics.visibleLength /
      (this._listMetrics.getContentLength() || 1);
    const framesInLayout = [];
    const itemCount = this.props.getItemCount(this.props.data);
    for (let ii = 0; ii < itemCount; ii++) {
      const frame = this._listMetrics.getCellMetricsApprox(ii, this.props);
      if (frame.isMounted) {
        framesInLayout.push(frame);
      }
    }
    const windowTop = this._listMetrics.getCellMetricsApprox(
      this.state.cellsAroundViewport.first,
      this.props,
    ).offset;
    const frameLast = this._listMetrics.getCellMetricsApprox(
      this.state.cellsAroundViewport.last,
      this.props,
    );
    const windowLen = frameLast.offset + frameLast.length - windowTop;
    const visTop = this._scrollMetrics.offset;
    const visLen = this._scrollMetrics.visibleLength;

    return (
      <View style={[styles.debugOverlayBase, styles.debugOverlay]}>
        {framesInLayout.map((f, ii) => (
          <View
            key={'f' + ii}
            style={[
              styles.debugOverlayBase,
              styles.debugOverlayFrame,
              {
                top: f.offset * normalize,
                height: f.length * normalize,
              },
            ]}
          />
        ))}
        <View
          style={[
            styles.debugOverlayBase,
            styles.debugOverlayFrameLast,
            {
              top: windowTop * normalize,
              height: windowLen * normalize,
            },
          ]}
        />
        <View
          style={[
            styles.debugOverlayBase,
            styles.debugOverlayFrameVis,
            {
              top: visTop * normalize,
              height: visLen * normalize,
            },
          ]}
        />
      </View>
    );
  }

  _selectLength(
    metrics: Readonly<{
      height: number,
      width: number,
      ...
    }>,
  ): number {
    return !horizontalOrDefault(this.props.horizontal)
      ? metrics.height
      : metrics.width;
  }

  _selectOffset({x, y}: Readonly<{x: number, y: number, ...}>): number {
    return this._orientation().horizontal ? x : y;
  }

  _orientation(): ListOrientation {
    return {
      horizontal: horizontalOrDefault(this.props.horizontal),
      rtl: I18nManager.isRTL,
    };
  }

  _maybeCallOnEdgeReached() {
    const {
      data,
      getItemCount,
      onStartReached,
      onStartReachedThreshold,
      onEndReached,
      onEndReachedThreshold,
    } = this.props;
    // Wait until we have real metrics
    if (
      !this._listMetrics.hasContentLength() ||
      this._scrollMetrics.visibleLength === 0
    ) {
      return;
    }

    // If we have any pending scroll updates it means that the scroll metrics
    // are out of date and we should not call any of the edge reached callbacks.
    if (this.state.pendingScrollUpdateCount > 0) {
      return;
    }

    const {visibleLength, offset} = this._scrollMetrics;
    let distanceFromStart = offset;
    let distanceFromEnd =
      this._listMetrics.getContentLength() - visibleLength - offset;

    // Especially when oERT is zero it's necessary to 'floor' very small distance values to be 0
    // since debouncing causes us to not fire this event for every single "pixel" we scroll and can thus
    // be at the edge of the list with a distance approximating 0 but not quite there.
    if (distanceFromStart < ON_EDGE_REACHED_EPSILON) {
      distanceFromStart = 0;
    }
    if (distanceFromEnd < ON_EDGE_REACHED_EPSILON) {
      distanceFromEnd = 0;
    }

    // TODO: T121172172 Look into why we're "defaulting" to a threshold of 2px
    // when oERT is not present (different from 2 viewports used elsewhere)
    const DEFAULT_THRESHOLD_PX = 2;

    const startThreshold =
      onStartReachedThreshold != null
        ? onStartReachedThreshold * visibleLength
        : DEFAULT_THRESHOLD_PX;
    const endThreshold =
      onEndReachedThreshold != null
        ? onEndReachedThreshold * visibleLength
        : DEFAULT_THRESHOLD_PX;
    const isWithinStartThreshold = distanceFromStart <= startThreshold;
    const isWithinEndThreshold = distanceFromEnd <= endThreshold;

    // First check if the user just scrolled within the end threshold
    // and call onEndReached only once for a given content length,
    // and only if onStartReached is not being executed
    if (
      onEndReached &&
      this.state.cellsAroundViewport.last === getItemCount(data) - 1 &&
      isWithinEndThreshold &&
      this._listMetrics.getContentLength() !== this._sentEndForContentLength
    ) {
      this._sentEndForContentLength = this._listMetrics.getContentLength();
      onEndReached({distanceFromEnd});
    }

    // Next check if the user just scrolled within the start threshold
    // and call onStartReached only once for a given content length,
    // and only if onEndReached is not being executed
    if (
      onStartReached != null &&
      this.state.cellsAroundViewport.first === 0 &&
      isWithinStartThreshold &&
      this._listMetrics.getContentLength() !== this._sentStartForContentLength
    ) {
      this._sentStartForContentLength = this._listMetrics.getContentLength();
      onStartReached({distanceFromStart});
    }

    // If the user scrolls away from the start or end and back again,
    // cause onStartReached or onEndReached to be triggered again
    if (!isWithinStartThreshold) {
      this._sentStartForContentLength = 0;
    }
    if (!isWithinEndThreshold) {
      this._sentEndForContentLength = 0;
    }
  }

  _onContentSizeChange = (width: number, height: number) => {
    this._listMetrics.notifyListContentLayout({
      layout: {width, height},
      orientation: this._orientation(),
    });

    this._maybeScrollToInitialScrollIndex(width, height);

    if (this.props.onContentSizeChange) {
      this.props.onContentSizeChange(width, height);
    }
    this._scheduleCellsToRenderUpdate();
    this._maybeCallOnEdgeReached();
  };

  /**
   * Scroll to a specified `initialScrollIndex` prop after the ScrollView
   * content has been laid out, if it is still valid. Only a single scroll is
   * triggered throughout the lifetime of the list.
   */
  _maybeScrollToInitialScrollIndex(
    contentWidth: number,
    contentHeight: number,
  ) {
    if (
      contentWidth > 0 &&
      contentHeight > 0 &&
      this.props.initialScrollIndex != null &&
      this.props.initialScrollIndex > 0 &&
      !this._hasTriggeredInitialScrollToIndex
    ) {
      if (this.props.contentOffset == null) {
        if (
          this.props.initialScrollIndex <
          this.props.getItemCount(this.props.data)
        ) {
          this.scrollToIndex({
            animated: false,
            index: nullthrows(this.props.initialScrollIndex),
          });
        } else {
          this.scrollToEnd({animated: false});
        }
      }
      this._hasTriggeredInitialScrollToIndex = true;
    }
  }

  /* Translates metrics from a scroll event in a parent VirtualizedList into
   * coordinates relative to the child list.
   */
  _convertParentScrollMetrics = (metrics: {
    visibleLength: number,
    offset: number,
    ...
  }): $FlowFixMe => {
    // Offset of the top of the nested list relative to the top of its parent's viewport
    const offset = metrics.offset - this._offsetFromParentVirtualizedList;
    // Child's visible length is the same as its parent's
    const visibleLength = metrics.visibleLength;
    const dOffset = offset - this._scrollMetrics.offset;
    const contentLength = this._listMetrics.getContentLength();

    return {
      visibleLength,
      contentLength,
      offset,
      dOffset,
    };
  };

  unstable_onScroll(e: Object) {
    this._onScroll(e);
  }

  _onScroll = (e: Object) => {
    this._nestedChildLists.forEach(childList => {
      childList._onScroll(e);
    });
    if (this.props.onScroll) {
      this.props.onScroll(e);
    }
    const timestamp = e.timeStamp;
    let visibleLength = this._selectLength(e.nativeEvent.layoutMeasurement);
    let contentLength = this._selectLength(e.nativeEvent.contentSize);
    let offset = this._offsetFromScrollEvent(e);
    let dOffset = offset - this._scrollMetrics.offset;

    if (this._isNestedWithSameOrientation()) {
      if (this._listMetrics.getContentLength() === 0) {
        // Ignore scroll events until onLayout has been called and we
        // know our offset from our offset from our parent
        return;
      }
      ({visibleLength, contentLength, offset, dOffset} =
        this._convertParentScrollMetrics({
          visibleLength,
          offset,
        }));
    }

    const dt = this._scrollMetrics.timestamp
      ? Math.max(1, timestamp - this._scrollMetrics.timestamp)
      : 1;
    const velocity = dOffset / dt;

    if (
      dt > 500 &&
      this._scrollMetrics.dt > 500 &&
      contentLength > 5 * visibleLength &&
      !this._hasWarned.perf
    ) {
      infoLog(
        'VirtualizedList: You have a large list that is slow to update - make sure your ' +
          'renderItem function renders components that follow React performance best practices ' +
          'like PureComponent, shouldComponentUpdate, etc.',
        {dt, prevDt: this._scrollMetrics.dt, contentLength},
      );
      this._hasWarned.perf = true;
    }

    // For invalid negative values (w/ RTL), set this to 1.
    const zoomScale = e.nativeEvent.zoomScale < 0 ? 1 : e.nativeEvent.zoomScale;
    this._scrollMetrics = {
      dt,
      dOffset,
      offset,
      timestamp,
      velocity,
      visibleLength,
      zoomScale,
    };
    if (this.state.pendingScrollUpdateCount > 0) {
      this.setState<'pendingScrollUpdateCount'>(state => ({
        pendingScrollUpdateCount: state.pendingScrollUpdateCount - 1,
      }));
    }
    this._updateViewableItems(this.props, this.state.cellsAroundViewport);
    if (!this.props) {
      return;
    }
    this._maybeCallOnEdgeReached();
    if (velocity !== 0) {
      this._fillRateHelper.activate();
    }
    this._computeBlankness();
    this._scheduleCellsToRenderUpdate();
  };

  _offsetFromScrollEvent(e: ScrollEvent): number {
    const {contentOffset, contentSize, layoutMeasurement} = e.nativeEvent;
    const {horizontal, rtl} = this._orientation();
    if (horizontal && rtl) {
      return (
        this._selectLength(contentSize) -
        (this._selectOffset(contentOffset) +
          this._selectLength(layoutMeasurement))
      );
    } else {
      return this._selectOffset(contentOffset);
    }
  }

  _scheduleCellsToRenderUpdate() {
    // Only trigger high-priority updates if we've actually rendered cells,
    // and with that size estimate, accurately compute how many cells we should render.
    // Otherwise, it would just render as many cells as it can (of zero dimension),
    // each time through attempting to render more (limited by maxToRenderPerBatch),
    // starving the renderer from actually laying out the objects and computing _averageCellLength.
    // If this is triggered in an `componentDidUpdate` followed by a hiPri cellToRenderUpdate
    // We shouldn't do another hipri cellToRenderUpdate
    if (
      (this._listMetrics.getAverageCellLength() > 0 ||
        this.props.getItemLayout != null) &&
      this._shouldRenderWithPriority() &&
      !this._hiPriInProgress
    ) {
      this._hiPriInProgress = true;
      // Don't worry about interactions when scrolling quickly; focus on filling content as fast
      // as possible.
      if (this._updateCellsToRenderTimeoutID != null) {
        clearTimeout(this._updateCellsToRenderTimeoutID);
        this._updateCellsToRenderTimeoutID = null;
      }
      this._updateCellsToRender();
      return;
    } else {
      if (this._updateCellsToRenderTimeoutID == null) {
        this._updateCellsToRenderTimeoutID = setTimeout(() => {
          this._updateCellsToRenderTimeoutID = null;
          this._updateCellsToRender();
        }, this.props.updateCellsBatchingPeriod ?? 50);
      }
    }
  }

  _shouldRenderWithPriority(): boolean {
    const {first, last} = this.state.cellsAroundViewport;
    const {offset, visibleLength, velocity} = this._scrollMetrics;
    const itemCount = this.props.getItemCount(this.props.data);
    let hiPri = false;
    const onStartReachedThreshold = onStartReachedThresholdOrDefault(
      this.props.onStartReachedThreshold,
    );
    const onEndReachedThreshold = onEndReachedThresholdOrDefault(
      this.props.onEndReachedThreshold,
    );
    // Mark as high priority if we're close to the start of the first item
    // But only if there are items before the first rendered item
    if (first > 0) {
      const distTop =
        offset -
        this._listMetrics.getCellMetricsApprox(first, this.props).offset;
      hiPri =
        distTop < 0 ||
        (velocity < -2 &&
          distTop <
            getScrollingThreshold(onStartReachedThreshold, visibleLength));
    }
    // Mark as high priority if we're close to the end of the last item
    // But only if there are items after the last rendered item
    if (!hiPri && last >= 0 && last < itemCount - 1) {
      const distBottom =
        this._listMetrics.getCellMetricsApprox(last, this.props).offset -
        (offset + visibleLength);
      hiPri =
        distBottom < 0 ||
        (velocity > 2 &&
          distBottom <
            getScrollingThreshold(onEndReachedThreshold, visibleLength));
    }

    return hiPri;
  }

  unstable_onScrollBeginDrag(e: ScrollEvent) {
    this._onScrollBeginDrag(e);
  }

  _onScrollBeginDrag = (e: ScrollEvent): void => {
    this._nestedChildLists.forEach(childList => {
      childList._onScrollBeginDrag(e);
    });
    this._viewabilityTuples.forEach(tuple => {
      tuple.viewabilityHelper.recordInteraction();
    });
    this._hasInteracted = true;
    this.props.onScrollBeginDrag && this.props.onScrollBeginDrag(e);
  };

  unstable_onScrollEndDrag(e: ScrollEvent) {
    this._onScrollEndDrag(e);
  }

  _onScrollEndDrag = (e: ScrollEvent): void => {
    this._nestedChildLists.forEach(childList => {
      childList._onScrollEndDrag(e);
    });
    const {velocity} = e.nativeEvent;
    if (velocity) {
      this._scrollMetrics.velocity = this._selectOffset(velocity);
    }
    this._computeBlankness();
    this.props.onScrollEndDrag && this.props.onScrollEndDrag(e);
  };

  unstable_onMomentumScrollBegin(e: ScrollEvent) {
    this._onMomentumScrollBegin(e);
  }

  _onMomentumScrollBegin = (e: ScrollEvent): void => {
    this._nestedChildLists.forEach(childList => {
      childList._onMomentumScrollBegin(e);
    });
    this.props.onMomentumScrollBegin && this.props.onMomentumScrollBegin(e);
  };

  unstable_onMomentumScrollEnd(e: ScrollEvent) {
    this._onMomentumScrollEnd(e);
  }

  _onMomentumScrollEnd = (e: ScrollEvent): void => {
    this._nestedChildLists.forEach(childList => {
      childList._onMomentumScrollEnd(e);
    });
    this._scrollMetrics.velocity = 0;
    this._computeBlankness();
    this.props.onMomentumScrollEnd && this.props.onMomentumScrollEnd(e);
  };

  _updateCellsToRender = () => {
    this._updateViewableItems(this.props, this.state.cellsAroundViewport);

    this.setState<'cellsAroundViewport' | 'renderMask'>((state, props) => {
      const cellsAroundViewport = this._adjustCellsAroundViewport(
        props,
        state.cellsAroundViewport,
        state.pendingScrollUpdateCount,
      );
      const renderMask = VirtualizedList._createRenderMask(
        props,
        cellsAroundViewport,
        this._getNonViewportRenderRegions(props),
      );

      if (
        cellsAroundViewport.first === state.cellsAroundViewport.first &&
        cellsAroundViewport.last === state.cellsAroundViewport.last &&
        renderMask.equals(state.renderMask)
      ) {
        return null;
      }

      return {cellsAroundViewport, renderMask};
    });
  };

  _createViewToken = (
    index: number,
    isViewable: boolean,
    props: CellMetricProps,
    // $FlowFixMe[missing-local-annot]
  ) => {
    const {data, getItem} = props;
    const item = getItem(data, index);
    return {
      index,
      item,
      key: VirtualizedList._keyExtractor(item, index, props),
      isViewable,
    };
  };

  __getListMetrics(): ListMetricsAggregator {
    return this._listMetrics;
  }

  _getNonViewportRenderRegions = (
    props: CellMetricProps,
  ): ReadonlyArray<{
    first: number,
    last: number,
  }> => {
    // Keep a viewport's worth of content around the last focused cell to allow
    // random navigation around it without any blanking. E.g. tabbing from one
    // focused item out of viewport to another.
    if (
      !(this._lastFocusedCellKey && this._cellRefs[this._lastFocusedCellKey])
    ) {
      return [];
    }

    const lastFocusedCellRenderer = this._cellRefs[this._lastFocusedCellKey];
    const focusedCellIndex = lastFocusedCellRenderer.props.index;
    const itemCount = props.getItemCount(props.data);

    // The last cell we rendered may be at a new index. Bail if we don't know
    // where it is.
    if (
      focusedCellIndex >= itemCount ||
      VirtualizedList._getItemKey(props, focusedCellIndex) !==
        this._lastFocusedCellKey
    ) {
      return [];
    }

    let first = focusedCellIndex;
    let heightOfCellsBeforeFocused = 0;
    for (
      let i = first - 1;
      i >= 0 && heightOfCellsBeforeFocused < this._scrollMetrics.visibleLength;
      i--
    ) {
      first--;
      heightOfCellsBeforeFocused += this._listMetrics.getCellMetricsApprox(
        i,
        props,
      ).length;
    }

    let last = focusedCellIndex;
    let heightOfCellsAfterFocused = 0;
    for (
      let i = last + 1;
      i < itemCount &&
      heightOfCellsAfterFocused < this._scrollMetrics.visibleLength;
      i++
    ) {
      last++;
      heightOfCellsAfterFocused += this._listMetrics.getCellMetricsApprox(
        i,
        props,
      ).length;
    }

    return [{first, last}];
  };

  _updateViewableItems(
    props: CellMetricProps,
    cellsAroundViewport: {first: number, last: number},
  ) {
    // If we have any pending scroll updates it means that the scroll metrics
    // are out of date and we should not call any of the visibility callbacks.
    if (this.state.pendingScrollUpdateCount > 0) {
      return;
    }
    this._viewabilityTuples.forEach(tuple => {
      tuple.viewabilityHelper.onUpdate(
        props,
        this._scrollMetrics.offset,
        this._scrollMetrics.visibleLength,
        this._listMetrics,
        this._createViewToken,
        tuple.onViewableItemsChanged,
        cellsAroundViewport,
      );
    });
  }
}

const styles = StyleSheet.create({
  verticallyInverted:
    Platform.OS === 'android'
      ? {transform: [{scale: -1}]}
      : {transform: [{scaleY: -1}]},
  horizontallyInverted: {
    transform: [{scaleX: -1}],
  },
  debug: {
    flex: 1,
  },
  debugOverlayBase: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  debugOverlay: {
    bottom: 0,
    width: 20,
    borderColor: 'blue',
    borderWidth: 1,
  },
  debugOverlayFrame: {
    left: 0,
    backgroundColor: 'orange',
  },
  debugOverlayFrameLast: {
    left: 0,
    borderColor: 'green',
    borderWidth: 2,
  },
  debugOverlayFrameVis: {
    left: 0,
    borderColor: 'red',
    borderWidth: 2,
  },
});

export default VirtualizedList;
