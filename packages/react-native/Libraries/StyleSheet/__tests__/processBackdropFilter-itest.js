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

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {FilterFunction} from '../StyleSheetTypes';

import processColor from '../processColor';

const processFilter = require('../processFilter').default;

describe('processBackdropFilter', () => {
  testStandardFilter('brightness');
  testStandardFilter('opacity');
  testStandardFilter('contrast');
  testStandardFilter('saturate');
  testStandardFilter('grayscale');
  testStandardFilter('sepia');
  testStandardFilter('invert');

  testNumericFilter('blur', 5, [{blur: 5}]);
  testNumericFilter('blur', -5, []);
  testUnitFilter('blur', 5, '%', []);
  testUnitFilter('blur', 5, 'px', [{blur: 5}]);

  testNumericFilter('hue-rotate', 0, [{hueRotate: 0}]);
  testUnitFilter('hue-rotate', 90, 'deg', [{hueRotate: 90}]);
  testUnitFilter('hue-rotate', 1.5708, 'rad', [
    {hueRotate: (180 * 1.5708) / Math.PI},
  ]);
  testUnitFilter('hue-rotate', -90, 'deg', [{hueRotate: -90}]);
  testUnitFilter('hue-rotate', 1.5, 'grad', []);
  testNumericFilter('hue-rotate', 90, []);
  testUnitFilter('hue-rotate', 50, '%', []);

  it('multiple filters (array)', () => {
    expect(
      processFilter([
        {brightness: 0.5},
        {opacity: 0.5},
        {blur: 5},
        {hueRotate: '90deg'},
      ]),
    ).toEqual([{brightness: 0.5}, {opacity: 0.5}, {blur: 5}, {hueRotate: 90}]);
  });

  it('multiple filters (string)', () => {
    expect(
      processFilter('brightness(0.5) opacity(0.5) blur(5px) hue-rotate(90deg)'),
    ).toEqual([{brightness: 0.5}, {opacity: 0.5}, {blur: 5}, {hueRotate: 90}]);
  });

  it('multiple filters — one invalid returns []', () => {
    expect(
      processFilter([
        {brightness: 0.5},
        {opacity: 0.5},
        {blur: 5},
        {hueRotate: '90foo'},
      ]),
    ).toEqual([]);
  });

  it('string multiple filters — one invalid returns []', () => {
    expect(
      processFilter('brightness(0.5) opacity(0.5) blur(5px) hue-rotate(90foo)'),
    ).toEqual([]);
  });

  it('string chained blur + saturate (percentage)', () => {
    expect(processFilter('blur(4px) saturate(150%)')).toEqual([
      {blur: 4},
      {saturate: 1.5},
    ]);
  });

  it('string chained blur + hue-rotate + invert', () => {
    expect(processFilter('blur(3px) hue-rotate(90deg) invert(20%)')).toEqual([
      {blur: 3},
      {hueRotate: 90},
      {invert: 0.2},
    ]);
  });

  it('drop-shadow: string 2-length (offsetX offsetY)', () => {
    expect(processFilter('drop-shadow(4px 4px)')).toEqual([
      {dropShadow: {offsetX: 4, offsetY: 4}},
    ]);
  });

  it('drop-shadow: string 3-length (offsetX offsetY blur)', () => {
    expect(processFilter('drop-shadow(4px 4px 8px)')).toEqual([
      {dropShadow: {offsetX: 4, offsetY: 4, standardDeviation: 8}},
    ]);
  });

  it('drop-shadow: string lengths + named color', () => {
    expect(processFilter('drop-shadow(4px 4px 10px blue)')).toEqual([
      {
        dropShadow: {
          offsetX: 4,
          offsetY: 4,
          standardDeviation: 10,
          color: processColor('blue'),
        },
      },
    ]);
  });

  it('drop-shadow: string color first', () => {
    expect(processFilter('drop-shadow(#ee2233 4px 4px 10px)')).toEqual([
      {
        dropShadow: {
          offsetX: 4,
          offsetY: 4,
          standardDeviation: 10,
          color: processColor('#ee2233'),
        },
      },
    ]);
  });

  it('drop-shadow: string negative offsets', () => {
    expect(processFilter('drop-shadow(-4px -4px)')).toEqual([
      {dropShadow: {offsetX: -4, offsetY: -4}},
    ]);
  });

  it('drop-shadow: string rgba color', () => {
    expect(
      processFilter('drop-shadow(4px 4px 10px rgba(0, 0, 0, 0.8))'),
    ).toEqual([
      {
        dropShadow: {
          offsetX: 4,
          offsetY: 4,
          standardDeviation: 10,
          color: processColor('rgba(0, 0, 0, 0.8)'),
        },
      },
    ]);
  });

  it('drop-shadow: object form', () => {
    expect(
      processFilter([
        {
          dropShadow: {
            offsetX: 4,
            offsetY: 4,
            standardDeviation: '6px',
            color: 'rgba(0,0,0,0.6)',
          },
        },
      ]),
    ).toEqual([
      {
        dropShadow: {
          offsetX: 4,
          offsetY: 4,
          standardDeviation: 6,
          color: processColor('rgba(0,0,0,0.6)'),
        },
      },
    ]);
  });

  it('drop-shadow: negative blur radius is invalid', () => {
    expect(processFilter('drop-shadow(4px 4px -8px)')).toEqual([]);
  });

  it('drop-shadow: comma-separated args are invalid', () => {
    expect(processFilter('drop-shadow(4px, 4px, 10px, red)')).toEqual([]);
  });

  it('drop-shadow: chained with other filters', () => {
    expect(
      processFilter('drop-shadow(4px 4px 10px red) brightness(0.5)'),
    ).toEqual([
      {
        dropShadow: {
          offsetX: 4,
          offsetY: 4,
          standardDeviation: 10,
          color: processColor('red'),
        },
      },
      {brightness: 0.5},
    ]);
  });

  it('url() reference is not supported and returns []', () => {
    // $FlowExpectedError[incompatible-call]
    expect(processFilter('url("filters.svg#filter")')).toEqual([]);
  });

  it('url() mixed with valid filters returns []', () => {
    // $FlowExpectedError[incompatible-call]
    expect(
      processFilter('url("filters.svg#filter") blur(4px) saturate(150%)'),
    ).toEqual([]);
  });

  it('"inherit" is not a valid filter value and returns []', () => {
    // $FlowExpectedError[incompatible-call]
    expect(processFilter('inherit')).toEqual([]);
  });

  it('"initial" is not a valid filter value and returns []', () => {
    // $FlowExpectedError[incompatible-call]
    expect(processFilter('initial')).toEqual([]);
  });

  it('"revert" is not a valid filter value and returns []', () => {
    // $FlowExpectedError[incompatible-call]
    expect(processFilter('revert')).toEqual([]);
  });

  it('"revert-layer" is not a valid filter value and returns []', () => {
    // $FlowExpectedError[incompatible-call]
    expect(processFilter('revert-layer')).toEqual([]);
  });

  it('"unset" is not a valid filter value and returns []', () => {
    // $FlowExpectedError[incompatible-call]
    expect(processFilter('unset')).toEqual([]);
  });

  it('empty array returns []', () => {
    expect(processFilter([])).toEqual([]);
  });

  it('empty string returns []', () => {
    expect(processFilter('')).toEqual([]);
  });

  it('unknown filter name returns []', () => {
    // $FlowExpectedError[incompatible-type]
    expect(processFilter([{foo: 5}])).toEqual([]);
  });

  it('mixed case filter names are accepted', () => {
    expect(processFilter('bRiGhTnEsS(0.5) hUe-RoTaTe(90deg)')).toEqual([
      {brightness: 0.5},
      {hueRotate: 90},
    ]);
  });
});

