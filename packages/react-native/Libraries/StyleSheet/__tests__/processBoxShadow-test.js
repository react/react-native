/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {BoxShadowValue} from '../StyleSheetTypes';

import processBoxShadow from '../processBoxShadow';
import * as ProcessColor from '../processColor';

describe('processBoxShadow cache', () => {
  it('does not expose cached results to mutation', () => {
    const value = '10px 5px 2px 3px red, inset 1px 2px blue';
    const expectedResult = [
      {
        offsetX: 10,
        offsetY: 5,
        blurRadius: 2,
        spreadDistance: 3,
        color: ProcessColor.default('red'),
      },
      {
        offsetX: 1,
        offsetY: 2,
        color: ProcessColor.default('blue'),
        inset: true,
      },
    ];
    const firstResult = processBoxShadow(value);

    firstResult[0].offsetX = 100;
    firstResult.pop();

    const secondResult = processBoxShadow(value);
    expect(secondResult).toEqual(expectedResult);
    expect(secondResult).not.toBe(firstResult);
    expect(secondResult[0]).not.toBe(firstResult[0]);

    secondResult[0].offsetX = 200;
    secondResult.pop();

    expect(processBoxShadow(value)).toEqual(expectedResult);
  });

  it('does not expose cached invalid results to mutation', () => {
    const value = '1px invalid';
    const firstResult = processBoxShadow(value);

    firstResult.push({offsetX: 1, offsetY: 2});

    const secondResult = processBoxShadow(value);
    expect(secondResult).toEqual([]);
    secondResult.push({offsetX: 3, offsetY: 4});
    expect(processBoxShadow(value)).toEqual([]);
  });

  it('evicts the least recently used string', () => {
    const retainedValue = '98765px 2px';
    const evictedValue = '98764px 2px';
    const processColorSpy = jest.spyOn(ProcessColor, 'default');

    processBoxShadow(evictedValue);
    processBoxShadow(evictedValue);
    processBoxShadow(retainedValue);
    processBoxShadow(retainedValue);

    for (let i = 0; i < 600; i++) {
      processBoxShadow(`${(100000 + i).toString()}px 2px`);
    }
    processBoxShadow(retainedValue);
    for (let i = 600; i < 1100; i++) {
      processBoxShadow(`${(100000 + i).toString()}px 2px`);
    }
    processColorSpy.mockClear();

    processBoxShadow(retainedValue);
    expect(processColorSpy).not.toHaveBeenCalled();
    processBoxShadow(evictedValue);
    expect(processColorSpy).toHaveBeenCalled();
    processColorSpy.mockRestore();
  });

  it('does not cache object inputs', () => {
    const value: Array<BoxShadowValue> = [{offsetX: 1, offsetY: 2}];

    expect(processBoxShadow(value)).toEqual([{offsetX: 1, offsetY: 2}]);
    value[0].offsetX = 3;
    expect(processBoxShadow(value)).toEqual([{offsetX: 3, offsetY: 2}]);
  });
});
