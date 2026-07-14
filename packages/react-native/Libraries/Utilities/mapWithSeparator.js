/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

/**
 * Maps an array of items to new values, inserting a separator between items.
 *
 * @template TFrom - Type of input array elements
 * @template TTo - Type of output array elements
 * @param {Array<TFrom>} items - Items to map
 * @param {Function} itemRenderer - Function to render each item: (item, index, items) => TTo
 * @param {Function} spacerRenderer - Function to render separators: (index) => TTo
 * @returns {Array<TTo>} Array with items and separators interleaved
 *
 * @example
 *   mapWithSeparator(['a', 'b', 'c'], x => <Text>{x}</Text>, () => <Comma />)
 *   // Returns: [<Text>a</Text>, <Comma />, <Text>b</Text>, <Comma />, <Text>c</Text>]
 */
function mapWithSeparator<TFrom, TTo>(
  items: Array<TFrom>,
  itemRenderer: (item: TFrom, index: number, items: Array<TFrom>) => TTo,
  spacerRenderer: (index: number) => TTo,
): Array<TTo> {
  const mapped = [];
  if (items.length > 0) {
    mapped.push(itemRenderer(items[0], 0, items));
    for (let ii = 1; ii < items.length; ii++) {
      mapped.push(spacerRenderer(ii - 1), itemRenderer(items[ii], ii, items));
    }
  }
  return mapped;
}

export default mapWithSeparator;
