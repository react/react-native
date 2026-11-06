/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {CellMetricProps} from '../ListMetricsAggregator';

import ListMetricsAggregator from '../ListMetricsAggregator';
import ViewabilityHelper from '../ViewabilityHelper';

let rowFrames: ?{
  [string]: Readonly<{height: number, y: number}>,
};
let data;
const props: CellMetricProps = {
  data,
  getItem: () => {
    throw new Error('Unexpected call to `getItem`.');
  },
  getItemCount: () => data.length,
};
function getCellMetrics(index: number) {
  if (rowFrames == null) {
    throw new Error('Expected `rowFrames` to have been initialized.');
  }
  const frame = rowFrames[data[index].key];
  return {length: frame.height, offset: frame.y};
}
function createViewToken(index: number, isViewable: boolean): $FlowFixMe {
  return {key: data[index].key, isViewable};
}

function createMeasuredListMetrics(): ListMetricsAggregator {
  if (rowFrames == null) {
    throw new Error('Expected `rowFrames` to have been initialized.');
  }
  const listMetrics = new ListMetricsAggregator();
  data.forEach((item, index) => {
    const frame = rowFrames?.[item.key];
    if (frame == null) {
      throw new Error(`Expected metrics for ${item.key}.`);
    }
    listMetrics.notifyCellLayout({
      cellIndex: index,
      cellKey: item.key,
      layout: {height: frame.height, width: 100, x: 0, y: frame.y},
      orientation: {horizontal: false, rtl: false},
    });
  });
  return listMetrics;
}

