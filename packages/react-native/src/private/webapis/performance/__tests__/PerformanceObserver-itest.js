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

import {PerformanceObserverEntryList_public} from '../PerformanceObserver';
import * as Fantom from '@react-native/fantom';

describe('PerformanceObserver', () => {
  it('receives notifications for marks and measures', () => {
    const callback = jest.fn();
    const observer = new PerformanceObserver(callback);
    observer.observe({entryTypes: ['mark', 'measure']});

    expect(callback).not.toHaveBeenCalled();

    let mark1;
    let mark2;
    let measure1;
    let measure2;

    Fantom.runTask(() => {
      mark1 = performance.mark('mark1', {startTime: 20});
      mark2 = performance.mark('mark2', {startTime: 10});
      measure1 = performance.measure('measure1', {
        start: 50,
        duration: 20,
      });
      measure2 = performance.measure('measure2', {
        start: 15,
        duration: 10,
      });

      // The notification should be dispatched asynchronously.
      expect(callback).not.toHaveBeenCalled();

      Fantom.scheduleTask(() => {
        // The notification should be dispatched with a low priority.
        expect(callback).not.toHaveBeenCalled();
      });
    });

    expect(callback).toHaveBeenCalledTimes(1);

    const entries: PerformanceObserverEntryList = callback.mock.calls[0][0];

    // Sorted by startTime.
    expect(entries.getEntries()).toEqual([mark2, measure2, mark1, measure1]);

    // Sorted by startTime.
    expect(entries.getEntriesByName('mark1')).toEqual([mark1]);

    // Sorted by startTime.
    expect(entries.getEntriesByType('mark')).toEqual([mark2, mark1]);

    expect(callback.mock.calls[0][1]).toBe(observer);
  });

  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('provides the same performance entry references from mark/measure to all observers', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const observer1 = new PerformanceObserver(callback1);
    const observer2 = new PerformanceObserver(callback2);
    observer1.observe({entryTypes: ['mark', 'measure']});
    observer2.observe({entryTypes: ['mark', 'measure']});

    let mark;
    let measure;

    Fantom.runTask(() => {
      mark = performance.mark('mark', {startTime: 20});
      measure = performance.measure('measure', {
        start: 25,
        duration: 10,
      });
    });

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);

    const entries1: PerformanceObserverEntryList = callback1.mock.calls[0][0];
    const entries2: PerformanceObserverEntryList = callback2.mock.calls[0][0];

    expect(entries1.getEntries()[0]).toBe(mark);
    expect(entries2.getEntries()[0]).toBe(mark);

    expect(entries1.getEntries()[1]).toBe(measure);
    expect(entries2.getEntries()[1]).toBe(measure);
  });

  describe('observe()', () => {
    it('rejects invalid entry type option combinations before registering with native', () => {
      const callback = jest.fn();
      const observer = new PerformanceObserver(callback);

      // $FlowExpectedError[incompatible-call]
      expect(() => observer.observe()).toThrow(
        "Failed to execute 'observe' on 'PerformanceObserver': 1 argument required, but only 0 present.",
      );
      expect(() => observer.observe({})).toThrow(
        "Failed to execute 'observe' on 'PerformanceObserver': An observe() call must include either entryTypes or type arguments.",
      );
      expect(() =>
        observer.observe({entryTypes: ['mark'], type: 'measure'}),
      ).toThrow(
        "Failed to execute 'observe' on 'PerformanceObserver': An observe() call must not include both entryTypes and type arguments.",
      );
      expect(() =>
        observer.observe({entryTypes: ['mark'], buffered: true}),
      ).toThrow(
        "Failed to execute 'observe' on 'PerformanceObserver': An observe() call must not include both entryTypes and buffered arguments.",
      );
    });
  });

  describe('takeRecords()', () => {
    it('provides all buffered events and clears the buffer', () => {
      const callback = jest.fn();
      const observer = new PerformanceObserver(callback);
      observer.observe({entryTypes: ['mark']});

      Fantom.runTask(() => {
        const entry = performance.mark('mark1');

        const entries = observer.takeRecords();
        expect(entries.length).toBe(1);
        // This is not supported yet
        // expect(entries[0]).toBe(entry);
        expect(entries[0]).toEqual(entry);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  it('does NOT allow creating instances of PerformanceObserverEntryList directly', () => {
    expect(() => {
      // $FlowExpectedError[incompatible-type]
      return new PerformanceObserverEntryList_public();
    }).toThrow(
      "Failed to construct 'PerformanceObserverEntryList': Illegal constructor",
    );
  });
});
