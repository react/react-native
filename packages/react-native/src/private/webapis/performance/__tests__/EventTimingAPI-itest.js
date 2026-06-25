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

import MaybeNativePerformance from '../specs/NativePerformance';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import {useState} from 'react';
import {Text, View} from 'react-native';

const NativePerformance = nullthrows(MaybeNativePerformance);

function sleep(ms: number) {
  const end = performance.now() + ms;
  while (performance.now() < end) {}
}

function ensurePerformanceEventTiming(value: unknown): PerformanceEventTiming {
  if (!(value instanceof PerformanceEventTiming)) {
    throw new Error(
      `Expected instance of PerformanceEventTiming but got ${String(value)}`,
    );
  }

  return value;
}

describe('Event Timing API', () => {
  it('reports events without event handlers or updates', () => {
    const callback = jest.fn();

    const observer = new PerformanceObserver(callback);
    observer.observe({type: 'event', durationThreshold: 0});

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<View />);
    });

    const element = nullthrows(root.document.documentElement.firstElementChild);

    expect(callback).not.toHaveBeenCalled();

    Fantom.dispatchNativeEvent(element, 'click');

    expect(callback).toHaveBeenCalledTimes(1);

    const entryList = callback.mock.lastCall[0] as PerformanceObserverEntryList;
    const entries = entryList.getEntries();

    expect(entries.length).toBe(1);

    const entry = ensurePerformanceEventTiming(entries[0]);

    expect(entry.entryType).toBe('event');
    expect(entry.name).toBe('click');

    expect(entry.startTime).toBeGreaterThanOrEqual(0);
    expect(entry.processingStart).toBeGreaterThan(entry.startTime);
    expect(entry.processingEnd).toBeGreaterThanOrEqual(entry.processingStart);

    expect(entry.duration).toBeGreaterThanOrEqual(0);
    expect(entry.duration).toBeGreaterThan(
      entry.processingEnd - entry.startTime,
    );

    expect(entry.interactionId).toBeGreaterThanOrEqual(0);
  });

  it('reports events with handlers but no updates', () => {
    const callback = jest.fn();

    const observer = new PerformanceObserver(callback);
    observer.observe({type: 'event', durationThreshold: 0});

    const SIMULATED_PROCESSING_DELAY = 50;

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <View
          onClick={event => {
            sleep(SIMULATED_PROCESSING_DELAY);
          }}
        />,
      );
    });

    const element = nullthrows(root.document.documentElement.firstElementChild);

    expect(callback).not.toHaveBeenCalled();

    Fantom.dispatchNativeEvent(element, 'click');

    expect(callback).toHaveBeenCalledTimes(1);

    const entryList = callback.mock.lastCall[0] as PerformanceObserverEntryList;
    const entries = entryList.getEntries();

    expect(entries.length).toBe(1);

    const entry = ensurePerformanceEventTiming(entries[0]);

    expect(entry.entryType).toBe('event');
    expect(entry.name).toBe('click');

    expect(entry.startTime).toBeGreaterThanOrEqual(0);
    expect(entry.processingStart).toBeGreaterThan(entry.startTime);
    expect(entry.processingEnd).toBeGreaterThanOrEqual(entry.processingStart);

    expect(entry.processingEnd - entry.processingStart).toBeGreaterThanOrEqual(
      SIMULATED_PROCESSING_DELAY,
    );

    expect(entry.duration).toBeGreaterThanOrEqual(0);
    expect(entry.duration).toBeGreaterThan(
      entry.processingEnd - entry.startTime,
    );

    expect(entry.interactionId).toBeGreaterThanOrEqual(0);
  });

  it('reports events with updates', () => {
    const callback = jest.fn();

    const observer = new PerformanceObserver(callback);
    observer.observe({type: 'event', durationThreshold: 0});

    function MyComponent() {
      const [count, setCount] = useState(0);

      return (
        <View
          onClick={event => {
            setCount(count + 1);
          }}>
          <Text>{count}</Text>
        </View>
      );
    }

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<MyComponent />);
    });

    const element = nullthrows(root.document.documentElement.firstElementChild);

    expect(callback).not.toHaveBeenCalled();

    Fantom.dispatchNativeEvent(element, 'click');

    expect(callback).toHaveBeenCalledTimes(1);

    const entryList = callback.mock.lastCall[0] as PerformanceObserverEntryList;
    const entries = entryList.getEntries();

    expect(entries.length).toBe(1);

    const entry = ensurePerformanceEventTiming(entries[0]);

    expect(entry.entryType).toBe('event');
    expect(entry.name).toBe('click');

    expect(entry.startTime).toBeGreaterThanOrEqual(0);
    expect(entry.processingStart).toBeGreaterThan(entry.startTime);
    expect(entry.processingEnd).toBeGreaterThanOrEqual(entry.processingStart);

    expect(entry.duration).toBeGreaterThanOrEqual(0);
    expect(entry.duration).toBeGreaterThan(
      entry.processingEnd - entry.startTime,
    );

    // TODO: When Fantom provides structured data from mounting manager, add timestamp to operations and verify that the duration includes that.

    expect(entry.interactionId).toBeGreaterThanOrEqual(0);
  });

  it('provides the event timeStamp as startTime', () => {
    const callback = jest.fn();

    const observer = new PerformanceObserver(callback);
    observer.observe({type: 'event', durationThreshold: 0});

    let eventTimeStamp;

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <View
          onClick={event => {
            eventTimeStamp = event.timeStamp;
          }}
        />,
      );
    });

    const element = nullthrows(root.document.documentElement.firstElementChild);

    expect(callback).not.toHaveBeenCalled();

    Fantom.dispatchNativeEvent(element, 'click');

    expect(callback).toHaveBeenCalledTimes(1);

    const entryList = callback.mock.lastCall[0] as PerformanceObserverEntryList;
    const entries = entryList.getEntries();

    expect(entries.length).toBe(1);

    const entry = ensurePerformanceEventTiming(entries[0]);

    expect(eventTimeStamp).not.toBeUndefined();
    expect(entry.startTime).toBe(eventTimeStamp);
  });

  it('reports number of dispatched events via performance.eventCounts', () => {
    NativePerformance.clearEventCountsForTesting?.();

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<View />);
    });

    const element = nullthrows(root.document.documentElement.firstElementChild);

    expect(performance.eventCounts).not.toBeInstanceOf(Map);

    // FIXME: this isn't spec compliant, as the map should be prepopulated with
    // all the supported event names mapped to 0.
    expect(performance.eventCounts.size).toBe(0);
    expect([...performance.eventCounts.entries()]).toEqual([]);
    const initialForEachCallback = jest.fn();
    performance.eventCounts.forEach(initialForEachCallback);
    expect(initialForEachCallback.mock.calls).toEqual([]);
    expect([...performance.eventCounts.keys()]).toEqual([]);
    expect([...performance.eventCounts.values()]).toEqual([]);

    Fantom.dispatchNativeEvent(element, 'click');
    Fantom.dispatchNativeEvent(element, 'click');
    Fantom.dispatchNativeEvent(element, 'click');

    Fantom.dispatchNativeEvent(element, 'pointerDown');
    Fantom.dispatchNativeEvent(element, 'pointerUp');

    expect(performance.eventCounts.size).toBe(3);
    expect(performance.eventCounts.get('click')).toBe(3);
    expect(performance.eventCounts.get('pointerdown')).toBe(1);
    expect(performance.eventCounts.get('pointerup')).toBe(1);

    expect([...performance.eventCounts.entries()]).toEqual([
      ['pointerup', 1],
      ['pointerdown', 1],
      ['click', 3],
    ]);

    const forEachCallback = jest.fn();
    performance.eventCounts.forEach(forEachCallback);
    expect(forEachCallback.mock.calls).toEqual([
      [1, 'pointerup', performance.eventCounts],
      [1, 'pointerdown', performance.eventCounts],
      [3, 'click', performance.eventCounts],
    ]);

    expect([...performance.eventCounts.keys()]).toEqual([
      'pointerup',
      'pointerdown',
      'click',
    ]);

    expect([...performance.eventCounts.values()]).toEqual([1, 1, 3]);
  });

  it('does NOT allow creating instances of PerformanceEventTiming directly', () => {
    expect(() => {
      return new PerformanceEventTiming();
    }).toThrow(
      "Failed to construct 'PerformanceEventTiming': Illegal constructor",
    );
  });

  it('does NOT allow creating instances of EventCounts directly', () => {
    expect(() => {
      // $FlowExpectedError[cannot-resolve-name]
      return new EventCounts();
    }).toThrow("Failed to construct 'EventCounts': Illegal constructor");
  });

  describe('durationThreshold option', () => {
    it('works when used with `type`', () => {
      const callback = jest.fn();

      const observer = new PerformanceObserver(callback);
      observer.observe({type: 'event', durationThreshold: 50});

      let forceDelay = false;

      function MyComponent() {
        const [count, setCount] = useState(0);

        return (
          <View
            onClick={event => {
              if (forceDelay) {
                sleep(50);
              }
              setCount(count + 1);
            }}>
            <Text>{count}</Text>
          </View>
        );
      }

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<MyComponent />);
      });

      const element = nullthrows(
        root.document.documentElement.firstElementChild,
      );

      expect(callback).not.toHaveBeenCalled();

      Fantom.dispatchNativeEvent(element, 'click');

      expect(callback).toHaveBeenCalledTimes(0);

      forceDelay = true;

      Fantom.dispatchNativeEvent(element, 'click');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('defaults to 104ms for event entries per W3C spec', () => {
      const callback = jest.fn();

      const observer = new PerformanceObserver(callback);
      observer.observe({type: 'event'});

      let forceDelay = false;

      function MyComponent() {
        const [count, setCount] = useState(0);

        return (
          <View
            onClick={event => {
              if (forceDelay) {
                sleep(104);
              }
              setCount(count + 1);
            }}>
            <Text>{count}</Text>
          </View>
        );
      }

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<MyComponent />);
      });

      const element = nullthrows(
        root.document.documentElement.firstElementChild,
      );

      expect(callback).not.toHaveBeenCalled();

      Fantom.dispatchNativeEvent(element, 'click');

      expect(callback).toHaveBeenCalledTimes(0);

      forceDelay = true;

      Fantom.dispatchNativeEvent(element, 'click');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('throws when used together with `entryTypes`', () => {
      const observer = new PerformanceObserver(() => {});

      expect(() => {
        observer.observe({
          entryTypes: ['event', 'mark'],
          durationThreshold: 100,
        });
      }).toThrow(
        `Failed to execute 'observe' on 'PerformanceObserver': An observe() call must not include both entryTypes and durationThreshold arguments.`,
      );
    });
  });
});