describe('computeViewableItems', function () {
  it('returns all 4 entirely visible rows as viewable', function () {
    const helper = new ViewabilityHelper({
      viewAreaCoveragePercentThreshold: 50,
    });
    rowFrames = {
      a: {y: 0, height: 50},
      b: {y: 50, height: 50},
      c: {y: 100, height: 50},
      d: {y: 150, height: 50},
    };
    data = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}];
    expect(
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      helper.computeViewableItems(props, 0, 200, {getCellMetrics}),
    ).toEqual([0, 1, 2, 3]);
  });

  it('returns top 2 rows as viewable (1. entirely visible and 2. majority)', function () {
    const helper = new ViewabilityHelper({
      viewAreaCoveragePercentThreshold: 50,
    });
    rowFrames = {
      a: {y: 0, height: 50},
      b: {y: 50, height: 150},
      c: {y: 200, height: 50},
      d: {y: 250, height: 50},
    };
    data = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}];
    expect(
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      helper.computeViewableItems(props, 0, 200, {getCellMetrics}),
    ).toEqual([0, 1]);
  });

  it('returns only 2nd row as viewable (majority)', function () {
    const helper = new ViewabilityHelper({
      viewAreaCoveragePercentThreshold: 50,
    });
    rowFrames = {
      a: {y: 0, height: 50},
      b: {y: 50, height: 150},
      c: {y: 200, height: 50},
      d: {y: 250, height: 50},
    };
    data = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}];
    expect(
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      helper.computeViewableItems(props, 25, 200, {getCellMetrics}),
    ).toEqual([1]);
  });

  it('handles empty input', function () {
    const helper = new ViewabilityHelper({
      viewAreaCoveragePercentThreshold: 50,
    });
    rowFrames = {};
    data = [];
    expect(
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      helper.computeViewableItems(props, 0, 200, {getCellMetrics}),
    ).toEqual([]);
  });

  it('handles different view area coverage percent thresholds', function () {
    rowFrames = {
      a: {y: 0, height: 50},
      b: {y: 50, height: 150},
      c: {y: 200, height: 500},
      d: {y: 700, height: 50},
    };
    data = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}];

    let helper = new ViewabilityHelper({viewAreaCoveragePercentThreshold: 0});
    // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
    expect(helper.computeViewableItems(props, 0, 50, {getCellMetrics})).toEqual(
      [0],
    );
    // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
    expect(helper.computeViewableItems(props, 1, 50, {getCellMetrics})).toEqual(
      [0, 1],
    );
    expect(
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      helper.computeViewableItems(props, 199, 50, {getCellMetrics}),
    ).toEqual([1, 2]);
    expect(
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      helper.computeViewableItems(props, 250, 50, {getCellMetrics}),
    ).toEqual([2]);

    helper = new ViewabilityHelper({viewAreaCoveragePercentThreshold: 100});
    expect(
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      helper.computeViewableItems(props, 0, 200, {getCellMetrics}),
    ).toEqual([0, 1]);
    expect(
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      helper.computeViewableItems(props, 1, 200, {getCellMetrics}),
    ).toEqual([1]);
    expect(
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      helper.computeViewableItems(props, 400, 200, {getCellMetrics}),
    ).toEqual([2]);
    expect(
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      helper.computeViewableItems(props, 600, 200, {getCellMetrics}),
    ).toEqual([3]);

    helper = new ViewabilityHelper({viewAreaCoveragePercentThreshold: 10});
    expect(
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      helper.computeViewableItems(props, 30, 200, {getCellMetrics}),
    ).toEqual([0, 1, 2]);
    expect(
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      helper.computeViewableItems(props, 31, 200, {getCellMetrics}),
    ).toEqual([1, 2]);
  });

  it('handles different item visible percent thresholds', function () {
    rowFrames = {
      a: {y: 0, height: 50},
      b: {y: 50, height: 150},
      c: {y: 200, height: 50},
      d: {y: 250, height: 50},
    };
    data = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}];
    let helper = new ViewabilityHelper({itemVisiblePercentThreshold: 0});
    // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
    expect(helper.computeViewableItems(props, 0, 50, {getCellMetrics})).toEqual(
      [0],
    );
    // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
    expect(helper.computeViewableItems(props, 1, 50, {getCellMetrics})).toEqual(
      [0, 1],
    );

    helper = new ViewabilityHelper({itemVisiblePercentThreshold: 100});
    expect(
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      helper.computeViewableItems(props, 0, 250, {getCellMetrics}),
    ).toEqual([0, 1, 2]);
    expect(
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      helper.computeViewableItems(props, 1, 250, {getCellMetrics}),
    ).toEqual([1, 2]);

    helper = new ViewabilityHelper({itemVisiblePercentThreshold: 10});
    expect(
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      helper.computeViewableItems(props, 184, 20, {getCellMetrics}),
    ).toEqual([1]);
    expect(
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      helper.computeViewableItems(props, 185, 20, {getCellMetrics}),
    ).toEqual([1, 2]);
    expect(
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      helper.computeViewableItems(props, 186, 20, {getCellMetrics}),
    ).toEqual([2]);
  });
});

