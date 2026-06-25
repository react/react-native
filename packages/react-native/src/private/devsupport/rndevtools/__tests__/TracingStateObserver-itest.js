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

import TracingStateObserver from '../TracingStateObserver';

describe('TracingStateObserver', () => {
  beforeEach(() => {
    delete global.__TRACING_STATE_OBSERVER__;
  });

  describe('without native support', () => {
    it('isTracing returns false when native observer is not available', () => {
      expect(TracingStateObserver.isTracing()).toBe(false);
    });

    it('subscribe returns a no-op unsubscribe when native observer is not available', () => {
      const callback = jest.fn();
      const unsubscribe = TracingStateObserver.subscribe(callback);

      expect(typeof unsubscribe).toBe('function');

      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('with native support', () => {
    beforeEach(() => {
      const mockSubscribers = new Set<(isTracing: boolean) => void>();
      global.__TRACING_STATE_OBSERVER__ = {
        isTracing: false,
        subscribers: mockSubscribers,
        onTracingStateChange: (isTracing: boolean) => {
          global.__TRACING_STATE_OBSERVER__.isTracing = isTracing;
          mockSubscribers.forEach(callback => callback(isTracing));
        },
      };
    });

    it('isTracing returns current tracing state', () => {
      expect(TracingStateObserver.isTracing()).toBe(false);

      global.__TRACING_STATE_OBSERVER__.onTracingStateChange(true);
      expect(TracingStateObserver.isTracing()).toBe(true);

      global.__TRACING_STATE_OBSERVER__.onTracingStateChange(false);
      expect(TracingStateObserver.isTracing()).toBe(false);
    });

    it('subscribe adds callback to subscribers and returns unsubscribe function', () => {
      const callback = jest.fn();

      const unsubscribe = TracingStateObserver.subscribe(callback);

      expect(global.__TRACING_STATE_OBSERVER__.subscribers.has(callback)).toBe(
        true,
      );

      global.__TRACING_STATE_OBSERVER__.onTracingStateChange(true);
      expect(callback).toHaveBeenCalledWith(true);

      unsubscribe();
      expect(global.__TRACING_STATE_OBSERVER__.subscribers.has(callback)).toBe(
        false,
      );

      const callsAfterUnsubscribe = callback.mock.calls.length;
      global.__TRACING_STATE_OBSERVER__.onTracingStateChange(false);
      expect(callback.mock.calls.length).toBe(callsAfterUnsubscribe);
    });

    it('multiple subscribers receive state changes', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      TracingStateObserver.subscribe(callback1);
      TracingStateObserver.subscribe(callback2);

      global.__TRACING_STATE_OBSERVER__.onTracingStateChange(true);

      expect(callback1).toHaveBeenCalledWith(true);
      expect(callback2).toHaveBeenCalledWith(true);
    });
  });

  describe('with late native support installation', () => {
    it('detects native global installed after module load', () => {
      expect(TracingStateObserver.isTracing()).toBe(false);

      const mockSubscribers = new Set<(isTracing: boolean) => void>();
      global.__TRACING_STATE_OBSERVER__ = {
        isTracing: true,
        subscribers: mockSubscribers,
        onTracingStateChange: (isTracing: boolean) => {
          global.__TRACING_STATE_OBSERVER__.isTracing = isTracing;
          mockSubscribers.forEach(cb => cb(isTracing));
        },
      };

      expect(TracingStateObserver.isTracing()).toBe(true);
    });

    it('subscribes when native global is installed after module load', () => {
      const mockSubscribers = new Set<(isTracing: boolean) => void>();
      global.__TRACING_STATE_OBSERVER__ = {
        isTracing: false,
        subscribers: mockSubscribers,
        onTracingStateChange: (isTracing: boolean) => {
          global.__TRACING_STATE_OBSERVER__.isTracing = isTracing;
          mockSubscribers.forEach(cb => cb(isTracing));
        },
      };

      const callback = jest.fn();
      TracingStateObserver.subscribe(callback);

      expect(mockSubscribers.has(callback)).toBe(true);

      global.__TRACING_STATE_OBSERVER__.onTracingStateChange(true);
      expect(callback).toHaveBeenCalledWith(true);
    });
  });
});
