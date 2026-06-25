/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_mode dev
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {TimerMock} from '../TimerMock';

import * as Fantom from '@react-native/fantom';

const pendingMocks: Set<TimerMock> = new Set();

function installTimerMock(): TimerMock {
  const mock = Fantom.installTimerMock();
  pendingMocks.add(mock);
  return mock;
}

describe('Fantom timer mocks', () => {
  afterEach(() => {
    for (const mock of pendingMocks) {
      mock.uninstall();
    }
    pendingMocks.clear();
  });

  it('tracks the number of pending timers', () => {
    const timers = installTimerMock();

    expect(timers.getPendingTimerCount()).toBe(0);

    setTimeout(() => {}, 100);
    const cleared = setTimeout(() => {}, 100);

    expect(timers.getPendingTimerCount()).toBe(2);

    clearTimeout(cleared);

    expect(timers.getPendingTimerCount()).toBe(1);

    timers.advanceTimersByTime(100);

    expect(timers.getPendingTimerCount()).toBe(0);
  });

  it('only fires timers that are due when advancing the clock', () => {
    const timers = installTimerMock();
    const callback = jest.fn();

    setTimeout(callback, 100);

    timers.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalledTimes(0);
    expect(timers.getPendingTimerCount()).toBe(1);

    timers.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(timers.getPendingTimerCount()).toBe(0);
  });

  it('fires all pending timers with runAllTimers regardless of delay', () => {
    const timers = installTimerMock();
    const first = jest.fn();
    const second = jest.fn();

    setTimeout(first, 100);
    setTimeout(second, 5000);

    timers.runAllTimers();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(timers.getPendingTimerCount()).toBe(0);
  });

  it('throws an error when installing multiple mocks at the same time', () => {
    installTimerMock();
    expect(() => installTimerMock()).toThrow(
      'Cannot install timer mock because there is another mock installed already. Reuse the same mock or uninstall the previous one first.',
    );
  });

  it('does nothing when uninstalling multiple times', () => {
    const mock = installTimerMock();

    mock.uninstall();
    mock.uninstall();
    mock.uninstall();

    // A fresh mock can be installed again afterwards.
    const next = installTimerMock();
    const callback = jest.fn();
    setTimeout(callback, 100);
    next.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not uninstall other mocks', () => {
    const initialMock = installTimerMock();
    initialMock.uninstall();

    const currentMock = installTimerMock();

    // Uninstalling the already-uninstalled mock must not affect the current one.
    initialMock.uninstall();

    const callback = jest.fn();
    setTimeout(callback, 100);
    currentMock.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
