/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {VirtualizedListProps} from './VirtualizedListProps';
import type {LayoutRectangle} from 'react-native';

import {keyExtractor as defaultKeyExtractor} from './VirtualizeUtils';
import invariant from 'invariant';

export type CellMetrics = {
  /**
   * Index of the item in the list
   */
  index: number,
  /**
   * Length of the cell along the scrolling axis
   */
  length: number,
  /**
   * Distance between this cell and the start of the list along the scrolling
   * axis
   */
  offset: number,
  /**
   * Whether the cell is last known to be mounted
   */
  isMounted: boolean,
};

// TODO: `inverted` can be incorporated here if it is moved to an order
// based implementation instead of transform.
export type ListOrientation = {
  horizontal: boolean,
  rtl: boolean,
};

/**
 * Subset of VirtualizedList props needed to calculate cell metrics
 */
export type CellMetricProps = {
  data: VirtualizedListProps['data'],
  getItemCount: VirtualizedListProps['getItemCount'],
  getItem: VirtualizedListProps['getItem'],
  getItemLayout?: VirtualizedListProps['getItemLayout'],
  keyExtractor?: VirtualizedListProps['keyExtractor'],
  ...
};

// How many measured cells whose metrics no longer match the cell at their
// index (because `data` changed) to skip when looking for the nearest measured
// cells around an unmeasured one.
const MAX_MISMATCHED_CELLS_TO_SKIP = 10;

/**
 * Provides an interface to query information about the metrics of a list and its cells.
 */
export default class ListMetricsAggregator {
  _averageCellLength = 0;
  _cellMetrics: Map<string, CellMetrics> = new Map();
  _contentLength: ?number;
  // Cross-axis lengths of each cell in `_cellMetrics` and of the list when the
  // cell was last laid out.
  _cellCrossAxisLengths: Map<string, {cell: number, list: ?number}> = new Map();
  _highestMeasuredCellIndex = 0;
  _listLayout: ?{width: number, height: number};
  _measuredCellsLength = 0;
  _measuredCellsCount = 0;
  // Indices of the cells in `_cellMetrics`, ascending, without duplicates, to
  // find the nearest measured cells around an unmeasured one.
  _measuredCellIndices: Array<number> = [];
  _measuredCellIndexCounts: Map<number, number> = new Map();
  _orientation: ListOrientation = {
    horizontal: false,
    rtl: false,
  };

  /**
   * Notify the ListMetricsAggregator that a cell has been laid out.
   *
   * @returns whether the cell layout has changed since last notification
   */
  notifyCellLayout({
    cellIndex,
    cellKey,
    orientation,
    layout,
  }: {
    cellIndex: number,
    cellKey: string,
    orientation: ListOrientation,
    layout: LayoutRectangle,
  }): boolean {
    this._invalidateIfOrientationChanged(orientation);

    const next: CellMetrics = {
      index: cellIndex,
      length: this._selectLength(layout),
      isMounted: true,
      offset: this.flowRelativeOffset(layout),
    };
    const crossAxisLength = this._selectCrossAxisLength(layout);
    const listCrossAxisLength = this._getListCrossAxisLength();
    const prevCrossAxisLengths = this._cellCrossAxisLengths.get(cellKey);
    let curr = this._cellMetrics.get(cellKey);

    if (
      curr != null &&
      prevCrossAxisLengths != null &&
      prevCrossAxisLengths.list !== listCrossAxisLength &&
      prevCrossAxisLengths.cell !== crossAxisLength &&
      curr.length !== next.length
    ) {
      // The list was resized since the cell was last laid out, and the cell
      // changed length with its cross-axis length (e.g. text wrapping or an
      // aspect ratio). Cells that are not mounted would change too, but keep
      // the metrics they had at the old size. A cell that changes size while
      // the list keeps its size doesn't change the other cells.
      this._invalidateUnmountedCells(listCrossAxisLength);
      curr = this._cellMetrics.get(cellKey);
    }
    this._cellCrossAxisLengths.set(cellKey, {
      cell: crossAxisLength,
      list: listCrossAxisLength,
    });

    if (!curr || next.offset !== curr.offset || next.length !== curr.length) {
      if (curr) {
        const dLength = next.length - curr.length;
        this._measuredCellsLength += dLength;
      } else {
        this._measuredCellsLength += next.length;
        this._measuredCellsCount += 1;
      }

      // NOTE: _measuredCellsCount is incremented before this line whenever a new
      // cell is added, so it should never be 0 here. This guard is defense in
      // depth against a future bug where _measuredCellsCount is reset (e.g. during
      // orientation changes) without also clearing _cellMetrics — which would leave
      // `curr` with a stale value and count === 0, causing a divide-by-zero.
      if (this._measuredCellsCount > 0) {
        this._averageCellLength =
          this._measuredCellsLength / this._measuredCellsCount;
      } else {
        this._averageCellLength = 0;
      }
      if (!curr) {
        this._addMeasuredCellIndex(cellIndex);
      } else if (curr.index !== cellIndex) {
        this._removeMeasuredCellIndex(curr.index);
        this._addMeasuredCellIndex(cellIndex);
      }
      this._cellMetrics.set(cellKey, next);
      this._highestMeasuredCellIndex = Math.max(
        this._highestMeasuredCellIndex,
        cellIndex,
      );
      return true;
    } else {
      curr.isMounted = true;
      return false;
    }
  }

