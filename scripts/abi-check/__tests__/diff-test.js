/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const {diffLayouts} = require('../diff');

describe('diffLayouts', () => {
  test('reports nothing for identical maps', () => {
    const layouts = new Map([
      ['L facebook::react::Point', '0 | int x'],
      ['V facebook::react::Shape', '2 | double area() const'],
    ]);

    expect(diffLayouts(layouts, new Map(layouts))).toEqual({
      changed: [],
      removed: [],
      added: [],
    });
  });

  test('separates changed, removed and added keys', () => {
    const base = new Map([
      ['L facebook::react::Point', '0 | int x'],
      ['V facebook::react::Shape', '2 | double area() const'],
      ['E facebook::react::Color', 'Red = 0'],
      ['L facebook::react::Gone', '0 | int x'],
    ]);
    const current = new Map([
      ['L facebook::react::Point', '0 | double x'],
      ['V facebook::react::Shape', '2 | double perimeter() const'],
      ['E facebook::react::Color', 'Red = 0'],
      ['L facebook::react::New', '0 | int x'],
    ]);

    expect(diffLayouts(base, current)).toEqual({
      changed: ['L facebook::react::Point', 'V facebook::react::Shape'],
      removed: ['L facebook::react::Gone'],
      added: ['L facebook::react::New'],
    });
  });

  test('sorts the keys in each list', () => {
    const base = new Map([
      ['L facebook::react::Zeta', '0 | int x'],
      ['L facebook::react::Alpha', '0 | int x'],
      ['L facebook::react::Omega', '0 | int x'],
      ['L facebook::react::Beta', '0 | int x'],
    ]);
    const current = new Map([
      ['L facebook::react::Zeta', '0 | long x'],
      ['L facebook::react::Alpha', '0 | long x'],
      ['L facebook::react::Yankee', '0 | int x'],
      ['L facebook::react::Charlie', '0 | int x'],
    ]);

    expect(diffLayouts(base, current)).toEqual({
      changed: ['L facebook::react::Alpha', 'L facebook::react::Zeta'],
      removed: ['L facebook::react::Beta', 'L facebook::react::Omega'],
      added: ['L facebook::react::Charlie', 'L facebook::react::Yankee'],
    });
  });
});