function testStandardFilter(filter: string): void {
  const value = 0.5;
  const expected = createFilterPrimitive(filter, value);
  const percentExpected = createFilterPrimitive(filter, value / 100);

  testNumericFilter(filter, value, [expected]);
  testNumericFilter(filter, -value, []);
  testUnitFilter(filter, value, 'px', [expected]);
  testUnitFilter(filter, value, '%', [percentExpected]);
}

function testNumericFilter(
  filter: string,
  value: number,
  expected: Array<FilterFunction>,
): void {
  const filterObject = createFilterPrimitive(filter, value);
  const filterString = filter + '(' + value.toString() + ')';

  it(filterString, () => {
    expect(processFilter([filterObject])).toEqual(expected);
  });
  it('string ' + filterString, () => {
    expect(processFilter(filterString)).toEqual(expected);
  });
}

function testUnitFilter(
  filter: string,
  value: number,
  unit: string,
  expected: Array<FilterFunction>,
): void {
  const unitAmount = value + unit;
  const filterObject = createFilterPrimitive(filter, unitAmount);
  const filterString = filter + '(' + unitAmount + ')';

  it(filterString, () => {
    expect(processFilter([filterObject])).toEqual(expected);
  });
  it('string ' + filterString, () => {
    expect(processFilter(filterString)).toEqual(expected);
  });
}

function createFilterPrimitive(
  filter: string,
  value: number | string,
): FilterFunction {
  switch (filter) {
    case 'brightness':
      return {brightness: value};
    case 'blur':
      return {blur: value};
    case 'contrast':
      return {contrast: value};
    case 'grayscale':
      return {grayscale: value};
    case 'hue-rotate':
      return {hueRotate: value};
    case 'invert':
      return {invert: value};
    case 'opacity':
      return {opacity: value};
    case 'saturate':
      return {saturate: value};
    case 'sepia':
      return {sepia: value};
    default:
      throw new Error('Invalid filter: ' + filter);
  }
}
