/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import FillRateHelper from '../FillRateHelper';

let rowFramesGlobal: ?{
  [string]: Readonly<{
    height: number,
    isMounted: boolean,
    y: number,
  }>,
};
const dataGlobal = [
  {key: 'header'},
  {key: 'a'},
  {key: 'b'},
  {key: 'c'},
  {key: 'd'},
  {key: 'footer'},
];
function getCellMetrics(index: number) {
  if (rowFramesGlobal == null) {
    throw new Error('Expected `rowFramesGlobal` to have been initialized.');
  }
  const frame = rowFramesGlobal[dataGlobal[index].key];
  return {length: frame.height, offset: frame.y, isMounted: frame.isMounted};
}

function computeResult({
  helper,
  state,
  scroll,
}: Readonly<{
  helper: FillRateHelper,
  state?: Readonly<{
    first?: number,
    last?: number,
  }>,
  scroll?: Readonly<{
    offset?: number,
    visibleLength?: number,
  }>,
}>): number {
  helper.activate();
  return helper.computeBlankness(
    {
      data: dataGlobal,
      getItem: () => {
        throw new Error('Unexpected call to `getItem`.');
      },
      getItemCount: data2 => data2.length,
      initialNumToRender: 10,
    },
    {first: 1, last: 2, ...(state ?? {})},
    {dOffset: 0, offset: 0, velocity: 0, visibleLength: 100, ...(scroll ?? {})},
  );
}

describe('computeBlankness', function () {
  beforeEach(() => {
    FillRateHelper.setSampleRate(1);
    FillRateHelper.setMinSampleCount(0);
  });

  it('computes correct blankness of viewport', function () {
    // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
    const helper = new FillRateHelper({getCellMetrics});
    rowFramesGlobal = {
      header: {y: 0, height: 0, isMounted: true},
      a: {y: 0, height: 50, isMounted: true},
      b: {y: 50, height: 50, isMounted: true},
    };
    let blankness = computeResult({helper});
    expect(blankness).toBe(0);
    blankness = computeResult({helper, state: {last: 1}});
    expect(blankness).toBe(0.5);
    blankness = computeResult({helper, scroll: {offset: 25}});
    expect(blankness).toBe(0.25);
    blankness = computeResult({helper, scroll: {visibleLength: 400}});
    expect(blankness).toBe(0.75);
    blankness = computeResult({helper, scroll: {offset: 100}});
    expect(blankness).toBe(1);
  });

  it('skips frames that are not in layout', function () {
    // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
    const helper = new FillRateHelper({getCellMetrics});
    rowFramesGlobal = {
      header: {y: 0, height: 0, isMounted: false},
      a: {y: 0, height: 10, isMounted: false},
      b: {y: 10, height: 30, isMounted: true},
      c: {y: 40, height: 40, isMounted: true},
      d: {y: 80, height: 20, isMounted: false},
      footer: {y: 100, height: 0, isMounted: false},
    };
    const blankness = computeResult({helper, state: {last: 4}});
    expect(blankness).toBe(0.3);
  });

  it('sampling rate can disable', function () {
    // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
    let helper = new FillRateHelper({getCellMetrics});
    rowFramesGlobal = {
      header: {y: 0, height: 0, isMounted: true},
      a: {y: 0, height: 40, isMounted: true},
      b: {y: 40, height: 40, isMounted: true},
    };
    let blankness = computeResult({helper});
    expect(blankness).toBe(0.2);

    FillRateHelper.setSampleRate(0);

    // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
    helper = new FillRateHelper({getCellMetrics});
    blankness = computeResult({helper});
    expect(blankness).toBe(0);
  });

  it('can handle multiple listeners and unsubscribe', function () {
    const listeners = [jest.fn(), jest.fn(), jest.fn()];
    const subscriptions = listeners.map(listener =>
      FillRateHelper.addListener(listener),
    );
    subscriptions[1].remove();
    // $FlowFixMe[incompatible-type] - Invalid `ListMetricsAggregator`.
    const helper = new FillRateHelper({getCellMetrics});
    rowFramesGlobal = {
      header: {y: 0, height: 0, isMounted: true},
      a: {y: 0, height: 40, isMounted: true},
      b: {y: 40, height: 40, isMounted: true},
    };
    const blankness = computeResult({helper});
    expect(blankness).toBe(0.2);
    helper.deactivateAndFlush();
    const info0 = listeners[0].mock.calls[0][0];
    expect(info0.pixels_blank / info0.pixels_sampled).toBe(blankness);
    expect(listeners[1]).not.toBeCalled();
    const info1 = listeners[2].mock.calls[0][0];
    expect(info1.pixels_blank / info1.pixels_sampled).toBe(blankness);
  });
});
