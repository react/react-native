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

import type {PerformanceObserverCallbackOptions} from '../PerformanceObserver';

import * as Fantom from '@react-native/fantom';

function ensurePerformanceLongTaskTiming(
  value: unknown,
): PerformanceLongTaskTiming {
  if (!(value instanceof PerformanceLongTaskTiming)) {
    throw new Error(
      `Expected instance of PerformanceLongTaskTiming but got ${String(value)}`,
    );
  }

  return value;
}

let observer: ?PerformanceObserver;
let pendingHighResTimeStampMock: ?Fantom.HighResTimeStampMock;

function installHighResTimeStampMock() {
  pendingHighResTimeStampMock = Fantom.installHighResTimeStampMock();
  return pendingHighResTimeStampMock;
}

describe('LongTasks API', () => {
  afterEach(() => {
    if (observer) {
      Fantom.runTask(() => {
        observer?.disconnect();
        observer = null;
      });
    }

    if (pendingHighResTimeStampMock) {
      pendingHighResTimeStampMock.uninstall();
      pendingHighResTimeStampMock = null;
    }
  });

  it('does NOT report short tasks (under 50ms)', () => {
    const callback = jest.fn();

    const mockClock = installHighResTimeStampMock();

    mockClock.setTime(0);

    Fantom.runTask(() => {
      observer = new PerformanceObserver(callback);
      observer.observe({entryTypes: ['longtask']});
    });

    expect(callback).not.toHaveBeenCalled();

    Fantom.runTask(() => {
      // Short task.
      mockClock.advanceTimeBy(10);
    });

    expect(callback).not.toHaveBeenCalled();

    Fantom.runTask(() => {
      // Slightly longer task, but still not long.
      mockClock.advanceTimeBy(40);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('reports long tasks (over 50ms)', () => {
    const callback = jest.fn();

    const mockClock = installHighResTimeStampMock();

    Fantom.runTask(() => {
      observer = new PerformanceObserver(callback);
      observer.observe({entryTypes: ['longtask']});
    });

    expect(callback).not.toHaveBeenCalled();

    mockClock.setTime(10);

    Fantom.runTask(() => {
      // Long task.
      mockClock.advanceTimeBy(51);
    });

    expect(callback).toHaveBeenCalledTimes(1);

    const [entries, _observer, options] = callback.mock
      .lastCall as $FlowFixMe as [
      PerformanceObserverEntryList,
      PerformanceObserver,
      PerformanceObserverCallbackOptions,
    ];

    expect(_observer).toBe(observer);
    expect(options).toEqual({droppedEntriesCount: 0});

    const allEntries = entries.getEntries();
    expect(allEntries.length).toBe(1);
    expect(allEntries[0]).toBeInstanceOf(PerformanceLongTaskTiming);

    const entry = ensurePerformanceLongTaskTiming(allEntries[0]);

    expect(entry.name).toBe('self');
    expect(entry.entryType).toBe('longtask');
    expect(entry.startTime).toBe(10);
    expect(entry.duration).toBe(51);
    expect(entry.attribution).toEqual([]);
  });

  describe('tasks that yield', () => {
    it('should NOT be reported if they are longer than 50ms but had yielding opportunities in intervals shorter than 50ms', () => {
      const callback = jest.fn();

      const mockClock = installHighResTimeStampMock();

      Fantom.runTask(() => {
        observer = new PerformanceObserver(callback);
        observer.observe({entryTypes: ['longtask']});
      });

      expect(callback).not.toHaveBeenCalled();

      const shouldYield = global.nativeRuntimeScheduler.unstable_shouldYield;

      mockClock.setTime(10);

      Fantom.runTask(() => {
        mockClock.advanceTimeBy(30);
        shouldYield();
        mockClock.advanceTimeBy(30);
        shouldYield();
        mockClock.advanceTimeBy(30);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should be reported if running for longer than 50ms between yielding opportunities', () => {
      const callback = jest.fn();

      const mockClock = installHighResTimeStampMock();

      Fantom.runTask(() => {
        observer = new PerformanceObserver(callback);
        observer.observe({entryTypes: ['longtask']});
      });

      expect(callback).not.toHaveBeenCalled();

      const shouldYield = global.nativeRuntimeScheduler.unstable_shouldYield;

      mockClock.setTime(10);

      Fantom.runTask(() => {
        mockClock.advanceTimeBy(40);
        shouldYield();
        mockClock.advanceTimeBy(51); // long interval without yielding
        shouldYield();
        mockClock.advanceTimeBy(40);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      const entries = callback.mock.lastCall[0] as PerformanceObserverEntryList;
      const allEntries = entries.getEntries();
      expect(allEntries.length).toBe(1);

      const entry = ensurePerformanceLongTaskTiming(allEntries[0]);
      expect(entry.name).toBe('self');
      expect(entry.entryType).toBe('longtask');
      expect(entry.startTime).toBe(10);
      expect(entry.duration).toBe(131);
      expect(entry.attribution).toEqual([]);
    });
  });

  it('does NOT allow creating instances of PerformanceLongTaskTiming directly', () => {
    expect(() => {
      return new PerformanceLongTaskTiming();
    }).toThrow(
      "Failed to construct 'PerformanceLongTaskTiming': Illegal constructor",
    );
  });

  it('does NOT allow creating instances of TaskAttributionTiming directly', () => {
    expect(() => {
      return new TaskAttributionTiming();
    }).toThrow(
      "Failed to construct 'TaskAttributionTiming': Illegal constructor",
    );
  });
});
