/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

export default function stringifyViewConfig(viewConfig: unknown): string {
  // $FlowFixMe[incompatible-type] JSON.stringify can return void; preserves prior behavior (returns the result directly, not coerced to '')
  return JSON.stringify(
    viewConfig,
    (key, val) => {
      if (typeof val === 'function') {
        return `ƒ ${val.name}`;
      }
      return val;
    },
    2,
  );
}
