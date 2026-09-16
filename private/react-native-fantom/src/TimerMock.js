/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {runWorkLoop} from './index';
import NativeFantom from 'react-native/src/private/testing/fantom/specs/NativeFantom';

/**
 * Controls the deterministic timer mock for `setTimeout`/`setInterval`.
 */
export interface TimerMock {
  // Advances the virtual clock by `deltaMs`, firing every timer that becomes
  // due (in order), then runs the work loop so the callbacks execute.
  advanceTimersByTime(deltaMs: number): void;
  // Fires all pending timers (bounded to avoid infinite loops), then runs the
  // work loop so the callbacks execute.
  runAllTimers(): void;
  // Returns the number of currently pending (scheduled but not yet fired)
  // timers.
  getPendingTimerCount(): number;
  uninstall(): void;
}

let activeMock: ?TimerMock;

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
      NativeFantom.advanceTimers(deltaMs);
      runWorkLoop();
    },
    runAllTimers: () => {
      NativeFantom.runAllTimers();
      runWorkLoop();
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
