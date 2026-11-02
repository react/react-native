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

/**
 * Represents a mocked clock for `HighResTimeStamp` values.
 */
export interface HighResTimeStampMock {
  setTime(now: number): void;
  advanceTimeBy(deltaMs: number): void;
  uninstall(): void;
}

let activeMock: ?HighResTimeStampMock;

/**
 * Installs a mock clock for `HighResTimeStamp` values and returns an object
 * that allows controlling the returned values.
 *
 * @example
 * ```
 * let mockClock;
 *
 * afterEach(() => {
 *   mockClock.uninstall();
 *   mockClock = null;
 * });
 *
 * it('should do something when time passes', () => {
 *   mockClock = Fantom.installHighResTimeStampMock();
 *   mockClock.setTime(10);
 *
 *   doSomething();
 *
 *   mockClock.advanceTimeBy(100);
 *
 *   doSomethingElse();
 *
 *   expect(someSideEffectProduced).toBe(true);
 * });
 * ```
 */
export function installHighResTimeStampMock(): HighResTimeStampMock {
  if (activeMock != null) {
    throw new Error(
      'Cannot install HighResTimeStamp mock because there is another mock installed already. Reuse the same mock or uninstall the previous one first.',
    );
  }

  let mockedTimeStamp = 0;

  const mock: HighResTimeStampMock = {
    setTime: now => {
      if (now < mockedTimeStamp) {
        throw new Error('The mocked time cannot be decreased');
      }
      mockedTimeStamp = now;
      NativeFantom.forceHighResTimeStamp(mockedTimeStamp);
    },
    advanceTimeBy: delta => {
      if (delta < 0) {
        throw new Error('The mocked time cannot be decreased');
      }
      mockedTimeStamp += delta;
      mock.setTime(mockedTimeStamp);
    },
    uninstall: () => {
      if (activeMock === mock) {
        NativeFantom.forceHighResTimeStamp(undefined);
        activeMock = null;
      }
    },
  };

  // Set default value
  mock.setTime(mockedTimeStamp);

  activeMock = mock;

  return mock;
}
