/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {LayoutMap} from './normalize';

export type LayoutDiff = {
  changed: Array<string>,
  removed: Array<string>,
  added: Array<string>,
};

/**
 * Compares two normalized layout maps. Each list holds sorted keys. `changed`
 * and `removed` are ABI breaks; `added` is not.
 */
function diffLayouts(base: LayoutMap, current: LayoutMap): LayoutDiff {
  const changed = [];
  const removed = [];
  for (const [key, value] of base) {
    if (!current.has(key)) {
      removed.push(key);
    } else if (current.get(key) !== value) {
      changed.push(key);
    }
  }
  const added = [...current.keys()].filter(key => !base.has(key));
  return {
    changed: changed.sort(),
    removed: removed.sort(),
    added: added.sort(),
  };
}

module.exports = {diffLayouts};