  /**
   * Notify ListMetricsAggregator that a cell has been unmounted.
   */
  notifyCellUnmounted(cellKey: string): void {
    const curr = this._cellMetrics.get(cellKey);
    if (curr) {
      curr.isMounted = false;
    }
  }

  /**
   * Notify ListMetricsAggregator that the list itself has been laid out.
   */
  notifyListLayout({
    orientation,
    layout,
  }: {
    orientation: ListOrientation,
    layout: Readonly<{width: number, height: number, ...}>,
  }): void {
    this._invalidateIfOrientationChanged(orientation);
    this._listLayout = {width: layout.width, height: layout.height};
  }

  /**
   * Notify ListMetricsAggregator that the lists content container has been laid out.
   */
  notifyListContentLayout({
    orientation,
    layout,
  }: {
    orientation: ListOrientation,
    layout: Readonly<{width: number, height: number}>,
  }): void {
    this._invalidateIfOrientationChanged(orientation);
    this._contentLength = this._selectLength(layout);
  }

  /**
   * Return the average length of the cells which have been measured
   */
  getAverageCellLength(): number {
    return this._averageCellLength;
  }

  /**
   * Return the highest measured cell index (or 0 if nothing has been measured
   * yet)
   */
  getHighestMeasuredCellIndex(): number {
    return this._highestMeasuredCellIndex;
  }

  /**
   * Returns the exact metrics of a cell if it has already been laid out,
   * otherwise an estimate from the measured cells around it: an even share of
   * the space between the nearest measured cells before and after it, or else
   * the average length of measured cells, starting where the nearest measured
   * cell before it ends
   */
  getCellMetricsApprox(index: number, props: CellMetricProps): CellMetrics {
    const frame = this.getCellMetrics(index, props);
    if (frame && frame.index === index) {
      // check for invalid frames due to row re-ordering
      return frame;
    } else {
      // Estimate from the measured cells around this one rather than from the
      // start of the list, so that the estimate accounts for anything before
      // the cells (e.g. a list header) and lines up with the cells around it.
      // Otherwise a spacer for unmeasured cells would not span the space
      // between the rendered cells around it, and would move every cell after
      // it.
      let offset = this._averageCellLength * index;
      let length = this._averageCellLength;
      const prevFrame = this._getMeasuredCellNear(index, -1, props);
      if (prevFrame != null) {
        const prevEnd = prevFrame.offset + prevFrame.length;
        const nextFrame = this._getMeasuredCellNear(index, 1, props);
        if (nextFrame != null && nextFrame.offset >= prevEnd) {
          length =
            (nextFrame.offset - prevEnd) /
            (nextFrame.index - prevFrame.index - 1);
        }
        offset = prevEnd + length * (index - prevFrame.index - 1);
      }

      const {data, getItemCount} = props;
      invariant(
        index >= 0 && index < getItemCount(data),
        'Tried to get frame for out of range index ' + index,
      );
      return {
        length,
        offset,
        index,
        isMounted: false,
      };
    }
  }

