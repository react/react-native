/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import invariant from 'invariant';

export default class ChildListCollection<TList> {
  _cellKeyToChildren: Map<string, Set<TList>> = new Map();
  _childrenToCellKey: Map<TList, string> = new Map();

  add(list: TList, cellKey: string): void {
    invariant(
      !this._childrenToCellKey.has(list),
      'Trying to add already present child list',
    );

    const cellLists = this._cellKeyToChildren.get(cellKey) ?? new Set();
    cellLists.add(list);
    this._cellKeyToChildren.set(cellKey, cellLists);

    this._childrenToCellKey.set(list, cellKey);
  }

  remove(list: TList): void {
    const cellKey = this._childrenToCellKey.get(list);
    invariant(cellKey != null, 'Trying to remove non-present child list');
    this._childrenToCellKey.delete(list);

    const cellLists = this._cellKeyToChildren.get(cellKey);
    invariant(cellLists, '_cellKeyToChildren should contain cellKey');
    cellLists.delete(list);

    if (cellLists.size === 0) {
      this._cellKeyToChildren.delete(cellKey);
    }
  }

  forEach(fn: TList => void): void {
    // Fast-path for the common case of a list without nested child lists,
    // which avoids allocating a Map iterator on every scroll event.
    if (this._cellKeyToChildren.size === 0) {
      return;
    }
    for (const listSet of this._cellKeyToChildren.values()) {
      for (const list of listSet) {
        fn(list);
      }
    }
  }

  forEachInCell(cellKey: string, fn: TList => void): void {
    const listSet = this._cellKeyToChildren.get(cellKey) ?? [];
    for (const list of listSet) {
      fn(list);
    }
  }

  anyInCell(cellKey: string, fn: TList => boolean): boolean {
    const listSet = this._cellKeyToChildren.get(cellKey) ?? [];
    for (const list of listSet) {
      if (fn(list)) {
        return true;
      }
    }
    return false;
  }

  size(): number {
    return this._childrenToCellKey.size;
  }
}
