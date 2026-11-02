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

import type {CellMetricProps} from '../ListMetricsAggregator';

import ListMetricsAggregator from '../ListMetricsAggregator';
import {
  computeWindowedRenderLimits,
  elementsThatOverlapOffsets,
  newRangeCount,
} from '../VirtualizeUtils';
import {ReactNativeFeatureFlags} from 'react-native/react-private-interface';

describe('newRangeCount', function () {
  it('handles subset', function () {
    expect(newRangeCount({first: 1, last: 4}, {first: 2, last: 3})).toBe(0);
  });
  it('handles forward disjoint set', function () {
    expect(newRangeCount({first: 1, last: 4}, {first: 6, last: 9})).toBe(4);
  });
  it('handles reverse disjoint set', function () {
    expect(newRangeCount({first: 6, last: 8}, {first: 1, last: 4})).toBe(4);
  });
  it('handles superset', function () {
    expect(newRangeCount({first: 1, last: 4}, {first: 0, last: 5})).toBe(2);
  });
  it('handles end extension', function () {
    expect(newRangeCount({first: 1, last: 4}, {first: 1, last: 8})).toBe(4);
  });
  it('handles front extension', function () {
    expect(newRangeCount({first: 1, last: 4}, {first: 0, last: 4})).toBe(1);
  });
  it('handles forward intersect', function () {
    expect(newRangeCount({first: 1, last: 4}, {first: 3, last: 6})).toBe(2);
  });
  it('handles reverse intersect', function () {
    expect(newRangeCount({first: 3, last: 6}, {first: 1, last: 4})).toBe(2);
  });
});

describe('elementsThatOverlapOffsets', function () {
  it('handles fixed length', function () {
    const offsets = [0, 250, 350, 450];
    function getCellMetricsApprox(index: number) {
      return {
        length: 100,
        offset: 100 * index,
      };
    }
    expect(
      elementsThatOverlapOffsets(
        offsets,
        fakeProps(100),
        // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
        {getCellMetricsApprox},
        1,
      ),
    ).toEqual([0, 2, 3, 4]);
  });
  it('handles variable length', function () {
    const offsets = [150, 250, 900];
    const frames = [
      {offset: 0, length: 50},
      {offset: 50, length: 200},
      {offset: 250, length: 600},
      {offset: 850, length: 100},
      {offset: 950, length: 150},
    ];
    expect(
      elementsThatOverlapOffsets(
        offsets,
        fakeProps(frames.length),
        // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
        {getCellMetricsApprox: ii => frames[ii]},
        1,
      ),
    ).toEqual([1, 1, 3]);
  });
  it('handles frame boundaries', function () {
    const offsets = [0, 100, 200, 300];
    function getCellMetricsApprox(index: number) {
      return {
        length: 100,
        offset: 100 * index,
      };
    }
    expect(
      elementsThatOverlapOffsets(
        offsets,
        fakeProps(100),
        // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
        {getCellMetricsApprox},
        1,
      ),
    ).toEqual([0, 0, 1, 2]);
  });
  it('handles out of bounds', function () {
    const offsets = [-100, 150, 900];
    const frames = [
      {offset: 0, length: 50},
      {offset: 50, length: 150},
      {offset: 250, length: 100},
    ];
    expect(
      elementsThatOverlapOffsets(
        offsets,
        fakeProps(frames.length),
        // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
        {getCellMetricsApprox: ii => frames[ii]},
        1,
      ),
    ).toEqual([undefined, 1]);
  });
});

function fakeProps(length: number): CellMetricProps {
  return {
    data: new Array<void>(length).fill({} as $FlowFixMe),
    getItem() {
      throw new Error('Unexpected call to `getItem`.');
    },
    getItemCount: () => length,
  };
}

