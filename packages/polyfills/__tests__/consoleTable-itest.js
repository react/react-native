/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const LOG_LEVELS = {
  trace: 0,
  info: 1,
  warn: 2,
  error: 3,
};

describe('console.table(data, rows)', () => {
  let originalNativeLoggingHook;
  let logFn;

  beforeEach(() => {
    originalNativeLoggingHook = global.nativeLoggingHook;
    logFn = global.nativeLoggingHook = jest.fn();
  });

  afterEach(() => {
    global.nativeLoggingHook = originalNativeLoggingHook;
  });

  it('should print the passed array as a Markdown table', () => {
    console.table([
      {name: 'First', value: 500},
      {name: 'Second', value: 600},
      {name: 'Third', value: 700},
      {name: 'Fourth', value: 800, extraValue: true},
    ]);

    expect(logFn).toHaveBeenCalledTimes(1);
    expect(logFn.mock.lastCall).toEqual([
      `
| (index) | name     | value | extraValue |
| ------- | -------- | ----- | ---------- |
| 0       | 'First'  | 500   |            |
| 1       | 'Second' | 600   |            |
| 2       | 'Third'  | 700   |            |
| 3       | 'Fourth' | 800   | true       |`,
      LOG_LEVELS.info,
    ]);
  });

  it('should print the passed dictionary as a Markdown table', () => {
    console.table({
      first: {name: 'First', value: 500},
      second: {name: 'Second', value: 600},
      third: {name: 'Third', value: 700},
      fourth: {name: 'Fourth', value: 800, extraValue: true},
    });

    expect(logFn).toHaveBeenCalledTimes(1);
    expect(logFn.mock.lastCall).toEqual([
      `
| (index) | name     | value | extraValue |
| ------- | -------- | ----- | ---------- |
| first   | 'First'  | 500   |            |
| second  | 'Second' | 600   |            |
| third   | 'Third'  | 700   |            |
| fourth  | 'Fourth' | 800   | true       |`,
      LOG_LEVELS.info,
    ]);
  });

  it('should work with different types of values', () => {
    console.table([
      {
        string: '',
        number: 0,
        boolean: true,
        function: () => {},
        object: {a: 1, b: 2},
        null: null,
        undefined: undefined,
      },
      {
        string: 'a',
        number: 1,
        boolean: true,
        function: () => {},
        object: {a: 1, b: 2},
        null: null,
        undefined: undefined,
      },
      {
        string: 'aa',
        number: 2,
        boolean: false,
        function: () => {},
        object: {a: 1, b: 2},
        null: null,
        undefined: undefined,
      },
      {
        string: 'aaa',
        number: 3,
        boolean: false,
        function: () => {},
        object: {a: 1, b: 2},
        null: null,
        undefined: undefined,
      },
    ]);

    expect(logFn).toHaveBeenCalledTimes(1);
    expect(logFn.mock.lastCall).toEqual([
      `
| (index) | string | number | boolean | function | object | null | undefined |
| ------- | ------ | ------ | ------- | -------- | ------ | ---- | --------- |
| 0       | ''     | 0      | true    | ƒ        | {…}    | null | undefined |
| 1       | 'a'    | 1      | true    | ƒ        | {…}    | null | undefined |
| 2       | 'aa'   | 2      | false   | ƒ        | {…}    | null | undefined |
| 3       | 'aaa'  | 3      | false   | ƒ        | {…}    | null | undefined |`,
      LOG_LEVELS.info,
    ]);
  });

  it('should print the keys in all the objects', () => {
    console.table([
      {name: 'foo'},
      {name: 'bar', value: 1},
      {value: 2, surname: 'baz'},
      {address: 'other'},
    ]);

    expect(logFn).toHaveBeenCalledTimes(1);
    expect(logFn.mock.lastCall).toEqual([
      `
| (index) | name  | value | surname | address |
| ------- | ----- | ----- | ------- | ------- |
| 0       | 'foo' |       |         |         |
| 1       | 'bar' | 1     |         |         |
| 2       |       | 2     | 'baz'   |         |
| 3       |       |       |         | 'other' |`,
      LOG_LEVELS.info,
    ]);
  });

  it('should print an empty string for empty arrays', () => {
    console.table([]);

    expect(logFn).toHaveBeenCalledTimes(1);
    expect(logFn.mock.lastCall).toEqual([``, LOG_LEVELS.info]);
  });

  it('should print an empty string for empty dictionaries', () => {
    console.table({});

    expect(logFn).toHaveBeenCalledTimes(1);
    expect(logFn.mock.lastCall).toEqual([``, LOG_LEVELS.info]);
  });

  // This test is currently failing
  it('should print an indices table for an array of empty objects', () => {
    console.table([{}, {}, {}, {}]);

    expect(logFn).toHaveBeenCalledTimes(1);
    expect(logFn.mock.lastCall).toEqual([
      `
| (index) |
| ------- |
| 0       |
| 1       |
| 2       |
| 3       |`,
      LOG_LEVELS.info,
    ]);
  });

  it('should print an indices table for a dictionary of empty objects', () => {
    console.table({
      first: {},
      second: {},
      third: {},
      fourth: {},
    });

    expect(logFn).toHaveBeenCalledTimes(1);
    expect(logFn.mock.lastCall).toEqual([
      `
| (index) |
| ------- |
| first   |
| second  |
| third   |
| fourth  |`,
      LOG_LEVELS.info,
    ]);
  });

  it('should not modify the logged value', () => {
    global.nativeLoggingHook = jest.fn();

    const array = [
      {name: 'First', value: 500},
      {name: 'Second', value: 600},
      {name: 'Third', value: 700},
      {name: 'Fourth', value: 800, extraValue: true},
    ];
    const originalArrayValue = JSON.parse(JSON.stringify(array));

    console.table(array);

    expect(array).toEqual(originalArrayValue);

    const object = {
      first: {name: 'First', value: 500},
      second: {name: 'Second', value: 600},
      third: {name: 'Third', value: 700},
      fourth: {name: 'Fourth', value: 800, extraValue: true},
    };

    const originalObjectValue = JSON.parse(JSON.stringify(object));

    console.table(object);

    expect(object).toEqual(originalObjectValue);
  });

  it('should only print the selected columns, if specified (arrays)', () => {
    console.table(
      [
        {first: 1, second: 2, third: 3},
        {first: 4, second: 5},
        {third: 7, fourth: 8},
        {fifth: 9},
      ],
      ['first', 'fifth'],
    );
    expect(logFn).toHaveBeenCalledTimes(1);
    expect(logFn.mock.lastCall).toEqual([
      `
| (index) | first | fifth |
| ------- | ----- | ----- |
| 0       | 1     |       |
| 1       | 4     |       |
| 2       |       |       |
| 3       |       | 9     |`,
      LOG_LEVELS.info,
    ]);
  });

  it('should only print the selected columns, if specified (dictionaries)', () => {
    console.table(
      {
        a: {first: 1, second: 2, third: 3},
        b: {first: 4, second: 5},
        c: {third: 7, fourth: 8},
        d: {fifth: 9},
      },
      ['first', 'fifth'],
    );
    expect(logFn).toHaveBeenCalledTimes(1);
    expect(logFn.mock.lastCall).toEqual([
      `
| (index) | first | fifth |
| ------- | ----- | ----- |
| a       | 1     |       |
| b       | 4     |       |
| c       |       |       |
| d       |       | 9     |`,
      LOG_LEVELS.info,
    ]);
  });
});
