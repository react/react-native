/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import NativeFantom from '../../../packages/react-native/src/private/testing/fantom/specs/NativeFantom';
import {runWorkLoop} from './index';

/**
 * Controls the deterministic timer mock for `setTimeout`/`setInterval`.
 */
export interface TimerMock {
  // Advances the virtual clock by `deltaMs`, firing every timer that becomes
  // due in order and running the work loop after each one, so each callback
  // runs at its due time and timers it schedules can fire in the same advance.
  advanceTimersByTime(deltaMs: number): void;
  // Fires all pending timers in order, running the work loop after each one
  // (bounded to avoid infinite loops).
  runAllTimers(): void;
  // Returns the number of currently pending (scheduled but not yet fired)
  // timers.
  getPendingTimerCount(): number;
  uninstall(): void;
}

let activeMock: ?TimerMock;

// Safety bound to avoid spinning forever on self-rescheduling or zero-interval
// recurring timers (mirrors jest fake-timer safeguards).
const MAX_TIMER_FIRES = 100000;

/**
 * Installs a deterministic timer mock. While installed, `setTimeout` and
 * `setInterval` callbacks do not fire on their own; they only fire when the
 * virtual clock is advanced via `advanceTimersByTime` or drained via
 * `runAllTimers`. This is the timer equivalent of `installHighResTimeStampMock`.
 *
 * @example
 * ```
 * let timers;
 *
 * afterEach(() => {
 *   timers?.uninstall();
 *   timers = null;
 * });
 *
 * it('fires after the delay elapses', () => {
 *   timers = Fantom.installTimerMock();
 *   const callback = jest.fn();
 *
 *   setTimeout(callback, 100);
 *   timers.advanceTimersByTime(50);
 *   expect(callback).toHaveBeenCalledTimes(0);
 *
 *   timers.advanceTimersByTime(50);
 *   expect(callback).toHaveBeenCalledTimes(1);
 * });
 * ```
 */
export function installTimerMock(): TimerMock {
  if (activeMock != null) {
    throw new Error(
      'Cannot install timer mock because there is another mock installed already. Reuse the same mock or uninstall the previous one first.',
    );
  }

  NativeFantom.setTimerMockEnabled(true);

  const mock: TimerMock = {
    advanceTimersByTime: deltaMs => {
      let remainingMs = deltaMs;
      for (
        let fires = 0;
        fires < MAX_TIMER_FIRES && remainingMs >= 0;
        fires++
      ) {
        remainingMs = NativeFantom.advanceTimersToNextDue(remainingMs);
        runWorkLoop();
      }
    },
    runAllTimers: () => {
      for (let fires = 0; fires < MAX_TIMER_FIRES; fires++) {
        const fired = NativeFantom.runNextTimer();
        runWorkLoop();
        if (!fired) {
          break;
        }
      }
    },
    getPendingTimerCount: () => NativeFantom.getPendingTimerCount(),
    uninstall: () => {
      if (activeMock === mock) {
        NativeFantom.setTimerMockEnabled(false);
        activeMock = null;
      }
    },
  };

  activeMock = mock;

  return mock;
}