  /**
   * Returns the exact metrics of a cell if it has already been laid out
   */
  getCellMetrics(index: number, props: CellMetricProps): ?CellMetrics {
    const {data, getItem, getItemCount, getItemLayout} = props;
    invariant(
      index >= 0 && index < getItemCount(data),
      'Tried to get metrics for out of range cell index ' + index,
    );
    const keyExtractor = props.keyExtractor ?? defaultKeyExtractor;
    const frame = this._cellMetrics.get(
      keyExtractor(getItem(data, index), index),
    );
    if (frame && frame.index === index) {
      return frame;
    }

    if (getItemLayout) {
      const {length, offset} = getItemLayout(data, index);
      // TODO: `isMounted` is used for both "is exact layout" and "has been
      // unmounted". Should be refactored.
      return {index, length, offset, isMounted: true};
    }

    return null;
  }

  /**
   * Gets an approximate offset to an item at a given index. Supports
   * fractional indices.
   */
  getCellOffsetApprox(index: number, props: CellMetricProps): number {
    if (Number.isInteger(index)) {
      return this.getCellMetricsApprox(index, props).offset;
    } else {
      const frameMetrics = this.getCellMetricsApprox(Math.floor(index), props);
      const remainder = index - Math.floor(index);
      return frameMetrics.offset + remainder * frameMetrics.length;
    }
  }

  /**
   * Returns the length of all ScrollView content along the scrolling axis.
   */
  getContentLength(): number {
    return this._contentLength ?? 0;
  }

  /**
   * Whether a content length has been observed
   */
  hasContentLength(): boolean {
    return this._contentLength != null;
  }

  /**
   * Finds the flow-relative offset (e.g. starting from the left in LTR, but
   * right in RTL) from a layout box.
   */
  flowRelativeOffset(
    layout: LayoutRectangle,
    referenceContentLength?: ?number,
  ): number {
    const {horizontal, rtl} = this._orientation;

    if (horizontal && rtl) {
      const contentLength = referenceContentLength ?? this._contentLength;
      invariant(
        contentLength != null,
        'ListMetricsAggregator must be notified of list content layout before resolving offsets',
      );
      return (
        contentLength -
        (this._selectOffset(layout) + this._selectLength(layout))
      );
    } else {
      return this._selectOffset(layout);
    }
  }

  /**
   * Converts a flow-relative offset to a cartesian offset
   */
  cartesianOffset(flowRelativeOffset: number): number {
    const {horizontal, rtl} = this._orientation;

    if (horizontal && rtl) {
      invariant(
        this._contentLength != null,
        'ListMetricsAggregator must be notified of list content layout before resolving offsets',
      );
      return this._contentLength - flowRelativeOffset;
    } else {
      return flowRelativeOffset;
    }
  }

  /**
   * Forgets the metrics of cells that are not mounted and were laid out when
   * the list had a different cross-axis length, so that they are estimated
   * until they are measured again.
   */
  _invalidateUnmountedCells(listCrossAxisLength: ?number): void {
    let highestMeasuredCellIndex = 0;
    for (const [cellKey, metrics] of this._cellMetrics) {
      if (
        metrics.isMounted ||
        this._cellCrossAxisLengths.get(cellKey)?.list === listCrossAxisLength
      ) {
        highestMeasuredCellIndex = Math.max(
          highestMeasuredCellIndex,
          metrics.index,
        );
      } else {
        this._cellMetrics.delete(cellKey);
        this._cellCrossAxisLengths.delete(cellKey);
        this._decrementMeasuredCellIndexCount(metrics.index);
        this._measuredCellsLength -= metrics.length;
        this._measuredCellsCount -= 1;
      }
    }
    // Removing each index from the sorted array separately would shift the
    // rest of the array every time.
    this._measuredCellIndices = this._measuredCellIndices.filter(index =>
      this._measuredCellIndexCounts.has(index),
    );

    if (this._measuredCellsCount > 0) {
      this._averageCellLength =
        this._measuredCellsLength / this._measuredCellsCount;
    } else {
      this._averageCellLength = 0;
      this._measuredCellsLength = 0;
    }
    this._highestMeasuredCellIndex = highestMeasuredCellIndex;
  }