describe('computeWindowedRenderLimits', function () {
  const defaultProps: Partial<CellMetricProps> = {
    getItemCount: () => 10,
    getItem: (_, index) => ({key: `test_${index}`}),
    getItemLayout: (_, index) => {
      return {index, length: 100, offset: index * 100};
    },
  };

  const defaultScrollMetrics = {
    dt: 16,
    dOffset: 0,
    offset: 0,
    timestamp: 0,
    velocity: 0,
    visibleLength: 500,
    zoomScale: 1,
  };

  it('renders all items when list is small', function () {
    const props = {
      ...defaultProps,
      getItemCount: () => 3,
    };
    const result = computeWindowedRenderLimits(
      // $FlowFixMe[incompatible-type]
      props,
      5,
      10,
      {first: 0, last: 2},
      new ListMetricsAggregator(),
      defaultScrollMetrics,
    );
    expect(result).toEqual({first: 0, last: 2});
  });

  it('handles overflow cases when window size suddenly collapses', function () {
    ReactNativeFeatureFlags.override({
      fixVirtualizeListCollapseWindowSize: () => true,
    });

    const listMetricsAggregator = new ListMetricsAggregator();
    // $FlowFixMe[prop-missing]
    listMetricsAggregator._contentLength = 2713.60009765625;

    const offsets = [
      {index: 0, length: 275, offset: 0},
      {index: 1, length: 352, offset: 275},
      {index: 2, length: 326, offset: 627},
      {index: 3, length: 352, offset: 953},
      {index: 4, length: 293, offset: 1305},
      {index: 5, length: 293, offset: 1598},
      {index: 6, length: 293, offset: 1891},
      {index: 7, length: 293, offset: 2184},
    ];

    expect(
      computeWindowedRenderLimits(
        // $FlowFixMe[incompatible-type]
        {
          ...defaultProps,
          getItemCount: () => 8,
          getItemLayout: (_, index) => {
            return offsets[index];
          },
        },
        1,
        31,
        {first: 0, last: 5},
        listMetricsAggregator,
        // $FlowFixMe[incompatible-type]
        {
          dt: 949,
          dOffset: 879.2000732421875,
          offset: 2073.60009765625,
          timestamp: 1732180589708,
          velocity: 0.9264489707504611,
          visibleLength: 640,
        },
      ),
    ).toEqual({first: 0, last: 6});
  });

  it('handles reaching the end of the list', function () {
    const listMetricsAggregator = new ListMetricsAggregator();
    // $FlowFixMe[prop-missing]
    listMetricsAggregator._contentLength = 1000;

    const offsets = Array.from({length: 10}, (_, index) => ({
      index,
      length: 100,
      offset: index * 100,
    }));

    expect(
      computeWindowedRenderLimits(
        // $FlowFixMe[incompatible-type]
        {
          ...defaultProps,
          getItemLayout: (_, index) => offsets[index],
        },
        2,
        5,
        {first: 5, last: 9},
        listMetricsAggregator,
        // $FlowFixMe[incompatible-type]
        {
          dt: 100,
          dOffset: 100,
          offset: 900,
          timestamp: 1000,
          velocity: 1,
          visibleLength: 300,
        },
      ),
    ).toEqual({first: 3, last: 9});
  });

  it('respects maxToRenderPerBatch when adding new cells', function () {
    const scrollMetrics = {
      ...defaultScrollMetrics,
      offset: 0,
      dOffset: 0,
      velocity: 0,
    };
    const prev = {first: 0, last: 2};
    const result = computeWindowedRenderLimits(
      // $FlowFixMe[incompatible-type]
      defaultProps,
      2, // maxToRenderPerBatch
      5, // windowSize
      prev,
      new ListMetricsAggregator(),
      scrollMetrics,
    );
    expect(result).toEqual({first: 0, last: 4});
  });

  it('handles case where overscanFirst and overscanLast encompass entire list', function () {
    const props = {
      ...defaultProps,
      getItemCount: () => 5,
    };
    const scrollMetrics = {
      ...defaultScrollMetrics,
      offset: 0,
      visibleLength: 1000,
    };
    const result = computeWindowedRenderLimits(
      // $FlowFixMe[incompatible-type]
      props,
      5,
      10, // windowSize large enough to cover entire list
      {first: 0, last: 4},
      new ListMetricsAggregator(),
      scrollMetrics,
    );
    expect(result).toEqual({first: 0, last: 4});
  });
});
