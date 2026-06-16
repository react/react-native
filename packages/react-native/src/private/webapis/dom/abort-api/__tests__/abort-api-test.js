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

import {AbortController} from '../AbortController';
import {AbortSignal} from '../AbortSignal';
import Event from 'react-native/src/private/webapis/dom/events/Event';
import EventTarget from 'react-native/src/private/webapis/dom/events/EventTarget';

let listenerCallOrder = 0;

type EventRecordingListener = JestMockFn<[Event], void> & {
  eventData?: {
    callOrder: number,
    composedPath: ReadonlyArray<EventTarget>,
    currentTarget: Event['currentTarget'],
    eventPhase: Event['eventPhase'],
    target: Event['target'],
  },
  ...
};

function createListener(
  implementation?: Event => void,
): EventRecordingListener {
  // $FlowExpectedError[incompatible-type]
  const listener: EventRecordingListener = jest.fn((event: Event) => {
    listener.eventData = {
      callOrder: listenerCallOrder++,
      composedPath: event.composedPath(),
      currentTarget: event.currentTarget,
      eventPhase: event.eventPhase,
      target: event.target,
    };

    if (implementation) {
      implementation(event);
    }
  });

  return listener;
}

describe('AbortController', () => {
  let controller: AbortController;

  beforeEach(() => {
    controller = new AbortController();
  });

  it('should not be callable', () => {
    expect(() => {
      // $FlowExpectedError[constructor-as-function]
      AbortController();
    }).toThrow(TypeError);
  });

  it('should have 2 properties', () => {
    const keys = new Set(['signal', 'abort']);

    for (const key in controller) {
      expect(keys.has(key)).toBe(true);
      keys.delete(key);
    }

    expect(keys.size).toBe(0);
  });

  it('should be stringified as [object AbortController]', () => {
    expect(Object.prototype.toString.call(controller)).toBe(
      '[object AbortController]',
    );
  });

  describe("'signal' property", () => {
    let signal: AbortSignal;

    beforeEach(() => {
      signal = controller.signal;
    });

    it('should return the same instance always', () => {
      expect(controller.signal).toBe(signal);
    });

    it('should be an AbortSignal object', () => {
      expect(signal).toBeInstanceOf(AbortSignal);
    });

    it('should be an EventTarget object', () => {
      expect(signal).toBeInstanceOf(EventTarget);
    });

    it('should have required properties', () => {
      const keys = new Set([
        'aborted',
        'onabort',
        // TODO
        // 'reason',
        // 'throwIfAborted',
        // 'when',
        // TODO: Problem with EventTarget: the modern class syntax was specifically designed to prevent this, ensuring methods don't "pollute" standard loops.
        // 'addEventListener',
        // 'dispatchEvent',
        // 'removeEventListener',
      ]);

      for (const key in signal) {
        expect(keys.has(key)).toBe(true);
        keys.delete(key);
      }

      expect(keys.size).toBe(0);
    });

    it("should have 'aborted' property which is false by default", () => {
      expect(signal.aborted).toBe(false);
    });

    it("should have 'onabort' property which is null by default", () => {
      expect(signal.onabort).toBe(null);
    });

    it("should throw a TypeError if 'signal.aborted' getter is called with non AbortSignal object", () => {
      const proto = Object.getPrototypeOf(signal);
      const descriptor = Object.getOwnPropertyDescriptor(proto, 'aborted');
      const getAborted = descriptor?.get;

      expect(() => {
        if (getAborted) {
          getAborted.call({});
        } else {
          throw new TypeError();
        }
      }).toThrow(TypeError);
    });

    it('should be stringified as [object AbortSignal]', () => {
      expect(Object.prototype.toString.call(signal)).toBe(
        '[object AbortSignal]',
      );
    });
  });

  describe("'abort' method", () => {
    it("should set true to 'signal.aborted' property", () => {
      controller.abort();
      expect(controller.signal.aborted).toBe(true);
    });

    it("should fire 'abort' event on 'signal' (addEventListener)", () => {
      const listener = createListener();
      controller.signal.addEventListener('abort', listener);
      controller.abort();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should fire 'abort' event on 'signal' (onabort)", () => {
      const listener = createListener();
      // $FlowExpectedError[incompatible-type]
      controller.signal.onabort = listener;
      controller.abort();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should not fire 'abort' event twice", () => {
      const listener = createListener();
      controller.signal.addEventListener('abort', listener);

      controller.abort();
      controller.abort();
      controller.abort();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should throw a TypeError if 'this' is not an AbortController object", () => {
      expect(() => {
        controller.abort.call({});
      }).toThrow(TypeError);
    });
  });
});

describe('AbortSignal', () => {
  it('should not be callable', () => {
    expect(() => {
      // $FlowExpectedError[constructor-as-function]
      AbortSignal();
    }).toThrow(TypeError);
  });

  it("should throw a TypeError when it's constructed directly", () => {
    expect(() => {
      // $FlowExpectedError[cannot-new]
      // eslint-disable-next-line no-new
      new AbortSignal();
    }).toThrow('AbortSignal cannot be constructed directly');
  });
});
