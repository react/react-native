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

  it('estimates unmeasured cells from the measured cells around them', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4, 5, 6],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };

    // The cells start after a 100-long header, and cells 2, 3 and 5 have not
    // been measured.
    for (const [index, y, height] of [
      [0, 100, 10],
      [1, 110, 20],
      [4, 200, 30],
    ]) {
      listMetrics.notifyCellLayout({
        cellIndex: index,
        cellKey: String(index),
        orientation,
        layout: {height, width: 5, x: 0, y},
      });
    }

    // Cells 2 and 3 share the space between cells 1 and 4.
    expect(listMetrics.getCellMetricsApprox(2, props)).toEqual({
      index: 2,
      length: 35,
      offset: 130,
      isMounted: false,
    });
    expect(listMetrics.getCellMetricsApprox(3, props)).toEqual({
      index: 3,
      length: 35,
      offset: 165,
      isMounted: false,
    });
    // Cell 5 has the average length and starts where cell 4 ends.
    expect(listMetrics.getCellMetricsApprox(5, props)).toEqual({
      index: 5,
      length: 20,
      offset: 230,
      isMounted: false,
    });
  });

  it('estimates around cells measured again at a new index', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};
    const props: CellMetricProps = {
      data: ['a', 'b'],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (data: Array<string>, i: number) => data[i],
      keyExtractor: (item: string) => item,
    };
    const layOut = (key: string, index: number, y: number, height: number) =>
      listMetrics.notifyCellLayout({
        cellIndex: index,
        cellKey: key,
        orientation,
        layout: {height, width: 5, x: 0, y},
      });

    layOut('a', 0, 0, 10);
    layOut('b', 1, 10, 10);

    // Items are inserted before and between the measured ones, which are laid
    // out again at their new indices.
    props.data = ['x', 'a', 'y', 'b'];
    layOut('a', 1, 10, 10);
    layOut('b', 3, 40, 20);

    expect(listMetrics.getCellMetricsApprox(2, props)).toEqual({
      index: 2,
      length: 20,
      offset: 20,
      isMounted: false,
    });
    expect(listMetrics.getCellMetricsApprox(0, props)).toEqual({
      index: 0,
      length: 15,
      offset: 0,
      isMounted: false,
    });
  });

  it('estimates after data shrinks below measured cells', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};
    const props: CellMetricProps = {
      data: ['a', 'b', 'c', 'd', 'e'],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (data: Array<string>, i: number) => data[i],
      keyExtractor: (item: string) => item,
    };
    const layOut = (key: string, index: number, y: number) =>
      listMetrics.notifyCellLayout({
        cellIndex: index,
        cellKey: key,
        orientation,
        layout: {height: 10, width: 5, x: 0, y},
      });

    layOut('a', 0, 0);
    layOut('d', 3, 30);
    layOut('e', 4, 40);

    // Cells measured at indices past the end of the data are skipped.
    props.data = ['a', 'b', 'c'];
    expect(listMetrics.getCellMetricsApprox(1, props)).toEqual({
      index: 1,
      length: 10,
      offset: 10,
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

  it('forgets unmounted cells when a cell changes length with the list width', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };
    const layOutList = (width: number) =>
      listMetrics.notifyListLayout({
        orientation,
        layout: {height: 500, width, x: 0, y: 0},
      });
    const layOut = (index: number, y: number, height: number, width: number) =>
      listMetrics.notifyCellLayout({
        cellIndex: index,
        cellKey: String(index),
        orientation,
        layout: {height, width, x: 0, y},
      });

    layOutList(100);
    layOut(0, 0, 10, 100);
    layOut(1, 10, 20, 100);
    layOut(2, 30, 30, 100);
    layOut(3, 60, 40, 100);
    listMetrics.notifyCellUnmounted('1');
    listMetrics.notifyCellUnmounted('3');

    // A cell that changes length without changing width keeps every
    // measurement.
    layOut(0, 0, 15, 100);
    // So does one that changes width with the list but keeps its length.
    layOutList(200);
    layOut(2, 35, 30, 200);
    expect(listMetrics.getCellMetrics(1, props)).not.toBeNull();
    expect(listMetrics.getCellMetrics(3, props)).not.toBeNull();
    expect(listMetrics.getHighestMeasuredCellIndex()).toEqual(3);

    // A cell that changes length with its width after the list was resized
    // (e.g. wrapped text) means the unmounted cells would lay out differently
    // too, so only the mounted cells are kept.
    layOut(0, 0, 5, 200);
    expect(listMetrics.getCellMetrics(0, props)).not.toBeNull();
    expect(listMetrics.getCellMetrics(1, props)).toBeNull();
    expect(listMetrics.getCellMetrics(2, props)).not.toBeNull();
    expect(listMetrics.getCellMetrics(3, props)).toBeNull();
    expect(listMetrics.getAverageCellLength()).toEqual(17.5);
    expect(listMetrics.getHighestMeasuredCellIndex()).toEqual(2);
    expect(listMetrics.getCellMetricsApprox(1, props)).toEqual({
      index: 1,
      length: 30,
      offset: 5,
      isMounted: false,
    });
    expect(listMetrics.getCellMetricsApprox(3, props)).toEqual({
      index: 3,
      length: 17.5,
      offset: 65,
      isMounted: false,
    });
  });

  it('keeps unmounted cells when a cell changes size while the list keeps its size', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};
    const props: CellMetricProps = {
      data: Array.from({length: 200}, (_, i) => i),
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };
    listMetrics.notifyListLayout({
      orientation,
      layout: {height: 500, width: 100, x: 0, y: 0},
    });
    // Cell 0 is not stretched across the list.
    for (let i = 0; i < 200; i++) {
      listMetrics.notifyCellLayout({
        cellIndex: i,
        cellKey: String(i),
        orientation,
        layout: {height: 50, width: i === 0 ? 60 : 100, x: 0, y: i * 50},
      });
    }
    for (let i = 10; i < 200; i++) {
      listMetrics.notifyCellUnmounted(String(i));
    }

    // Cell 0 grows on its own, which doesn't change how the other cells lay
    // out.
    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {height: 100, width: 80, x: 0, y: 0},
    });
    expect(listMetrics.getHighestMeasuredCellIndex()).toEqual(199);
    expect(listMetrics.getCellMetrics(199, props)).toEqual({
      index: 199,
      length: 50,
      offset: 9950,
      isMounted: false,
    });
  });

  it('keeps unmounted cells laid out at the current list width', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};
    const props: CellMetricProps = {
      data: [1, 2, 3, 4],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (i: number) => nullthrows(props.data)[i],
    };
    const layOutList = (width: number) =>
      listMetrics.notifyListLayout({
        orientation,
        layout: {height: 500, width, x: 0, y: 0},
      });
    const layOut = (index: number, y: number, height: number, width: number) =>
      listMetrics.notifyCellLayout({
        cellIndex: index,
        cellKey: String(index),
        orientation,
        layout: {height, width, x: 0, y},
      });

    layOutList(100);
    layOut(0, 0, 10, 100);
    layOut(1, 10, 10, 100);
    layOut(2, 20, 10, 100);
    layOut(3, 30, 10, 100);
    listMetrics.notifyCellUnmounted('1');
    listMetrics.notifyCellUnmounted('3');

    // After the list is resized, cell 3 is mounted again and laid out at the
    // new width before cell 0 is.
    layOutList(200);
    layOut(3, 30, 5, 200);
    listMetrics.notifyCellUnmounted('3');
    expect(listMetrics.getCellMetrics(1, props)).toBeNull();

    layOut(0, 0, 5, 200);
    expect(listMetrics.getCellMetrics(3, props)).toEqual({
      index: 3,
      length: 5,
      offset: 30,
      isMounted: false,
    });
    expect(listMetrics.getHighestMeasuredCellIndex()).toEqual(3);
  });

  it('keeps the index of a mounted cell when forgetting an unmounted cell at that index', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};
    const props: CellMetricProps = {
      data: ['a', 'b'],
      getItemCount: () => nullthrows(props.data).length,
      getItem: (data: Array<string>, i: number) => data[i],
      keyExtractor: (item: string) => item,
    };
    const layOutList = (width: number) =>
      listMetrics.notifyListLayout({
        orientation,
        layout: {height: 500, width, x: 0, y: 0},
      });
    const layOut = (
      key: string,
      index: number,
      y: number,
      height: number,
      width: number,
    ) =>
      listMetrics.notifyCellLayout({
        cellIndex: index,
        cellKey: key,
        orientation,
        layout: {height, width, x: 0, y},
      });

    layOutList(100);
    layOut('a', 0, 100, 10, 100);
    layOut('b', 1, 110, 10, 100);

    // The data is replaced, and cell 'x' is laid out at the index of 'a'.
    props.data = ['x', 'y', 'z'];
    listMetrics.notifyCellUnmounted('a');
    listMetrics.notifyCellUnmounted('b');
    layOut('x', 0, 100, 20, 100);

    layOutList(200);
    layOut('x', 0, 100, 40, 200);
    expect(listMetrics.getCellMetricsApprox(1, props)).toEqual({
      index: 1,
      length: 40,
      offset: 140,
      isMounted: false,
    });
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
