/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

declare var PerformanceObserverEntryList: unknown;
declare var EventCounts: unknown;

function expectGlobalDescriptorToMatch(
  name: string,
  expected: {
    enumerable: boolean,
    configurable: boolean,
    writable: boolean,
  },
) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
  if (descriptor == null) {
    throw new Error(`Expected globalThis.${name} to be defined`);
  }
  expect({
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
  }).toEqual(expected);
}

describe('setUpDefaultReactNativeEnvironment (globals)', () => {
  describe('global object', () => {
    it('should be exposed as globalThis, global, window and self', () => {
      expect(globalThis).toBe(global);
      expect(globalThis).toBe(window);
      expect(globalThis).toBe(self);
    });
  });

  describe('property descriptors', () => {
    it('should define window as enumerable but not configurable or writable', () => {
      expectGlobalDescriptorToMatch('window', {
        enumerable: true,
        configurable: false,
        writable: false,
      });
    });

    it('should define self as configurable, enumerable and writable', () => {
      expectGlobalDescriptorToMatch('self', {
        enumerable: true,
        configurable: true,
        writable: true,
      });
    });

    it('should define navigator as configurable and enumerable but not writable', () => {
      expectGlobalDescriptorToMatch('navigator', {
        enumerable: true,
        configurable: true,
        writable: false,
      });
    });

    it('should define Infinity as not configurable, writable or enumerable', () => {
      expectGlobalDescriptorToMatch('Infinity', {
        enumerable: false,
        configurable: false,
        writable: false,
      });
    });

    it('should define NaN as not configurable, writable or enumerable', () => {
      expectGlobalDescriptorToMatch('NaN', {
        enumerable: false,
        configurable: false,
        writable: false,
      });
    });

    it('should define undefined as not configurable, writable or enumerable', () => {
      expectGlobalDescriptorToMatch('undefined', {
        enumerable: false,
        configurable: false,
        writable: false,
      });
    });
  });

  describe('environment', () => {
    it('should provide process.env.NODE_ENV', () => {
      expect(process.env.NODE_ENV).toBe('development');
    });

    it('should provide the __DEV__ constant', () => {
      expect(__DEV__).toBe(true);
    });
  });

  describe('JavaScript language features', () => {
    it('should provide Promise', () => {
      expect(typeof Promise).toBe('function');
    });
  });

  describe('Web APIs', () => {
    describe('DOM', () => {
      it('should provide Node', () => {
        expect(typeof Node).toBe('function');
      });

      it('should provide Document', () => {
        expect(typeof Document).toBe('function');
      });

      it('should provide CharacterData', () => {
        expect(typeof CharacterData).toBe('function');
      });

      it('should provide Text', () => {
        expect(typeof Text).toBe('function');
      });

      it('should provide Element', () => {
        expect(typeof Element).toBe('function');
      });

      it('should provide HTMLElement', () => {
        expect(typeof HTMLElement).toBe('function');
      });

      it('should provide HTMLCollection', () => {
        expect(typeof HTMLCollection).toBe('function');
      });

      it('should provide NodeList', () => {
        expect(typeof NodeList).toBe('function');
      });
    });

    describe('Geometry', () => {
      it('should provide DOMRect', () => {
        expect(typeof DOMRect).toBe('function');
      });

      it('should provide DOMRectReadOnly', () => {
        expect(typeof DOMRectReadOnly).toBe('function');
      });

      it('should provide DOMRectList', () => {
        expect(typeof DOMRectList).toBe('function');
      });
    });

    describe('Events', () => {
      it('should provide Event', () => {
        expect(typeof Event).toBe('function');
      });

      it('should provide EventTarget', () => {
        expect(typeof EventTarget).toBe('function');
      });

      it('should provide CustomEvent', () => {
        expect(typeof CustomEvent).toBe('function');
      });
    });

    describe('Performance', () => {
      it('should provide performance', () => {
        expect(typeof performance).toBe('object');
        expect(performance).not.toBeNull();
      });

      it('should provide Performance', () => {
        expect(typeof Performance).toBe('function');
      });

      it('should provide PerformanceEntry', () => {
        expect(typeof PerformanceEntry).toBe('function');
      });

      it('should provide PerformanceMark', () => {
        expect(typeof PerformanceMark).toBe('function');
      });

      it('should provide PerformanceMeasure', () => {
        expect(typeof PerformanceMeasure).toBe('function');
      });

      it('should provide PerformanceObserver', () => {
        expect(typeof PerformanceObserver).toBe('function');
      });

      it('should provide PerformanceObserverEntryList', () => {
        expect(typeof PerformanceObserverEntryList).toBe('function');
      });

      it('should provide PerformanceEventTiming', () => {
        expect(typeof PerformanceEventTiming).toBe('function');
      });

      it('should provide PerformanceLongTaskTiming', () => {
        expect(typeof PerformanceLongTaskTiming).toBe('function');
      });

      it('should provide PerformanceResourceTiming', () => {
        expect(typeof PerformanceResourceTiming).toBe('function');
      });

      it('should provide EventCounts', () => {
        expect(typeof EventCounts).toBe('function');
      });

      it('should provide TaskAttributionTiming', () => {
        expect(typeof TaskAttributionTiming).toBe('function');
      });
    });

    describe('Timers and microtasks', () => {
      it('should provide setTimeout', () => {
        expect(typeof setTimeout).toBe('function');
      });

      it('should provide clearTimeout', () => {
        expect(typeof clearTimeout).toBe('function');
      });

      it('should provide setInterval', () => {
        expect(typeof setInterval).toBe('function');
      });

      it('should provide clearInterval', () => {
        expect(typeof clearInterval).toBe('function');
      });

      it('should provide setImmediate', () => {
        expect(typeof setImmediate).toBe('function');
      });

      it('should provide clearImmediate', () => {
        expect(typeof clearImmediate).toBe('function');
      });

      it('should provide requestAnimationFrame', () => {
        expect(typeof requestAnimationFrame).toBe('function');
      });

      it('should provide cancelAnimationFrame', () => {
        expect(typeof cancelAnimationFrame).toBe('function');
      });

      it('should provide requestIdleCallback', () => {
        expect(typeof requestIdleCallback).toBe('function');
      });

      it('should provide cancelIdleCallback', () => {
        expect(typeof cancelIdleCallback).toBe('function');
      });

      it('should provide queueMicrotask', () => {
        expect(typeof queueMicrotask).toBe('function');
      });
    });

    describe('Networking', () => {
      it('should provide XMLHttpRequest', () => {
        expect(typeof XMLHttpRequest).toBe('function');
      });

      it('should provide FormData', () => {
        expect(typeof FormData).toBe('function');
      });

      it('should provide fetch', () => {
        expect(typeof fetch).toBe('function');
      });

      it('should provide Headers', () => {
        expect(typeof Headers).toBe('function');
      });

      it('should provide Request', () => {
        expect(typeof Request).toBe('function');
      });

      it('should provide Response', () => {
        expect(typeof Response).toBe('function');
      });

      it('should provide WebSocket', () => {
        expect(typeof WebSocket).toBe('function');
      });

      it('should provide AbortController', () => {
        expect(typeof AbortController).toBe('function');
      });

      it('should provide AbortSignal', () => {
        expect(typeof AbortSignal).toBe('function');
      });

      it('should provide URL', () => {
        expect(typeof URL).toBe('function');
      });

      it('should provide URLSearchParams', () => {
        expect(typeof URLSearchParams).toBe('function');
      });
    });

    describe('File', () => {
      it('should provide Blob', () => {
        expect(typeof Blob).toBe('function');
      });

      it('should provide File', () => {
        expect(typeof File).toBe('function');
      });

      it('should provide FileReader', () => {
        // Note: accessing `FileReader` directly triggers a lazy require that
        // depends on a native module not available in the Fantom test
        // environment. Verify the global property is registered without
        // triggering the lazy getter.
        expect('FileReader' in globalThis).toBe(true);
      });
    });

    describe('Other', () => {
      it('should provide alert', () => {
        expect(typeof alert).toBe('function');
      });

      it('should provide navigator', () => {
        expect(typeof navigator).toBe('object');
        expect(navigator).not.toBeNull();
      });
    });
  });
});