describe('computeViewableItems with a pinned sticky header', function () {
  // Header A, rows a1-a3, header B, row b1. The viewport is 200 tall.
  let measuredProps: CellMetricProps = props;
  beforeEach(() => {
    rowFrames = {
      headerA: {y: 0, height: 50},
      a1: {y: 50, height: 80},
      a2: {y: 130, height: 80},
      a3: {y: 210, height: 80},
      headerB: {y: 290, height: 50},
      b1: {y: 340, height: 80},
    };
    data = [
      {key: 'headerA'},
      {key: 'a1'},
      {key: 'a2'},
      {key: 'a3'},
      {key: 'headerB'},
      {key: 'b1'},
    ];
    measuredProps = {
      ...props,
      data,
      getItem: (items, index) => items[index],
    };
  });

  it('excludes content behind the header and reports the header where it is drawn', function () {
    const helper = new ViewabilityHelper({itemVisiblePercentThreshold: 100});
    const listMetrics = createMeasuredListMetrics();
    // a2 is drawn at 30-110, partly behind header A at 0-50.
    expect(
      helper.computeViewableItems(measuredProps, 100, 200, listMetrics),
    ).toEqual([2, 3]);
    expect(
      helper.computeViewableItems(
        measuredProps,
        100,
        200,
        listMetrics,
        undefined,
        {
          coveredLength: 50,
          cellIndex: 0,
        },
      ),
    ).toEqual([0, 3]);
  });

  it('only counts the part of an item outside the header', function () {
    const helper = new ViewabilityHelper({itemVisiblePercentThreshold: 50});
    const listMetrics = createMeasuredListMetrics();
    const pinnedStickyHeader = {coveredLength: 50, cellIndex: 0};
    // a2 has 40 of 80 pixels outside the header.
    expect(
      helper.computeViewableItems(
        measuredProps,
        120,
        200,
        listMetrics,
        undefined,
        pinnedStickyHeader,
      ),
    ).toEqual([0, 2, 3, 4]);
    expect(
      helper.computeViewableItems(
        measuredProps,
        121,
        200,
        listMetrics,
        undefined,
        pinnedStickyHeader,
      ),
    ).toEqual([0, 3, 4]);
  });

  it('measures view area coverage against the whole viewport', function () {
    const listMetrics = createMeasuredListMetrics();
    const pinnedStickyHeader = {coveredLength: 50, cellIndex: 0};
    // 60 pixels of a2 are outside the header: 30% of the viewport.
    expect(
      new ViewabilityHelper({
        viewAreaCoveragePercentThreshold: 30,
      }).computeViewableItems(
        measuredProps,
        100,
        200,
        listMetrics,
        undefined,
        pinnedStickyHeader,
      ),
    ).toEqual([0, 2, 3]);
    expect(
      new ViewabilityHelper({
        viewAreaCoveragePercentThreshold: 31,
      }).computeViewableItems(
        measuredProps,
        100,
        200,
        listMetrics,
        undefined,
        pinnedStickyHeader,
      ),
    ).toEqual([0, 3]);
  });

  it('places a header that is being pushed out above the next header', function () {
    const helper = new ViewabilityHelper({itemVisiblePercentThreshold: 25});
    const listMetrics = createMeasuredListMetrics();
    // Header B is at 30, so header A is drawn at -20 to 30 and covers a3.
    expect(
      helper.computeViewableItems(measuredProps, 260, 200, listMetrics),
    ).toEqual([3, 4, 5]);
    expect(
      helper.computeViewableItems(
        measuredProps,
        260,
        200,
        listMetrics,
        undefined,
        {
          coveredLength: 30,
          cellIndex: 0,
        },
      ),
    ).toEqual([0, 4, 5]);
  });

  it('only excludes content when the header is not a list item', function () {
    const helper = new ViewabilityHelper({itemVisiblePercentThreshold: 100});
    const listMetrics = createMeasuredListMetrics();
    expect(
      helper.computeViewableItems(
        measuredProps,
        100,
        200,
        listMetrics,
        undefined,
        {
          coveredLength: 50,
          cellIndex: null,
        },
      ),
    ).toEqual([3]);
  });
});

