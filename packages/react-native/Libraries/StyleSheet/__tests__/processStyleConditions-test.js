/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {
  compileConditionalValue,
  isConditionalValue,
  parseMediaQuery,
} from '../processStyleConditions';

const DARK = '@media (prefers-color-scheme: dark)';
const LIGHT = '@media (prefers-color-scheme: light)';

describe('parseMediaQuery', () => {
  it('parses both color schemes', () => {
    expect(parseMediaQuery(DARK)).toEqual({colorScheme: 'dark'});
    expect(parseMediaQuery(LIGHT)).toEqual({colorScheme: 'light'});
  });

  it('ignores case and extra whitespace', () => {
    expect(parseMediaQuery('@MEDIA (Prefers-Color-Scheme: DARK)')).toEqual({
      colorScheme: 'dark',
    });
    expect(
      parseMediaQuery('  @media( prefers-color-scheme :  dark )  '),
    ).toEqual({colorScheme: 'dark'});
  });

  it('requires @media', () => {
    expect(parseMediaQuery('(prefers-color-scheme: dark)')).toBe(null);
    expect(parseMediaQuery('@mediax (prefers-color-scheme: dark)')).toBe(null);
  });

  it('rejects other values and features', () => {
    expect(parseMediaQuery('@media (prefers-color-scheme: blue)')).toBe(null);
    expect(parseMediaQuery('@media (prefers-color-scheme: )')).toBe(null);
    expect(parseMediaQuery('@media (orientation: landscape)')).toBe(null);
    expect(parseMediaQuery('@media (min-width: 600px)')).toBe(null);
  });

  it('rejects media types, not, and and', () => {
    expect(
      parseMediaQuery('@media screen and (prefers-color-scheme: dark)'),
    ).toBe(null);
    expect(parseMediaQuery('@media not (prefers-color-scheme: dark)')).toBe(
      null,
    );
    expect(parseMediaQuery(`${DARK} and (prefers-color-scheme: dark)`)).toBe(
      null,
    );
  });

  it('rejects invalid syntax', () => {
    expect(parseMediaQuery('')).toBe(null);
    expect(parseMediaQuery('@media')).toBe(null);
    expect(parseMediaQuery('@media prefers-color-scheme: dark')).toBe(null);
  });
});

describe('compileConditionalValue', () => {
  let consoleError;
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleError.mockRestore();
  });

  it('splits the default from the conditions', () => {
    expect(
      compileConditionalValue(
        {default: 'white', [DARK]: 'black'},
        'backgroundColor',
      ),
    ).toEqual({
      default: 'white',
      conditions: [{query: {colorScheme: 'dark'}, value: 'black'}],
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('keeps the written order', () => {
    expect(
      compileConditionalValue(
        {default: 1, [LIGHT]: 0.8, [DARK]: 0.5},
        'opacity',
      ),
    ).toEqual({
      default: 1,
      conditions: [
        {query: {colorScheme: 'light'}, value: 0.8},
        {query: {colorScheme: 'dark'}, value: 0.5},
      ],
    });
  });

  it('allows a null default', () => {
    expect(
      compileConditionalValue({default: null, [DARK]: 'black'}, 'color'),
    ).toEqual({
      default: null,
      conditions: [{query: {colorScheme: 'dark'}, value: 'black'}],
    });
  });

  it('allows a default without conditions', () => {
    expect(compileConditionalValue({default: 1}, 'opacity')).toEqual({
      default: 1,
      conditions: [],
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('skips unsupported keys and keeps the rest', () => {
    expect(
      compileConditionalValue(
        {default: 1, '@media (orientation: landscape)': 0.2, [DARK]: 0.5},
        'opacity',
      ),
    ).toEqual({
      default: 1,
      conditions: [{query: {colorScheme: 'dark'}, value: 0.5}],
    });
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('"@media (orientation: landscape)"'),
    );
  });

  it('rejects a value without a default', () => {
    expect(compileConditionalValue({[DARK]: 'black'}, 'color')).toBe(null);
    expect(
      compileConditionalValue({default: undefined, [DARK]: 'black'}, 'color'),
    ).toBe(null);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("needs a 'default' key"),
    );
  });
});

describe('isConditionalValue', () => {
  it('detects objects with a default or an @media key', () => {
    expect(isConditionalValue({default: 'white', [DARK]: 'black'})).toBe(true);
    expect(isConditionalValue({default: 'white'})).toBe(true);
    expect(isConditionalValue({[DARK]: 'black'})).toBe(true);
  });

  it('ignores other values', () => {
    expect(isConditionalValue(100)).toBe(false);
    expect(isConditionalValue('red')).toBe(false);
    expect(isConditionalValue(null)).toBe(false);
    expect(isConditionalValue([{translateX: 10}])).toBe(false);
    expect(isConditionalValue({width: 1, height: 2})).toBe(false);
  });
});
