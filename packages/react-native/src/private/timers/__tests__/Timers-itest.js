/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TimerMock} from '@react-native/fantom';

import * as Fantom from '@react-native/fantom';

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

let timers: TimerMock;

beforeEach(() => {
  timers = Fantom.installTimerMock();
});

afterEach(() => {
  timers.uninstall();
});

describe('setTimeout', () => {
  it('does not fire before the delay elapses', () => {
    const callback = jest.fn();
    setTimeout(callback, 100);

    timers.advanceTimersByTime(99);

    expect(callback).toHaveBeenCalledTimes(0);
  });

  it('fires once after the delay elapses', () => {
    const callback = jest.fn();
    setTimeout(callback, 100);

    timers.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not fire again after firing once', () => {
    const callback = jest.fn();
    setTimeout(callback, 100);

    timers.advanceTimersByTime(1000);
    timers.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('passes additional arguments to the callback', () => {
    const callback = jest.fn();
    setTimeout(callback, 100, 'a', 'b');

    timers.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledWith('a', 'b');
  });

  it('fires multiple timers in order of their due time', () => {
    const calls: Array<string> = [];
    setTimeout(() => calls.push('second'), 200);
    setTimeout(() => calls.push('first'), 100);

    timers.advanceTimersByTime(200);

    expect(calls).toEqual(['first', 'second']);
  });

  it('runs timers scheduled by other timers on the next advance', () => {
    const callback = jest.fn();
    setTimeout(() => {
      setTimeout(callback, 100);
    }, 100);

    timers.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(0);

    timers.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('clearTimeout', () => {
  it('prevents a pending timer from firing', () => {
    const callback = jest.fn();
    const id = setTimeout(callback, 100);

    clearTimeout(id);
    timers.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(0);
  });
});

describe('setInterval', () => {
  it('fires once per interval', () => {
    const callback = jest.fn();
    const id = setInterval(callback, 100);

    timers.advanceTimersByTime(350);

    expect(callback).toHaveBeenCalledTimes(3);

    clearInterval(id);
  });

  it('keeps firing across multiple advances until cleared', () => {
    const callback = jest.fn();
    const id = setInterval(callback, 100);

    timers.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);

    timers.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledTimes(3);

    clearInterval(id);
  });
});

describe('clearInterval', () => {
  it('stops a recurring timer from firing again', () => {
    const callback = jest.fn();
    const id = setInterval(callback, 100);

    timers.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);

    clearInterval(id);
    timers.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
