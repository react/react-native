/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_mode dev
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import VirtualizedList from '@react-native/virtualized-lists/Lists/VirtualizedList';

const VIEWPORT_SIZE = 100;
const ROW_COUNTS = [100000, 250000, 500000, 750000, 1000000];

type StickyHeaderCase = {
  itemCount: number,
  name: string,
  stickyHeaderIndices?: ReadonlyArray<number>,
};

type BenchmarkData = {
  length: number,
};

const benchmarkCases: Array<StickyHeaderCase> = [];

for (let i = 0; i < ROW_COUNTS.length; i++) {
  const itemCount = ROW_COUNTS[i];
  const label = itemCount === 1000000 ? '1m' : `${itemCount / 1000}k`;

  benchmarkCases.push(
    {
      itemCount,
      name: `${label} rows without sticky headers`,
    },
    {
      itemCount,
      name: `${label} rows with empty sticky headers`,
      stickyHeaderIndices: [],
    },
    {
      itemCount,
      name: `${label} rows with one sticky header at the top`,
      stickyHeaderIndices: [0],
    },
  );
}

function createProps(
  itemCount: number,
  stickyHeaderIndices?: ReadonlyArray<number>,
) {
  return {
    data: {length: itemCount},
    getItem: (_data: BenchmarkData, index: number) => index,
    getItemCount: (data: BenchmarkData) => data.length,
    initialScrollIndex: 1,
    stickyHeaderIndices,
  };
}

Fantom.unstable_benchmark
  .suite('VirtualizedList sticky headers', {
    disableOptimizedBuildCheck: true,
    minIterations: 100,
  })
  .test.each(
    benchmarkCases,
    benchmarkCase => `create render mask for ${benchmarkCase.name}`,
    benchmarkCase => {
      // $FlowExpectedError[prop-missing] Benchmark exercises an internal helper.
      VirtualizedList._createRenderMask(
        createProps(benchmarkCase.itemCount, benchmarkCase.stickyHeaderIndices),
        {
          first: benchmarkCase.itemCount - VIEWPORT_SIZE,
          last: benchmarkCase.itemCount - 1,
        },
      );
    },
  );
