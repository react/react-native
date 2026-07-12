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

import * as Fantom from '@react-native/fantom';

interface IdleDeadline {
  readonly didTimeout: boolean;
  readonly timeRemaining: () => number;
}

function activeSleep(timeMs: number): void {
  const end = Date.now() + timeMs;
  while (Date.now() < end) {}
}

describe('requestIdleCallback', () => {
  it('should call idle callbacks in a separate task', () => {
    const idleCallback = jest.fn();

    Fantom.runTask(async () => {
      requestIdleCallback(idleCallback);
      expect(idleCallback).not.toHaveBeenCalled();
      queueMicrotask(() => {
        expect(idleCallback).not.toHaveBeenCalled();
      });
    });

    expect(idleCallback).toHaveBeenCalled();
  });

  it('should call idle callbacks with a lower priority', () => {
    let lastCount = 1;
    let idleCallbackOrder;
    let taskOrder;

    const idleCallback = () => {
      idleCallbackOrder = lastCount++;
    };

    const task = () => {
      taskOrder = lastCount++;
    };

    Fantom.runTask(async () => {
      requestIdleCallback(idleCallback);
      Fantom.scheduleTask(task);

      expect(idleCallback).not.toHaveBeenCalled();
      expect(task).not.toHaveBeenCalled();
      queueMicrotask(() => {
        expect(idleCallback).not.toHaveBeenCalled();
        expect(task).not.toHaveBeenCalled();
      });
    });

    expect(taskOrder).toBe(1);
    expect(idleCallbackOrder).toBe(2);
  });

  it('should allow canceling idle callbacks', () => {
    const idleCallback = jest.fn();

    Fantom.runTask(async () => {
      const handle = requestIdleCallback(idleCallback);
      queueMicrotask(() => {
        cancelIdleCallback(handle);
      });
    });

    expect(idleCallback).not.toHaveBeenCalled();
  });

  it('should report time remaining via the idle deadline argument (max time 50ms)', () => {
    const idleCallback = (idleDeadline: IdleDeadline) => {
      expect(idleDeadline.didTimeout).toBe(false);

      const initialTimeRemaining = idleDeadline.timeRemaining();
      expect(initialTimeRemaining).toBeGreaterThan(0);
      expect(initialTimeRemaining).toBeLessThanOrEqual(50);

      activeSleep(20);

      const finalTimeRemaining = idleDeadline.timeRemaining();
      // We slept ~20 ms out of a ~50 ms budget, so at least ~18 ms should
      // have been consumed. We compare against initialTimeRemaining (rather
      // than baking in the 50 ms budget) so the assertion is robust against
      // sub-millisecond drift in the busy-wait sleep.
      expect(finalTimeRemaining).toBeLessThanOrEqual(initialTimeRemaining - 18);
    };

    Fantom.runTask(async () => {
      requestIdleCallback(idleCallback);
    });
  });

  it('should report no time remaining when a higher priority task is scheduled', () => {
    const idleCallback = (idleDeadline: IdleDeadline) => {
      expect(idleDeadline.didTimeout).toBe(false);

      const initialTimeRemaining = idleDeadline.timeRemaining();
      expect(initialTimeRemaining).toBeGreaterThan(0);
      expect(initialTimeRemaining).toBeLessThanOrEqual(50);

      Fantom.scheduleTask(() => {});

      expect(idleDeadline.timeRemaining()).toBe(0);
    };

    Fantom.runTask(async () => {
      requestIdleCallback(idleCallback);
    });
  });

  it('should not yield while executing a low priority task even when scheduling an idle callback', () => {
    const {
      unstable_scheduleCallback,
      unstable_LowPriority,
      unstable_shouldYield,
    } = global.nativeRuntimeScheduler;

    let shouldYieldBeforeSchedulingIdleCallback;
    let shouldYieldAfterSchedulingIdleCallback;

    Fantom.runTask(() => {
      unstable_scheduleCallback(unstable_LowPriority, () => {
        shouldYieldBeforeSchedulingIdleCallback = unstable_shouldYield();

        // Scheduling an idle callback (a lower priority task) must not turn
        // the currently executing low priority task into something that should
        // yield, as no higher priority work is pending.
        requestIdleCallback(() => {});

        shouldYieldAfterSchedulingIdleCallback = unstable_shouldYield();
      });
    });

    expect(shouldYieldBeforeSchedulingIdleCallback).toBe(false);
    expect(shouldYieldAfterSchedulingIdleCallback).toBe(false);
  });

  it('should execute a low priority task scheduled after an idle callback before the idle callback', () => {
    const {unstable_scheduleCallback, unstable_LowPriority} =
      global.nativeRuntimeScheduler;

    const executionOrder: Array<string> = [];

    Fantom.runTask(() => {
      unstable_scheduleCallback(unstable_LowPriority, () => {
        // Even though the idle callback is scheduled first, the low priority
        // task scheduled after it has a higher priority, so it must run first.
        requestIdleCallback(() => {
          executionOrder.push('idleCallback');
        });

        unstable_scheduleCallback(unstable_LowPriority, () => {
          executionOrder.push('lowPriorityTask');
        });
      });
    });

    expect(executionOrder).toEqual(['lowPriorityTask', 'idleCallback']);
  });
});
