/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import {CellRenderMask} from '../CellRenderMask';

describe('CellRenderMask', () => {
  it('throws when constructed with invalid size', () => {
    expect(() => new CellRenderMask(-1)).toThrow();
  });

  it('allows creation of empty mask', () => {
    const renderMask = new CellRenderMask(0);
    expect(renderMask.enumerateRegions()).toEqual([]);
  });

  it('allows creation of single-cell mask', () => {
    const renderMask = new CellRenderMask(1);
    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 0, isSpacer: true},
    ]);
  });

  it('throws when adding invalid cell ranges', () => {
    const renderMask = new CellRenderMask(5);

    expect(() => renderMask.addCells({first: -2, last: -1})).toThrow();
    expect(() => renderMask.addCells({first: -2, last: 0})).toThrow();
    expect(() => renderMask.addCells({first: 0, last: 5})).toThrow();
    expect(() => renderMask.addCells({first: 6, last: 7})).toThrow();
  });

  it('allows adding single cell at beginning', () => {
    const renderMask = new CellRenderMask(5);
    renderMask.addCells({first: 0, last: 0});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 0, isSpacer: false},
      {first: 1, last: 4, isSpacer: true},
    ]);
  });

  it('allows adding single cell at end', () => {
    const renderMask = new CellRenderMask(5);
    renderMask.addCells({first: 4, last: 4});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 3, isSpacer: true},
      {first: 4, last: 4, isSpacer: false},
    ]);
  });

  it('allows adding single cell in middle', () => {
    const renderMask = new CellRenderMask(5);
    renderMask.addCells({first: 2, last: 2});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 1, isSpacer: true},
      {first: 2, last: 2, isSpacer: false},
      {first: 3, last: 4, isSpacer: true},
    ]);
  });

  it('allows marking entire cell range', () => {
    const renderMask = new CellRenderMask(5);
    renderMask.addCells({first: 0, last: 4});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 4, isSpacer: false},
    ]);
  });

  it('allows adding empty cell range', () => {
    const renderMask = new CellRenderMask(5);
    renderMask.addCells({first: 0, last: -1});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 4, isSpacer: true},
    ]);
  });

  it('correctly replaces fragmented cell ranges', () => {
    const renderMask = new CellRenderMask(10);

    renderMask.addCells({first: 3, last: 3});
    renderMask.addCells({first: 5, last: 7});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 2, isSpacer: true},
      {first: 3, last: 3, isSpacer: false},
      {first: 4, last: 4, isSpacer: true},
      {first: 5, last: 7, isSpacer: false},
      {first: 8, last: 9, isSpacer: true},
    ]);

    renderMask.addCells({first: 3, last: 7});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 2, isSpacer: true},
      {first: 3, last: 7, isSpacer: false},
      {first: 8, last: 9, isSpacer: true},
    ]);
  });

  it('left-expands region', () => {
    const renderMask = new CellRenderMask(5);

    renderMask.addCells({first: 3, last: 3});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 2, isSpacer: true},
      {first: 3, last: 3, isSpacer: false},
      {first: 4, last: 4, isSpacer: true},
    ]);

    renderMask.addCells({first: 2, last: 3});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 1, isSpacer: true},
      {first: 2, last: 3, isSpacer: false},
      {first: 4, last: 4, isSpacer: true},
    ]);
  });

  it('right-expands region', () => {
    const renderMask = new CellRenderMask(5);

    renderMask.addCells({first: 3, last: 3});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 2, isSpacer: true},
      {first: 3, last: 3, isSpacer: false},
      {first: 4, last: 4, isSpacer: true},
    ]);

    renderMask.addCells({first: 3, last: 4});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 2, isSpacer: true},
      {first: 3, last: 4, isSpacer: false},
    ]);
  });

  it('left+right expands region', () => {
    const renderMask = new CellRenderMask(5);

    renderMask.addCells({first: 3, last: 3});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 2, isSpacer: true},
      {first: 3, last: 3, isSpacer: false},
      {first: 4, last: 4, isSpacer: true},
    ]);

    renderMask.addCells({first: 2, last: 4});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 1, isSpacer: true},
      {first: 2, last: 4, isSpacer: false},
    ]);
  });

  it('does nothing when adding existing cells', () => {
    const renderMask = new CellRenderMask(5);

    renderMask.addCells({first: 2, last: 3});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 1, isSpacer: true},
      {first: 2, last: 3, isSpacer: false},
      {first: 4, last: 4, isSpacer: true},
    ]);

    renderMask.addCells({first: 3, last: 3});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 1, isSpacer: true},
      {first: 2, last: 3, isSpacer: false},
      {first: 4, last: 4, isSpacer: true},
    ]);
  });

  describe('numCells', () => {
    it('returns 0 for empty mask', () => {
      expect(new CellRenderMask(0).numCells()).toBe(0);
    });

    it('returns the size passed to the constructor', () => {
      expect(new CellRenderMask(1).numCells()).toBe(1);
      expect(new CellRenderMask(10).numCells()).toBe(10);
    });

    it('is unaffected by addCells calls', () => {
      const renderMask = new CellRenderMask(5);
      renderMask.addCells({first: 1, last: 3});
      expect(renderMask.numCells()).toBe(5);
    });
  });

  describe('equals', () => {
    it('returns true for two identical fresh masks', () => {
      expect(new CellRenderMask(5).equals(new CellRenderMask(5))).toBe(true);
    });

    it('returns false when masks have different sizes', () => {
      expect(new CellRenderMask(3).equals(new CellRenderMask(5))).toBe(false);
    });

    it('returns true after applying identical addCells operations', () => {
      const a = new CellRenderMask(10);
      const b = new CellRenderMask(10);
      a.addCells({first: 2, last: 5});
      b.addCells({first: 2, last: 5});
      expect(a.equals(b)).toBe(true);
    });

    it('returns false when regions differ', () => {
      const a = new CellRenderMask(10);
      const b = new CellRenderMask(10);
      a.addCells({first: 2, last: 5});
      b.addCells({first: 3, last: 5});
      expect(a.equals(b)).toBe(false);
    });

    it('returns false when one mask has more regions than the other', () => {
      const a = new CellRenderMask(10);
      const b = new CellRenderMask(10);
      // a has two non-spacer regions; b has one
      a.addCells({first: 1, last: 2});
      a.addCells({first: 7, last: 8});
      b.addCells({first: 1, last: 8});
      expect(a.equals(b)).toBe(false);
    });

    it('is reflexive', () => {
      const mask = new CellRenderMask(5);
      mask.addCells({first: 1, last: 3});
      expect(mask.equals(mask)).toBe(true);
    });
  });
});
