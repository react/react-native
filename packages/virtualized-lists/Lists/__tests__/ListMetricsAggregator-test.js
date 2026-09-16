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
import nullthrows from 'nullthrows';

describe('ListMetricsAggregator', () => {
  it('keeps a running average length of measured cells', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};

    expect(listMetrics.getAverageCellLength()).toEqual(0);

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 10,
        width: 5,
        x: 0,
        y: 0,
      },
    });
    expect(listMetrics.getAverageCellLength()).toEqual(10);

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 10,
      },
    });
    expect(listMetrics.getAverageCellLength()).toEqual(15);
  });

  it('adjusts the average cell length when layout changes', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};

    expect(listMetrics.getAverageCellLength()).toEqual(0);

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 10,
        width: 5,
        x: 0,
        y: 0,
      },
    });
    expect(listMetrics.getAverageCellLength()).toEqual(10);

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 10,
      },
    });
    expect(listMetrics.getAverageCellLength()).toEqual(15);

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 0,
      },
    });
    expect(listMetrics.getAverageCellLength()).toEqual(20);
  });

  it('keeps track of the highest measured cell index', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};

    expect(listMetrics.getHighestMeasuredCellIndex()).toEqual(0);

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 10,
        width: 5,
        x: 0,
        y: 0,
      },
    });
    expect(listMetrics.getHighestMeasuredCellIndex()).toEqual(0);

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 10,
      },
    });
    expect(listMetrics.getHighestMeasuredCellIndex()).toEqual(1);
  });

  it('resets measurements if list orientation changes', () => {
    const listMetrics = new ListMetricsAggregator();
    expect(listMetrics.getAverageCellLength()).toEqual(0);

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation: {horizontal: false, rtl: false},
      layout: {
        height: 10,
        width: 5,
        x: 0,
        y: 0,
      },
    });
    expect(listMetrics.getAverageCellLength()).toEqual(10);

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation: {horizontal: true, rtl: false},
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 10,
      },
    });
    expect(listMetrics.getAverageCellLength()).toEqual(5);
  });

  it('resolves metrics of already measured cell', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 10,
        width: 5,
        x: 0,
        y: 0,
      },
    });

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 10,
      },
    });

    expect(listMetrics.getCellMetrics(1, props)).toEqual({
      index: 1,
      length: 20,
      offset: 10,
      isMounted: true,
    });
    expect(listMetrics.getCellMetricsApprox(1, props)).toEqual({
      index: 1,
      length: 20,
      offset: 10,
      isMounted: true,
    });
  });

  it('estimates metrics of unmeasured cell', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 10,
        width: 5,
        x: 0,
        y: 100,
      },
    });

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 110,
      },
    });

    expect(listMetrics.getCellMetrics(2, props)).toBeNull();
    expect(listMetrics.getCellMetricsApprox(2, props)).toEqual({
      index: 2,
      length: 15,
      offset: 130,
      isMounted: false,
    });
  });

  it('uses getItemLayout for metrics of unmeasured cell', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
      getItemLayout: () => ({index: 2, length: 40, offset: 30}),
    };

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 10,
        width: 5,
        x: 0,
        y: 0,
      },
    });

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 10,
      },
    });

    expect(listMetrics.getCellMetrics(2, props)).toMatchObject({
      index: 2,
      length: 40,
      offset: 30,
    });
    expect(listMetrics.getCellMetricsApprox(2, props)).toMatchObject({
      index: 2,
      length: 40,
      offset: 30,
    });
  });

  it('resolves horizontal metrics of already measured cell', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: true, rtl: false};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 5,
        width: 10,
        x: 0,
        y: 0,
      },
    });

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 5,
        width: 20,
        x: 10,
        y: 0,
      },
    });

    expect(listMetrics.getCellMetrics(1, props)).toEqual({
      index: 1,
      length: 20,
      offset: 10,
      isMounted: true,
    });
    expect(listMetrics.getCellMetricsApprox(1, props)).toEqual({
      index: 1,
      length: 20,
      offset: 10,
      isMounted: true,
    });
  });

  it('estimates horizontal metrics of unmeasured cell', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: true, rtl: false};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 5,
        width: 10,
        x: 0,
        y: 0,
      },
    });

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 5,
        width: 20,
        x: 10,
        y: 0,
      },
    });

    expect(listMetrics.getCellMetrics(2, props)).toBeNull();
    expect(listMetrics.getCellMetricsApprox(2, props)).toEqual({
      index: 2,
      length: 15,
      offset: 30,
      isMounted: false,
    });
  });

  it('uses getItemLayout for horizontal metrics of unmeasured cell', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: true, rtl: false};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
      getItemLayout: () => ({index: 2, length: 40, offset: 30}),
    };

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 5,
        width: 10,
        x: 0,
        y: 0,
      },
    });

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 5,
        width: 20,
        x: 10,
        y: 0,
      },
    });

    expect(listMetrics.getCellMetrics(2, props)).toMatchObject({
      index: 2,
      length: 40,
      offset: 30,
    });
    expect(listMetrics.getCellMetricsApprox(2, props)).toMatchObject({
      index: 2,
      length: 40,
      offset: 30,
    });
  });

  it('resolves RTL metrics of already measured cell', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: true, rtl: true};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };

    listMetrics.notifyListContentLayout({
      layout: {width: 100, height: 5},
      orientation,
    });

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 5,
        width: 10,
        x: 90,
        y: 0,
      },
    });

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 5,
        width: 20,
        x: 70,
        y: 0,
      },
    });

    expect(listMetrics.getCellMetrics(1, props)).toEqual({
      index: 1,
      length: 20,
      offset: 10,
      isMounted: true,
    });
    expect(listMetrics.getCellMetricsApprox(1, props)).toEqual({
      index: 1,
      length: 20,
      offset: 10,
      isMounted: true,
    });
  });

  it('estimates RTL metrics of unmeasured cell', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: true, rtl: true};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };

    listMetrics.notifyListContentLayout({
      layout: {width: 100, height: 5},
      orientation,
    });

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 5,
        width: 10,
        x: 70,
        y: 0,
      },
    });

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 5,
        width: 20,
        x: 50,
        y: 0,
      },
    });

    expect(listMetrics.getCellMetricsApprox(2, props)).toEqual({
      index: 2,
      length: 15,
      offset: 50,
      isMounted: false,
    });
  });

  it('uses getItemLayout for RTL metrics of unmeasured cell', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: true, rtl: true};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
      getItemLayout: () => ({index: 2, length: 40, offset: 30}),
    };

    listMetrics.notifyListContentLayout({
      layout: {width: 100, height: 5},
      orientation,
    });

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 5,
        width: 10,
        x: 90,
        y: 0,
      },
    });

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 5,
        width: 20,
        x: 70,
        y: 0,
      },
    });

    expect(listMetrics.getCellMetrics(2, props)).toMatchObject({
      index: 2,
      length: 40,
      offset: 30,
    });
    expect(listMetrics.getCellMetricsApprox(2, props)).toMatchObject({
      index: 2,
      length: 40,
      offset: 30,
    });
  });

  it('resolves vertical rtl metrics of already measured cell', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: true};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 10,
        width: 5,
        x: 0,
        y: 0,
      },
    });

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 10,
      },
    });

    expect(listMetrics.getCellMetrics(1, props)).toEqual({
      index: 1,
      length: 20,
      offset: 10,
      isMounted: true,
    });
    expect(listMetrics.getCellMetricsApprox(1, props)).toEqual({
      index: 1,
      length: 20,
      offset: 10,
      isMounted: true,
    });
  });

  it('estimates vertical RTL metrics of unmeasured cell', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: true};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 10,
        width: 5,
        x: 0,
        y: 0,
      },
    });

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 10,
      },
    });

    expect(listMetrics.getCellMetrics(2, props)).toBeNull();
    expect(listMetrics.getCellMetricsApprox(2, props)).toEqual({
      index: 2,
      length: 15,
      offset: 30,
      isMounted: false,
    });
  });

  it('uses getItemLayout for vertical RTL metrics of unmeasured cell', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: true};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
      getItemLayout: () => ({index: 2, length: 40, offset: 30}),
    };

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 10,
        width: 5,
        x: 0,
        y: 0,
      },
    });

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 10,
      },
    });

    expect(listMetrics.getCellMetrics(2, props)).toMatchObject({
      index: 2,
      length: 40,
      offset: 30,
    });
    expect(listMetrics.getCellMetricsApprox(2, props)).toMatchObject({
      index: 2,
      length: 40,
      offset: 30,
    });
  });

  it('resolves metrics of unmounted cell after list shift', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: true, rtl: true};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };

    listMetrics.notifyListContentLayout({
      layout: {width: 100, height: 5},
      orientation,
    });

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 5,
        width: 10,
        x: 90,
        y: 0,
      },
    });

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 5,
        width: 20,
        x: 70,
        y: 0,
      },
    });

    expect(listMetrics.getCellMetrics(1, props)).toEqual({
      index: 1,
      length: 20,
      offset: 10,
      isMounted: true,
    });

    listMetrics.notifyListContentLayout({
      layout: {width: 120, height: 5},
      orientation,
    });

    listMetrics.notifyCellLayout({
      cellIndex: 2,
      cellKey: '2',
      orientation,
      layout: {
        height: 5,
        width: 20,
        x: 50,
        y: 0,
      },
    });

    expect(listMetrics.getCellMetrics(1, props)).toEqual({
      index: 1,
      length: 20,
      offset: 10,
      isMounted: true,
    });

    listMetrics.notifyListContentLayout({
      layout: {width: 100, height: 5},
      orientation,
    });

    expect(listMetrics.getCellMetrics(1, props)).toEqual({
      index: 1,
      length: 20,
      offset: 10,
      isMounted: true,
    });

    listMetrics.notifyCellUnmounted('1');

    expect(listMetrics.getCellMetrics(1, props)).toEqual({
      index: 1,
      length: 20,
      offset: 10,
      isMounted: false,
    });
  });

  it('resolves integral offset of already measured cell', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 10,
        width: 5,
        x: 0,
        y: 0,
      },
    });

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 10,
      },
    });

    expect(listMetrics.getCellOffsetApprox(1, props)).toEqual(10);
  });

  it('estimates integral offset of unmeasured cell', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 10,
        width: 5,
        x: 0,
        y: 0,
      },
    });

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 10,
      },
    });

    expect(listMetrics.getCellOffsetApprox(2, props)).toEqual(30);
  });

  it('resolves fractional offset of already measured cell', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 10,
        width: 5,
        x: 0,
        y: 0,
      },
    });

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 10,
      },
    });

    expect(listMetrics.getCellOffsetApprox(1.5, props)).toEqual(20);
  });

  it('estimates fractional offset of unmeasured cell', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 10,
        width: 5,
        x: 0,
        y: 0,
      },
    });

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 10,
      },
    });

    expect(listMetrics.getCellOffsetApprox(2.5, props)).toEqual(37.5);
  });

  it('remembers most recent content length', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};

    expect(listMetrics.hasContentLength()).toBe(false);
    expect(listMetrics.getContentLength()).toBe(0);

    listMetrics.notifyListContentLayout({
      layout: {height: 10, width: 20},
      orientation,
    });
    expect(listMetrics.getContentLength()).toBe(10);

    listMetrics.notifyListContentLayout({
      layout: {height: 15, width: 25},
      orientation,
    });
    expect(listMetrics.getContentLength()).toBe(15);
  });

  it('remembers most recent horizontal content length', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: true, rtl: false};

    expect(listMetrics.hasContentLength()).toBe(false);
    expect(listMetrics.getContentLength()).toBe(0);

    listMetrics.notifyListContentLayout({
      layout: {height: 10, width: 20},
      orientation,
    });
    expect(listMetrics.getContentLength()).toBe(20);

    listMetrics.notifyListContentLayout({
      layout: {height: 15, width: 25},
      orientation,
    });
    expect(listMetrics.getContentLength()).toBe(25);
  });

  it('invalidates content length when list orientation changes', () => {
    const listMetrics = new ListMetricsAggregator();
    const verticalOrientation = {horizontal: false, rtl: false};
    const horizontalOrientation = {horizontal: true, rtl: false};
    const horizontalRtlOrientation = {horizontal: true, rtl: true};
    const cellLayout = {height: 50, width: 100, x: 0, y: 0};

    listMetrics.notifyListContentLayout({
      layout: {height: 800, width: 400},
      orientation: verticalOrientation,
    });
    expect(listMetrics.hasContentLength()).toBe(true);

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation: horizontalOrientation,
      layout: cellLayout,
    });
    expect(listMetrics.hasContentLength()).toBe(false);

    expect(() =>
      listMetrics.notifyCellLayout({
        cellIndex: 0,
        cellKey: '0',
        orientation: horizontalRtlOrientation,
        layout: cellLayout,
      }),
    ).toThrow();

    listMetrics.notifyListContentLayout({
      layout: {height: 50, width: 500},
      orientation: horizontalRtlOrientation,
    });
    expect(listMetrics.getContentLength()).toBe(500);
  });

  it('requires contentLength to resolve RTL metrics', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: true, rtl: true};

    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };

    expect(() =>
      listMetrics.notifyCellLayout({
        cellIndex: 0,
        cellKey: '0',
        orientation,
        layout: {
          height: 10,
          width: 5,
          x: 0,
          y: 0,
        },
      }),
    ).toThrow();
  });
});
