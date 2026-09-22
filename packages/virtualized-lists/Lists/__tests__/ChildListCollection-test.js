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

import ChildListCollection from '../ChildListCollection';

describe('ChildListCollection', function () {
  it('iterates over all child lists with forEach', function () {
    const collection = new ChildListCollection<string>();
    collection.add('a', 'cell1');
    collection.add('b', 'cell1');
    collection.add('c', 'cell2');

    const visited = [];
    collection.forEach(list => {
      visited.push(list);
    });
    expect(visited.sort()).toEqual(['a', 'b', 'c']);
    expect(collection.size()).toBe(3);
  });

  it('does not call the callback when the collection is empty', function () {
    const collection = new ChildListCollection<string>();
    const callback = jest.fn();
    collection.forEach(callback);
    expect(callback).not.toHaveBeenCalled();
    expect(collection.size()).toBe(0);
  });

  it('stops iterating entries after they are removed', function () {
    const collection = new ChildListCollection<string>();
    collection.add('a', 'cell1');
    collection.remove('a');

    const visited = [];
    collection.forEach(list => {
      visited.push(list);
    });
    expect(visited).toEqual([]);
    expect(collection.size()).toBe(0);
  });

  it('supports forEachInCell and anyInCell', function () {
    const collection = new ChildListCollection<string>();
    collection.add('a', 'cell1');
    collection.add('b', 'cell2');

    const visited = [];
    collection.forEachInCell('cell1', list => {
      visited.push(list);
    });
    expect(visited).toEqual(['a']);

    expect(collection.anyInCell('cell2', list => list === 'b')).toBe(true);
    expect(collection.anyInCell('cell1', list => list === 'b')).toBe(false);
    expect(collection.anyInCell('missing', () => true)).toBe(false);
  });
});
