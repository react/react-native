/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @fantom_mode *
 */

const LOG_LEVELS = {
  trace: 0,
  info: 1,
  warn: 2,
  error: 3,
};

describe('console.time / console.timeEnd / console.timeLog', () => {
  let originalNativeLoggingHook;
  let logFn;

  beforeEach(() => {
    originalNativeLoggingHook = global.nativeLoggingHook;
    logFn = global.nativeLoggingHook = jest.fn();
  });

  afterEach(() => {
    global.nativeLoggingHook = originalNativeLoggingHook;
  });

  it('should log elapsed time on timeEnd', () => {
    console.time('test');
    console.timeEnd('test');

    expect(logFn).toHaveBeenCalledTimes(1);
    const message = logFn.mock.calls[0][0];
    expect(message).toMatch(/^test: \d+(\.\d+)?ms$/);
    expect(logFn.mock.calls[0][1]).toBe(LOG_LEVELS.info);
  });

  it('should use "default" label when none is provided', () => {
    console.time();
    console.timeEnd();

    const message = logFn.mock.calls[0][0];
    expect(message).toMatch(/^default: \d+(\.\d+)?ms$/);
  });

  it('should warn when starting a timer that already exists', () => {
    console.time('dup');
    console.time('dup');

    expect(logFn).toHaveBeenCalledWith(
      'Timer "dup" already exists',
      LOG_LEVELS.warn,
    );

    // Clean up
    console.timeEnd('dup');
  });

  it('should warn when ending a timer that does not exist', () => {
    console.timeEnd('nonexistent');

    expect(logFn).toHaveBeenCalledWith(
      'Timer "nonexistent" does not exist',
      LOG_LEVELS.warn,
    );
  });

  it('should log elapsed time with timeLog without stopping the timer', () => {
    console.time('ongoing');
    console.timeLog('ongoing');
    console.timeLog('ongoing');
    console.timeEnd('ongoing');

    // timeLog called twice + timeEnd called once = 3 info logs
    expect(logFn).toHaveBeenCalledTimes(3);
    for (let i = 0; i < 3; i++) {
      expect(logFn.mock.calls[i][0]).toMatch(/^ongoing: \d+(\.\d+)?ms/);
    }
  });

  it('should warn when calling timeLog on a nonexistent timer', () => {
    console.timeLog('ghost');

    expect(logFn).toHaveBeenCalledWith(
      'Timer "ghost" does not exist',
      LOG_LEVELS.warn,
    );
  });

  it('should support multiple concurrent timers', () => {
    console.time('a');
    console.time('b');
    console.timeEnd('a');
    console.timeEnd('b');

    expect(logFn).toHaveBeenCalledTimes(2);
    expect(logFn.mock.calls[0][0]).toMatch(/^a: /);
    expect(logFn.mock.calls[1][0]).toMatch(/^b: /);
  });
});

describe('console.count / console.countReset', () => {
  let originalNativeLoggingHook;
  let logFn;

  beforeEach(() => {
    originalNativeLoggingHook = global.nativeLoggingHook;
    logFn = global.nativeLoggingHook = jest.fn();
  });

  afterEach(() => {
    global.nativeLoggingHook = originalNativeLoggingHook;
  });

  it('should increment and log the count', () => {
    console.count('clicks');
    console.count('clicks');
    console.count('clicks');

    expect(logFn).toHaveBeenCalledTimes(3);
    expect(logFn.mock.calls[0][0]).toBe('clicks: 1');
    expect(logFn.mock.calls[1][0]).toBe('clicks: 2');
    expect(logFn.mock.calls[2][0]).toBe('clicks: 3');
  });

  it('should use "default" label when none is provided', () => {
    console.count();

    expect(logFn.mock.calls[0][0]).toMatch(/^default: \d+$/);
  });

  it('should reset the count', () => {
    console.count('resets');
    console.count('resets');
    console.countReset('resets');
    console.count('resets');

    expect(logFn.mock.calls[2][0]).toBe('resets: 1');
  });

  it('should warn when resetting a nonexistent counter', () => {
    console.countReset('nope');

    expect(logFn).toHaveBeenCalledWith(
      'Count for "nope" does not exist',
      LOG_LEVELS.warn,
    );
  });

  it('should track separate labels independently', () => {
    console.count('a');
    console.count('b');
    console.count('a');

    expect(logFn.mock.calls[0][0]).toBe('a: 1');
    expect(logFn.mock.calls[1][0]).toBe('b: 1');
    expect(logFn.mock.calls[2][0]).toBe('a: 2');
  });
});
