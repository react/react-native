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

import type {TimerMock} from '@react-native/fantom';

import DOMException from '../../../errors/DOMException';
import {AbortController} from '../AbortController';
import {AbortSignal_public as AbortSignal} from '../AbortSignal';
import * as Fantom from '@react-native/fantom';
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
      // $FlowExpectedError[prop-missing]
      // $FlowExpectedError[constructor-as-function]
      AbortController();
    }).toThrow('Cannot call a class as a function');
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
    // $FlowExpectedError[method-unbinding]
    expect(Object.prototype.toString.call(controller)).toBe(
      '[object AbortController]',
    );
  });

  describe("'onabort' prop", () => {
    it('should call event lisnters in correct order', () => {
      const listener = jest.fn();
      const c = new AbortController();
      c.signal.addEventListener('abort', () => listener(1));
      c.signal.onabort = () => listener(2);
      c.signal.addEventListener('abort', () => listener(3));

      c.abort();

      expect(listener).toHaveBeenNthCalledWith(1, 1);
      expect(listener).toHaveBeenNthCalledWith(2, 2);
      expect(listener).toHaveBeenNthCalledWith(3, 3);
    });
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
        'reason',
        'throwIfAborted',
        'addEventListener',
        'dispatchEvent',
        'removeEventListener',
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

    it("should have 'reason' property which is undefined by default", () => {
      expect(signal.reason).toBe(undefined);
    });

    it("should have 'onabort' property which is null by default", () => {
      // $FlowExpectedError[prop-missing]
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
      }).toThrow(
        "Expected 'this' to be an 'AbortSignal' object, but got object",
      );
    });

    it('should be stringified as [object AbortSignal]', () => {
      // $FlowExpectedError[method-unbinding]
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

    it("should set default 'reason' when called without an argument", () => {
      controller.abort();

      const reason = controller.signal.reason;
      expect(reason).toBeInstanceOf(DOMException);
      //$FlowExpectedError[incompatible-type]
      const domException: DOMException = reason;
      expect(domException.name).toBe('AbortError');
      expect(domException.message).toBe('signal is aborted without reason');
    });

    it("should set the provided 'reason' when called with an argument", () => {
      const reason = new Error('boom');

      controller.abort(reason);

      expect(controller.signal.reason).toBe(reason);
    });

    it("should make 'throwIfAborted' throw the abort reason", () => {
      const reason = {message: 'boom'};

      controller.abort(reason);

      let thrown;
      try {
        controller.signal.throwIfAborted();
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBe(reason);
    });

    it("should not throw from 'throwIfAborted' before aborting", () => {
      expect(() => {
        controller.signal.throwIfAborted();
      }).not.toThrow();
    });

    it("should fire 'abort' event on 'signal' (addEventListener)", () => {
      const listener = createListener();
      controller.signal.addEventListener('abort', listener);
      controller.abort();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should fire a trusted 'abort' event on 'signal'", () => {
      let isTrusted;
      const listener = createListener(event => {
        isTrusted = event.isTrusted;
      });
      controller.signal.addEventListener('abort', listener);
      controller.abort();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(isTrusted).toBe(true);
    });

    it("should fire 'abort' event on 'signal' (onabort)", () => {
      const listener = createListener();
      // $FlowExpectedError[incompatible-type]
      // $FlowExpectedError[prop-missing]
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
        // $FlowExpectedError[method-unbinding]
        controller.abort.call({});
      }).toThrow(
        "Expected 'this' to be an 'AbortController' object, but got object",
      );
    });
  });

  describe("'abort' static method", () => {
    it('should return an AbortSignal instance', () => {
      const signal = AbortSignal.abort();
      expect(signal).toBeInstanceOf(AbortSignal);
    });

    it('should return an already-aborted signal', () => {
      const signal = AbortSignal.abort();
      expect(signal.aborted).toBe(true);
    });

    it('should set a default AbortError reason when called without arguments', () => {
      const signal = AbortSignal.abort();
      expect(signal.reason).toBeInstanceOf(DOMException);
      //$FlowExpectedError[incompatible-type]
      const domException: DOMException = signal.reason;
      expect(domException.name).toBe('AbortError');
      expect(domException.message).toBe('signal is aborted without reason');
    });

    it('should set the provided reason when called with an argument', () => {
      const reason = new Error('custom reason');
      const signal = AbortSignal.abort(reason);
      expect(signal.reason).toBe(reason);
    });

    it('should set a primitive reason when called with a string', () => {
      const signal = AbortSignal.abort('string reason');
      expect(signal.reason).toBe('string reason');
    });

    it("should make 'throwIfAborted' throw the abort reason", () => {
      const signal = AbortSignal.abort(new Error('abort reason'));

      expect(() => signal.throwIfAborted()).toThrow('abort reason');
    });

    it("should make 'throwIfAborted' throw the default AbortError when called without arguments", () => {
      const signal = AbortSignal.abort();

      let thrown;
      try {
        signal.throwIfAborted();
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(DOMException);
      //$FlowExpectedError[incompatible-type]
      const domException: DOMException = thrown;
      expect(domException.name).toBe('AbortError');
    });

    it('should return a different instance on each call', () => {
      const first = AbortSignal.abort();
      const second = AbortSignal.abort();
      expect(first).not.toBe(second);
    });

    it('should not fire the abort event since signal is already aborted', () => {
      const signal = AbortSignal.abort();
      const listener = createListener();
      signal.addEventListener('abort', listener);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("'any' static method", () => {
    it('should abort when one of the provided signals aborts', () => {
      const first = new AbortController();
      const second = new AbortController();
      const reason = new Error('stop');

      const signal = AbortSignal.any([first.signal, second.signal]);

      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal.aborted).toBe(false);

      second.abort(reason);

      expect(signal.aborted).toBe(true);
      expect(signal.reason).toBe(reason);
    });

    it('should abort immediately if one of the provided signals is already aborted', () => {
      const first = new AbortController();
      const second = new AbortController();
      const reason = new Error('already aborted');

      second.abort(reason);

      const signal = AbortSignal.any([first.signal, second.signal]);

      expect(signal.aborted).toBe(true);
      expect(signal.reason).toBe(reason);
    });

    it('should throw a TypeError when an element is not an AbortSignal', () => {
      const valid = new AbortController();

      let thrown;
      try {
        // $FlowExpectedError[incompatible-type]
        AbortSignal.any([valid.signal, {}]);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(TypeError);
      // $FlowExpectedError[incompatible-type]
      const typeError: TypeError = thrown;
      expect(typeError.message).toBe(
        'The "signals[1]" argument must be an instance of AbortSignal',
      );
    });

    it('should validate every element before short-circuiting on an already-aborted signal', () => {
      const aborted = new AbortController();
      aborted.abort(new Error('already aborted'));

      let thrown;
      try {
        // $FlowExpectedError[incompatible-type]
        AbortSignal.any([aborted.signal, {}]);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(TypeError);
      // $FlowExpectedError[incompatible-type]
      const typeError: TypeError = thrown;
      expect(typeError.message).toBe(
        'The "signals[1]" argument must be an instance of AbortSignal',
      );
    });
  });

  describe("'timeout' static method", () => {
    let timers: TimerMock;

    beforeEach(() => {
      timers = Fantom.installTimerMock();
    });

    afterEach(() => {
      timers.uninstall();
    });

    it('should abort after the timeout with a TimeoutError reason', () => {
      const signal = AbortSignal.timeout(10);

      expect(signal.aborted).toBe(false);

      timers.advanceTimersByTime(10);

      expect(signal.aborted).toBe(true);
      expect(signal.reason).toBeInstanceOf(DOMException);
      // $FlowExpectedError[incompatible-type]
      const reason: DOMException = signal.reason;
      expect(reason.name).toBe('TimeoutError');
      expect(reason.message).toBe('signal timed out');
    });

    it('should throw a TypeError for a negative timeout', () => {
      expect(() => {
        AbortSignal.timeout(-1);
      }).toThrow(
        "Failed to execute 'timeout' on 'AbortSignal': The provided value has to be a non-negative number.",
      );
    });
  });
});

describe('AbortSignal', () => {
  it('should not be callable', () => {
    expect(() => {
      // $FlowExpectedError[prop-missing]
      // $FlowExpectedError[constructor-as-function]
      AbortSignal();
    }).toThrow("Failed to construct 'AbortSignal': Illegal constructor");
  });

  it("should throw a TypeError when it's constructed directly", () => {
    expect(() => {
      // $FlowExpectedError[cannot-new]
      // eslint-disable-next-line no-new
      new AbortSignal();
    }).toThrow("Failed to construct 'AbortSignal': Illegal constructor");
  });
});
