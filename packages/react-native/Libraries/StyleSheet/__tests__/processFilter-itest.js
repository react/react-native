/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {FilterFunction} from '../StyleSheetTypes';

import processColor from '../processColor';
import processFilter from '../processFilter';

describe('processFilter', () => {
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

  it('multiple filters', () => {
    expect(
      processFilter([
        {brightness: 0.5},
        {opacity: 0.5},
        {blur: 5},
        {hueRotate: '90deg'},
      ]),
    ).toEqual([{brightness: 0.5}, {opacity: 0.5}, {blur: 5}, {hueRotate: 90}]);
  });
  it('multiple filters one invalid', () => {
    expect(
      processFilter([
        {brightness: 0.5},
        {opacity: 0.5},
        {blur: 5},
        {hueRotate: '90foo'},
      ]),
    ).toEqual([]);
  });
  it('multiple same filters', () => {
    expect(
      processFilter([
        {brightness: 0.5},
        {brightness: 0.5},
        {brightness: 0.5},
        {brightness: 0.5},
      ]),
    ).toEqual([
      {brightness: 0.5},
      {brightness: 0.5},
      {brightness: 0.5},
      {brightness: 0.5},
    ]);
  });

  it('should parse mixed case filters', () => {
    expect(
      processFilter(
        'brIGhTneSs(0.5) hUE-rOTatE(90deg) briGhtNess(0.5) Brightness(0.5)',
      ),
    ).toEqual([
      {brightness: 0.5},
      {hueRotate: 90},
      {brightness: 0.5},
      {brightness: 0.5},
    ]);
  });

  it('empty', () => {
    expect(processFilter([])).toEqual([]);
  });
  it('Non filter', () => {
    // $FlowExpectedError[incompatible-type]
    expect(processFilter([{foo: 5}])).toEqual([]);
  });
  it('Invalid amount type', () => {
    // $FlowExpectedError[incompatible-type]
    expect(processFilter([{brightness: {}}])).toEqual([]);
  });
  it('string multiple filters', () => {
    expect(
      processFilter('brightness(0.5) opacity(0.5) blur(5px) hue-rotate(90deg)'),
    ).toEqual([{brightness: 0.5}, {opacity: 0.5}, {blur: 5}, {hueRotate: 90}]);
  });
  it('string multiple filters with newlines', () => {
    expect(
      processFilter(
        'brightness(0.5)\n   opacity(0.5)\n   blur(5)\n   hue-rotate(90deg)',
      ),
    ).toEqual([{brightness: 0.5}, {opacity: 0.5}, {blur: 5}, {hueRotate: 90}]);
  });
  it('string multiple filters one invalid', () => {
    expect(
      processFilter('brightness(0.5) opacity(0.5) blur(5px) hue-rotate(90foo)'),
    ).toEqual([]);
  });
  it('string multiple same filters', () => {
    expect(
      processFilter(
        'brightness(0.5) brightness(0.5) brightness(0.5) brightness(0.5)',
      ),
    ).toEqual([
      {brightness: 0.5},
      {brightness: 0.5},
      {brightness: 0.5},
      {brightness: 0.5},
    ]);
  });
  it('string empty', () => {
    expect(processFilter('')).toEqual([]);
  });
  it('string non filter', () => {
    // $FlowExpectedError[incompatible-call]
    expect(processFilter('foo: 5')).toEqual([]);
  });
  it('string invalid amount type', () => {
    // $FlowExpectedError[incompatible-call]
    expect(processFilter('brightness: {}')).toEqual([]);
  });
  it('string brightness(.5)', () => {
    // $FlowExpectedError[incompatible-call]
    expect(processFilter('brightness(.5)')).toEqual([{brightness: 0.5}]);
  });

  testDropShadow();
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

function testDropShadow() {
  it('should parse string drop-shadow', () => {
    expect(processFilter('drop-shadow(4px 4px 10px red)')).toEqual([
      {
        dropShadow: {
          offsetX: 4,
          offsetY: 4,
          color: processColor('red'),
          standardDeviation: 10,
        },
      },
    ]);
  });

  it('should parse string negative offsets drop-shadow', () => {
    expect(processFilter('drop-shadow(-4px -4px)')).toEqual([
      {
        dropShadow: {
          offsetX: -4,
          offsetY: -4,
        },
      },
    ]);
  });

  it('should parse string multiple drop-shadows', () => {
    expect(
      processFilter(
        'drop-shadow(4px 4px) drop-shadow(4px 4px) drop-shadow(4px 4px)',
      ),
    ).toEqual([
      {
        dropShadow: {
          offsetX: 4,
          offsetY: 4,
        },
      },
      {
        dropShadow: {
          offsetX: 4,
          offsetY: 4,
        },
      },
      {
        dropShadow: {
          offsetX: 4,
          offsetY: 4,
        },
      },
    ]);
  });

  it('should parse string drop-shadow with random whitespaces', () => {
    expect(
      processFilter('    drop-shadow(4px  4px   10px        red)    '),
    ).toEqual([
      {
        dropShadow: {
          offsetX: 4,
          offsetY: 4,
          color: processColor('red'),
          standardDeviation: 10,
        },
      },
    ]);
  });

  it('should parse string drop-shadow with multiple filters', () => {
    expect(
      processFilter(
        'drop-shadow(4px 4px 10px red) brightness(0.5) brightness(0.5)',
      ),
    ).toEqual([
      {
        dropShadow: {
          offsetX: 4,
          offsetY: 4,
          color: processColor('red'),
          standardDeviation: 10,
        },
      },
      {brightness: 0.5},
      {brightness: 0.5},
    ]);
  });

  it('should parse string drop-shadow with color', () => {
    expect(processFilter('drop-shadow(50px 50px purple)')).toEqual([
      {
        dropShadow: {
          offsetX: 50,
          offsetY: 50,
          color: processColor('purple'),
        },
      },
    ]);
  });

  it('should parse string drop-shadow with rgba color', () => {
    expect(processFilter('drop-shadow(50px 50px rgba(0, 0, 0, 1))')).toEqual([
      {
        dropShadow: {
          offsetX: 50,
          offsetY: 50,
          color: processColor('rgba(0, 0, 0, 1)'),
        },
      },
    ]);
  });

  it('should parse string with mixed case drop-shadow', () => {
    expect(processFilter('DroP-sHaDOw(50px 50px purple)')).toEqual([
      {
        dropShadow: {
          offsetX: 50,
          offsetY: 50,
          color: processColor('purple'),
        },
      },
    ]);
  });

  it('should parse object drop-shadow', () => {
    expect(
      processFilter([
        {
          dropShadow: {
            offsetX: 4,
            offsetY: 4,
            color: '#FFFFFF',
            standardDeviation: '10px',
          },
        },
      ]),
    ).toEqual([
      {
        dropShadow: {
          offsetX: 4,
          offsetY: 4,
          standardDeviation: 10,
          color: processColor('#FFFFFF'),
        },
      },
    ]);
  });

  it('should fail to parse string comma separated drop-shadow', () => {
    expect(processFilter('drop-shadow(4px, 4px, 10px, red)')).toEqual([]);
  });

  it('should fail to parse other symbols after args comma separated drop-shadow', () => {
    expect(processFilter('drop-shadow(4& 4* 10$ red)')).toEqual([]);
  });

  it('should fail on color between lengths string drop-shadow', () => {
    expect(processFilter('drop-shadow(10px red 10px 10px')).toEqual([]);
  });

  it('should fail on color between offset & blur string drop-shadow', () => {
    expect(processFilter('drop-shadow(10px 10px red  10px')).toEqual([]);
  });

  it('should fail on negative blue', () => {
    expect(processFilter('drop-shadow(10px 10px -10px')).toEqual([]);
  });

  it('should fail on invalid object drop-shadow', () => {
    expect(
      // $FlowExpectedError[incompatible-type]
      processFilter([
        {dropShadow: {offsetX: 4, offsetY: 5, invalid: 'invalid arg'}},
      ]),
    ).toEqual([]);
  });

  it('should fail on invalid argument for drop-shadow object', () => {
    expect(
      // $FlowExpectedError[incompatible-type]
      processFilter([{dropShadow: 8}]),
    ).toEqual([]);
  });
}