describe('onUpdate', function () {
  it.each([
    ['view area coverage', {viewAreaCoveragePercentThreshold: 0}],
    ['item visibility', {itemVisiblePercentThreshold: 0}],
  ])(
    'suppresses previously published items with %s even without current cell metrics',
    (_name, config) => {
      const helper = new ViewabilityHelper(config);
      rowFrames = {a: {y: 0, height: 50}};
      data = [{key: 'a'}];
      const measuredProps: CellMetricProps = {
        ...props,
        data,
        getItem: (items, index) => items[index],
      };
      const onViewableItemsChanged = jest.fn();
      helper.onUpdate(
        measuredProps,
        0,
        50,
        createMeasuredListMetrics(),
        createViewToken,
        onViewableItemsChanged,
      );

      helper.resetViewableIndices();
      helper.onUpdate(
        measuredProps,
        0,
        50,
        new ListMetricsAggregator(),
        createViewToken,
        onViewableItemsChanged,
        undefined,
        true,
      );

      expect(onViewableItemsChanged).toHaveBeenLastCalledWith({
        changed: [{isViewable: false, key: 'a'}],
        viewabilityConfig: config,
        viewableItems: [],
      });
    },
  );

  it('invalidates pending minimum-view-time updates when suppressed', function () {
    const helper = new ViewabilityHelper({
      minimumViewTime: 350,
      viewAreaCoveragePercentThreshold: 0,
    });
    rowFrames = {a: {y: 0, height: 50}};
    data = [{key: 'a'}];
    const measuredProps: CellMetricProps = {
      ...props,
      data,
      getItem: (items, index) => items[index],
    };
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      measuredProps,
      0,
      50,
      createMeasuredListMetrics(),
      createViewToken,
      onViewableItemsChanged,
    );
    helper.onUpdate(
      measuredProps,
      0,
      50,
      new ListMetricsAggregator(),
      createViewToken,
      onViewableItemsChanged,
      undefined,
      true,
    );

    jest.runAllTimers();

    expect(onViewableItemsChanged).not.toHaveBeenCalled();
  });

  it('invalidates pending minimum-view-time updates without metrics', function () {
    const helper = new ViewabilityHelper({
      minimumViewTime: 350,
      viewAreaCoveragePercentThreshold: 0,
    });
    rowFrames = {a: {y: 0, height: 50}};
    data = [{key: 'a'}];
    const measuredProps: CellMetricProps = {
      ...props,
      data,
      getItem: (items, index) => items[index],
    };
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      measuredProps,
      0,
      50,
      createMeasuredListMetrics(),
      createViewToken,
      onViewableItemsChanged,
    );
    helper.onUpdate(
      measuredProps,
      0,
      50,
      new ListMetricsAggregator(),
      createViewToken,
      onViewableItemsChanged,
    );

    jest.runAllTimers();

    expect(onViewableItemsChanged).not.toHaveBeenCalled();
  });

  it('retries a pending visible update after metrics return', function () {
    const helper = new ViewabilityHelper({
      minimumViewTime: 350,
      viewAreaCoveragePercentThreshold: 0,
    });
    rowFrames = {a: {y: 0, height: 50}};
    data = [{key: 'a'}];
    const measuredProps: CellMetricProps = {
      ...props,
      data,
      getItem: (items, index) => items[index],
    };
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      measuredProps,
      0,
      50,
      createMeasuredListMetrics(),
      createViewToken,
      onViewableItemsChanged,
    );
    helper.onUpdate(
      measuredProps,
      0,
      50,
      new ListMetricsAggregator(),
      createViewToken,
      onViewableItemsChanged,
    );
    helper.onUpdate(
      measuredProps,
      0,
      50,
      createMeasuredListMetrics(),
      createViewToken,
      onViewableItemsChanged,
    );

    jest.runAllTimers();

    expect(onViewableItemsChanged).toHaveBeenCalledTimes(1);
    expect(onViewableItemsChanged).toHaveBeenCalledWith({
      changed: [{isViewable: true, key: 'a'}],
      viewabilityConfig: {
        minimumViewTime: 350,
        viewAreaCoveragePercentThreshold: 0,
      },
      viewableItems: [{isViewable: true, key: 'a'}],
    });
  });

  it('clears published items when suppression overrides interaction', function () {
    const config = {
      waitForInteraction: false,
      viewAreaCoveragePercentThreshold: 0,
    };
    const helper = new ViewabilityHelper(config);
    rowFrames = {a: {y: 0, height: 50}};
    data = [{key: 'a'}];
    const measuredProps: CellMetricProps = {
      ...props,
      data,
      getItem: (items, index) => items[index],
    };
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      measuredProps,
      0,
      50,
      createMeasuredListMetrics(),
      createViewToken,
      onViewableItemsChanged,
    );
    config.waitForInteraction = true;

    helper.onUpdate(
      measuredProps,
      0,
      50,
      new ListMetricsAggregator(),
      createViewToken,
      onViewableItemsChanged,
      undefined,
      true,
    );

    expect(onViewableItemsChanged).toHaveBeenLastCalledWith({
      changed: [{isViewable: false, key: 'a'}],
      viewabilityConfig: config,
      viewableItems: [],
    });
  });

  it('publishes removals after minimum view time when suppressed', function () {
    const config = {
      minimumViewTime: 350,
      viewAreaCoveragePercentThreshold: 0,
    };
    const helper = new ViewabilityHelper(config);
    rowFrames = {a: {y: 0, height: 50}};
    data = [{key: 'a'}];
    const measuredProps: CellMetricProps = {
      ...props,
      data,
      getItem: (items, index) => items[index],
    };
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      measuredProps,
      0,
      50,
      createMeasuredListMetrics(),
      createViewToken,
      onViewableItemsChanged,
    );
    jest.runAllTimers();
    onViewableItemsChanged.mockClear();

    helper.onUpdate(
      measuredProps,
      0,
      50,
      new ListMetricsAggregator(),
      createViewToken,
      onViewableItemsChanged,
      undefined,
      true,
    );
    jest.runAllTimers();

    expect(onViewableItemsChanged).toHaveBeenCalledWith({
      changed: [{isViewable: false, key: 'a'}],
      viewabilityConfig: config,
      viewableItems: [],
    });
  });

  it('does not postpone a pending suppression update', function () {
    const config = {
      minimumViewTime: 350,
      viewAreaCoveragePercentThreshold: 0,
    };
    const helper = new ViewabilityHelper(config);
    rowFrames = {a: {y: 0, height: 50}};
    data = [{key: 'a'}];
    const measuredProps: CellMetricProps = {
      ...props,
      data,
      getItem: (items, index) => items[index],
    };
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      measuredProps,
      0,
      50,
      createMeasuredListMetrics(),
      createViewToken,
      onViewableItemsChanged,
    );
    jest.runAllTimers();
    onViewableItemsChanged.mockClear();

    helper.onUpdate(
      measuredProps,
      0,
      50,
      new ListMetricsAggregator(),
      createViewToken,
      onViewableItemsChanged,
      undefined,
      true,
    );
    jest.advanceTimersByTime(200);
    helper.onUpdate(
      measuredProps,
      0,
      50,
      new ListMetricsAggregator(),
      createViewToken,
      onViewableItemsChanged,
      undefined,
      true,
    );
    jest.advanceTimersByTime(150);

    expect(onViewableItemsChanged).toHaveBeenCalledTimes(1);
    expect(onViewableItemsChanged).toHaveBeenCalledWith({
      changed: [{isViewable: false, key: 'a'}],
      viewabilityConfig: config,
      viewableItems: [],
    });
  });

  it('returns 1 visible row as viewable then scrolls away', function () {
    const helper = new ViewabilityHelper();
    rowFrames = {
      a: {y: 0, height: 50},
    };
    data = [{key: 'a'}];
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      props,
      0,
      200,
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      {getCellMetrics},
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged.mock.calls.length).toBe(1);
    expect(onViewableItemsChanged.mock.calls[0][0]).toEqual({
      changed: [{isViewable: true, key: 'a'}],
      viewabilityConfig: {viewAreaCoveragePercentThreshold: 0},
      viewableItems: [{isViewable: true, key: 'a'}],
    });
    helper.onUpdate(
      props,
      0,
      200,
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      {getCellMetrics},
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged.mock.calls.length).toBe(1); // nothing changed!
    helper.onUpdate(
      props,
      100,
      200,
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      {getCellMetrics},
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged.mock.calls.length).toBe(2);
    expect(onViewableItemsChanged.mock.calls[1][0]).toEqual({
      changed: [{isViewable: false, key: 'a'}],
      viewabilityConfig: {viewAreaCoveragePercentThreshold: 0},
      viewableItems: [],
    });
  });

  it('returns 1st visible row then 1st and 2nd then just 2nd', function () {
    const helper = new ViewabilityHelper();
    rowFrames = {
      a: {y: 0, height: 200},
      b: {y: 200, height: 200},
    };
    data = [{key: 'a'}, {key: 'b'}];
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      props,
      0,
      200,
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      {getCellMetrics},
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged.mock.calls.length).toBe(1);
    expect(onViewableItemsChanged.mock.calls[0][0]).toEqual({
      changed: [{isViewable: true, key: 'a'}],
      viewabilityConfig: {viewAreaCoveragePercentThreshold: 0},
      viewableItems: [{isViewable: true, key: 'a'}],
    });
    helper.onUpdate(
      props,
      100,
      200,
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      {getCellMetrics},
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged.mock.calls.length).toBe(2);
    // Both visible with 100px overlap each
    expect(onViewableItemsChanged.mock.calls[1][0]).toEqual({
      changed: [{isViewable: true, key: 'b'}],
      viewabilityConfig: {viewAreaCoveragePercentThreshold: 0},
      viewableItems: [
        {isViewable: true, key: 'a'},
        {isViewable: true, key: 'b'},
      ],
    });
    helper.onUpdate(
      props,
      200,
      200,
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      {getCellMetrics},
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged.mock.calls.length).toBe(3);
    expect(onViewableItemsChanged.mock.calls[2][0]).toEqual({
      changed: [{isViewable: false, key: 'a'}],
      viewabilityConfig: {viewAreaCoveragePercentThreshold: 0},
      viewableItems: [{isViewable: true, key: 'b'}],
    });
  });

  it('minimumViewTime delays callback', function () {
    const helper = new ViewabilityHelper({
      minimumViewTime: 350,
      viewAreaCoveragePercentThreshold: 0,
    });
    rowFrames = {
      a: {y: 0, height: 200},
      b: {y: 200, height: 200},
    };
    data = [{key: 'a'}, {key: 'b'}];
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      props,
      0,
      200,
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      {getCellMetrics},
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged).not.toBeCalled();

    jest.runAllTimers();

    expect(onViewableItemsChanged.mock.calls.length).toBe(1);
    expect(onViewableItemsChanged.mock.calls[0][0]).toEqual({
      changed: [{isViewable: true, key: 'a'}],
      viewabilityConfig: {
        minimumViewTime: 350,
        viewAreaCoveragePercentThreshold: 0,
      },
      viewableItems: [{isViewable: true, key: 'a'}],
    });
  });

  it('minimumViewTime ignores stale viewability updates', function () {
    const helper = new ViewabilityHelper({
      minimumViewTime: 350,
      viewAreaCoveragePercentThreshold: 0,
    });
    rowFrames = {
      a: {y: 0, height: 200},
      b: {y: 200, height: 200},
    };
    data = [{key: 'a'}, {key: 'b'}];
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      props,
      0,
      200,
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      {getCellMetrics},
      createViewToken,
      onViewableItemsChanged,
    );
    helper.onUpdate(
      props,
      0,
      400,
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      {getCellMetrics},
      createViewToken,
      onViewableItemsChanged,
    );

    jest.runAllTimers();

    expect(onViewableItemsChanged.mock.calls).toEqual([
      [
        {
          changed: [
            {isViewable: true, key: 'a'},
            {isViewable: true, key: 'b'},
          ],
          viewabilityConfig: {
            minimumViewTime: 350,
            viewAreaCoveragePercentThreshold: 0,
          },
          viewableItems: [
            {isViewable: true, key: 'a'},
            {isViewable: true, key: 'b'},
          ],
        },
      ],
    ]);
  });

  it('minimumViewTime skips briefly visible items', function () {
    const helper = new ViewabilityHelper({
      minimumViewTime: 350,
      viewAreaCoveragePercentThreshold: 0,
    });
    rowFrames = {
      a: {y: 0, height: 250},
      b: {y: 250, height: 200},
    };
    data = [{key: 'a'}, {key: 'b'}];
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      props,
      0,
      200,
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      {getCellMetrics},
      createViewToken,
      onViewableItemsChanged,
    );
    helper.onUpdate(
      props,
      300, // scroll past item 'a'
      200,
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      {getCellMetrics},
      createViewToken,
      onViewableItemsChanged,
    );

    jest.runAllTimers();

    expect(onViewableItemsChanged.mock.calls.length).toBe(1);
    expect(onViewableItemsChanged.mock.calls[0][0]).toEqual({
      changed: [{isViewable: true, key: 'b'}],
      viewabilityConfig: {
        minimumViewTime: 350,
        viewAreaCoveragePercentThreshold: 0,
      },
      viewableItems: [{isViewable: true, key: 'b'}],
    });
  });

  it('waitForInteraction blocks callback until interaction', function () {
    const helper = new ViewabilityHelper({
      waitForInteraction: true,
      viewAreaCoveragePercentThreshold: 0,
    });
    rowFrames = {
      a: {y: 0, height: 200},
      b: {y: 200, height: 200},
    };
    data = [{key: 'a'}, {key: 'b'}];
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      props,
      0,
      100,
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      {getCellMetrics},
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged).not.toBeCalled();

    helper.recordInteraction();

    helper.onUpdate(
      props,
      20,
      100,
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      {getCellMetrics},
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged.mock.calls.length).toBe(1);
    expect(onViewableItemsChanged.mock.calls[0][0]).toEqual({
      changed: [{isViewable: true, key: 'a'}],
      viewabilityConfig: {
        waitForInteraction: true,
        viewAreaCoveragePercentThreshold: 0,
      },
      viewableItems: [{isViewable: true, key: 'a'}],
    });
  });

  it('returns the right visible row after the underlying data changed', function () {
    const helper = new ViewabilityHelper();
    rowFrames = {
      a: {y: 0, height: 200},
      b: {y: 200, height: 200},
    };
    data = [{key: 'a'}, {key: 'b'}];
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      props,
      0,
      200,
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      {getCellMetrics},
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged.mock.calls.length).toBe(1);
    expect(onViewableItemsChanged.mock.calls[0][0]).toEqual({
      changed: [{isViewable: true, key: 'a'}],
      viewabilityConfig: {viewAreaCoveragePercentThreshold: 0},
      viewableItems: [{isViewable: true, key: 'a'}],
    });

    // update data
    rowFrames = {
      c: {y: 0, height: 200},
      a: {y: 200, height: 200},
      b: {y: 400, height: 200},
    };
    data = [{key: 'c'}, {key: 'a'}, {key: 'b'}];

    helper.resetViewableIndices();

    helper.onUpdate(
      props,
      0,
      200,
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      {getCellMetrics},
      createViewToken,
      onViewableItemsChanged,
    );

    expect(onViewableItemsChanged.mock.calls.length).toBe(2);
    expect(onViewableItemsChanged.mock.calls[1][0]).toEqual({
      changed: [
        {isViewable: true, key: 'c'},
        {isViewable: false, key: 'a'},
      ],
      viewabilityConfig: {viewAreaCoveragePercentThreshold: 0},
      viewableItems: [{isViewable: true, key: 'c'}],
    });
  });

  it('should account for imprecision on measurements of width of viewport and item', () => {
    // This test assures we round down the calculations of the item cell layout
    // to avoid cases of imprecison when measuring layout
    const helper = new ViewabilityHelper({itemVisiblePercentThreshold: 100});
    const testProps: CellMetricProps = {
      getItem: () => {
        throw new Error('Unexpected call to `getItem`.');
      },
      getItemCount: () => 1,
      data: ['Item'],
    };
    const listMetrics = {
      getCellMetrics: () => ({
        index: 0,
        length: 147.4285888671875,
        offset: 1767.6190185546875,
        isMounted: true,
      }),
    };
    const viewableIndices = helper.computeViewableItems(
      testProps,
      1503.61901855, // scrollOffset
      411.4285583496094, // viewportHeight (viewportWidth depending on scrolling axis)
      // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
      listMetrics,
    );
    expect(viewableIndices).toEqual([0]);
  });
});