  /**
   * Returns the metrics of the nearest measured cell before (`direction` -1)
   * or after (`direction` 1) `index`, if any
   */
  _getMeasuredCellNear(
    index: number,
    direction: -1 | 1,
    props: CellMetricProps,
  ): ?CellMetrics {
    const indices = this._measuredCellIndices;
    // Metrics stay keyed to the index a cell was measured at until it is
    // measured again, so after `data` changes some of them no longer match the
    // cell at that index, or are past the end of `data`. Skip a few of those,
    // but don't scan every cell.
    const itemCount = props.getItemCount(props.data);
    let i =
      direction < 0
        ? this._lowerBoundMeasuredCellIndex(index) - 1
        : this._lowerBoundMeasuredCellIndex(index + 1);
    for (
      let tries = 0;
      tries <= MAX_MISMATCHED_CELLS_TO_SKIP &&
      i >= 0 &&
      i < indices.length &&
      indices[i] < itemCount;
      tries++, i += direction
    ) {
      const frame = this.getCellMetrics(indices[i], props);
      if (frame != null) {
        return frame;
      }
    }
    return null;
  }

  _addMeasuredCellIndex(index: number): void {
    const count = this._measuredCellIndexCounts.get(index) ?? 0;
    this._measuredCellIndexCounts.set(index, count + 1);
    if (count === 0) {
      this._measuredCellIndices.splice(
        this._lowerBoundMeasuredCellIndex(index),
        0,
        index,
      );
    }
  }

  _removeMeasuredCellIndex(index: number): void {
    if (this._decrementMeasuredCellIndexCount(index)) {
      this._measuredCellIndices.splice(
        this._lowerBoundMeasuredCellIndex(index),
        1,
      );
    }
  }

  /**
   * Returns whether no measured cell is left at `index`, in which case it
   * must be removed from `_measuredCellIndices`
   */
  _decrementMeasuredCellIndexCount(index: number): boolean {
    const count = this._measuredCellIndexCounts.get(index) ?? 0;
    if (count > 1) {
      this._measuredCellIndexCounts.set(index, count - 1);
      return false;
    } else if (count === 1) {
      this._measuredCellIndexCounts.delete(index);
      return true;
    }
    return false;
  }

  /**
   * Returns the position of the first entry in `_measuredCellIndices` that is
   * not below `index`
   */
  _lowerBoundMeasuredCellIndex(index: number): number {
    const indices = this._measuredCellIndices;
    let low = 0;
    let high = indices.length;
    while (low < high) {
      const mid = low + Math.floor((high - low) / 2);
      if (indices[mid] < index) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  }

  _clearCellMetrics(): void {
    this._cellMetrics.clear();
    this._cellCrossAxisLengths.clear();
    this._measuredCellIndices = [];
    this._measuredCellIndexCounts.clear();
  }

  _invalidateIfOrientationChanged(orientation: ListOrientation): void {
    if (orientation.rtl !== this._orientation.rtl) {
      this._clearCellMetrics();
    }

    if (orientation.horizontal !== this._orientation.horizontal) {
      this._clearCellMetrics();
      this._averageCellLength = 0;
      this._contentLength = null;
      this._highestMeasuredCellIndex = 0;
      this._measuredCellsLength = 0;
      this._measuredCellsCount = 0;
    }

    this._orientation = orientation;
  }

  _selectLength({
    width,
    height,
  }: Readonly<{width: number, height: number, ...}>): number {
    return this._orientation.horizontal ? width : height;
  }

  _selectCrossAxisLength({
    width,
    height,
  }: Readonly<{width: number, height: number, ...}>): number {
    return this._orientation.horizontal ? height : width;
  }

  _getListCrossAxisLength(): ?number {
    return this._listLayout != null
      ? this._selectCrossAxisLength(this._listLayout)
      : null;
  }

  _selectOffset({x, y}: Readonly<{x: number, y: number, ...}>): number {
    return this._orientation.horizontal ? x : y;
  }
}
