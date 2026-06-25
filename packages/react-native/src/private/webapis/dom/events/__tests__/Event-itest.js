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

import Event from 'react-native/src/private/webapis/dom/events/Event';
import {
  setEventInitTimeStamp,
  setInPassiveListenerFlag,
} from 'react-native/src/private/webapis/dom/events/internals/EventInternals';

describe('Event', () => {
  it('provides read-only constants for event phases', () => {
    'use strict';
    // use strict mode to throw an error instead of silently failing

    expect(Event.NONE).toBe(0);
    expect(Event.CAPTURING_PHASE).toBe(1);
    expect(Event.AT_TARGET).toBe(2);
    expect(Event.BUBBLING_PHASE).toBe(3);

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      // $FlowExpectedError[cannot-write]
      Event.NONE = 'NONE';
    }).toThrow();

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      // $FlowExpectedError[cannot-write]
      Event.CAPTURING_PHASE = 'CAPTURING_PHASE';
    }).toThrow();

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      // $FlowExpectedError[cannot-write]
      Event.AT_TARGET = 'AT_TARGET';
    }).toThrow();

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      // $FlowExpectedError[cannot-write]
      Event.BUBBLING_PHASE = 'BUBBLING_PHASE';
    }).toThrow();

    // Also accessible through instances (via the Event prototype).

    const event = new Event('custom');

    expect(event.NONE).toBe(0);
    expect(event.CAPTURING_PHASE).toBe(1);
    expect(event.AT_TARGET).toBe(2);
    expect(event.BUBBLING_PHASE).toBe(3);

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      // $FlowExpectedError[cannot-write]
      event.NONE = 'NONE';
    }).toThrow();

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      // $FlowExpectedError[cannot-write]
      event.CAPTURING_PHASE = 'CAPTURING_PHASE';
    }).toThrow();

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      // $FlowExpectedError[cannot-write]
      event.AT_TARGET = 'AT_TARGET';
    }).toThrow();

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      // $FlowExpectedError[cannot-write]
      event.BUBBLING_PHASE = 'BUBBLING_PHASE';
    }).toThrow();
  });

  it('should throw an error if type is not passed', () => {
    expect(() => {
      // $FlowExpectedError[incompatible-type]
      return new Event();
    }).toThrow(
      "Failed to construct 'Event': 1 argument required, but only 0 present.",
    );
  });

  it('should throw an error if the given options is not an object, function, null or undefined', () => {
    expect(() => {
      // $FlowExpectedError[incompatible-type]
      return new Event('custom', 1);
    }).toThrow(
      "Failed to construct 'Event': The provided value is not of type 'EventInit'.",
    );

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      return new Event('custom', '1');
    }).toThrow(
      "Failed to construct 'Event': The provided value is not of type 'EventInit'.",
    );

    expect(() => {
      return new Event('custom', null);
    }).not.toThrow();

    expect(() => {
      return new Event('custom', undefined);
    }).not.toThrow();

    expect(() => {
      return new Event('custom', {});
    }).not.toThrow();

    expect(() => {
      // $FlowExpectedError[incompatible-exact]
      // $FlowExpectedError[prop-missing]
      return new Event('custom', class {});
    }).not.toThrow();

    expect(() => {
      // $FlowExpectedError[incompatible-exact]
      return new Event('custom', () => {});
    }).not.toThrow();
  });

  it('should have default values for as a non-dispatched event', () => {
    const event = new Event('custom');

    expect(event.currentTarget).toBe(null);
    expect(event.defaultPrevented).toBe(false);
    expect(event.eventPhase).toBe(Event.NONE);
    expect(event.isTrusted).toBe(false);
    expect(event.target).toBe(null);
    expect(event.composedPath()).toEqual([]);
  });

  it('should initialize the event with default values', () => {
    const event = new Event('custom');

    expect(event.type).toBe('custom');
    expect(event.bubbles).toBe(false);
    expect(event.cancelable).toBe(false);
    expect(event.composed).toBe(false);
  });

  it('should initialize the event with the given options', () => {
    const eventWithAllOptionsSet = new Event('custom', {
      bubbles: true,
      cancelable: true,
      composed: true,
    });

    expect(eventWithAllOptionsSet.bubbles).toBe(true);
    expect(eventWithAllOptionsSet.cancelable).toBe(true);
    expect(eventWithAllOptionsSet.composed).toBe(true);

    const bubblingEvent = new Event('custom', {
      bubbles: true,
    });

    expect(bubblingEvent.bubbles).toBe(true);
    expect(bubblingEvent.cancelable).toBe(false);
    expect(bubblingEvent.composed).toBe(false);

    const cancelableEvent = new Event('custom', {
      cancelable: true,
    });

    expect(cancelableEvent.bubbles).toBe(false);
    expect(cancelableEvent.cancelable).toBe(true);
    expect(cancelableEvent.composed).toBe(false);

    const composedEvent = new Event('custom', {
      composed: true,
    });

    expect(composedEvent.bubbles).toBe(false);
    expect(composedEvent.cancelable).toBe(false);
    expect(composedEvent.composed).toBe(true);
  });

  it('should coerce values to the right types', () => {
    // $FlowExpectedError[incompatible-type]
    const eventWithAllOptionsSet = new Event(undefined, {
      // $FlowExpectedError[incompatible-type]
      bubbles: 1,
      // $FlowExpectedError[incompatible-type]
      cancelable: 'true',
      // $FlowExpectedError[incompatible-type]
      composed: {},
    });

    expect(eventWithAllOptionsSet.type).toBe('undefined');
    expect(eventWithAllOptionsSet.bubbles).toBe(true);
    expect(eventWithAllOptionsSet.cancelable).toBe(true);
    expect(eventWithAllOptionsSet.composed).toBe(true);
  });

  it('should not allow writing the options after construction', () => {
    'use strict';
    // use strict mode to throw an error instead of silently failing

    const event = new Event('custom');

    expect(() => {
      // $FlowExpectedError[cannot-write]
      event.bubbles = false;
    }).toThrow();

    expect(() => {
      // $FlowExpectedError[cannot-write]
      event.cancelable = false;
    }).toThrow();

    expect(() => {
      // $FlowExpectedError[cannot-write]
      event.composed = false;
    }).toThrow();
  });

  it('should set the timestamp with the current high resolution time', () => {
    const lowerBoundTimestamp = performance.now();
    const event = new Event('type');
    const upperBoundTimestamp = performance.now();

    expect(event.timeStamp).toBeGreaterThanOrEqual(lowerBoundTimestamp);
    expect(event.timeStamp).toBeLessThanOrEqual(upperBoundTimestamp);
  });

  it('should use a custom timestamp when set via setEventInitTimeStamp', () => {
    const customTimestamp = 12345.678;
    const options = {};
    setEventInitTimeStamp(options, customTimestamp);
    const event = new Event('custom', options);

    expect(event.timeStamp).toBe(customTimestamp);
  });

  it('should accept zero as a valid custom timestamp', () => {
    const options = {};
    setEventInitTimeStamp(options, 0);
    const event = new Event('custom', options);

    expect(event.timeStamp).toBe(0);
  });

  describe('preventDefault', () => {
    let originalConsoleError;
    let consoleErrorMock;

    beforeEach(() => {
      originalConsoleError = console.error;
      consoleErrorMock = jest.fn();
      // $FlowExpectedError[cannot-write]
      console.error = consoleErrorMock;
    });

    afterEach(() => {
      // $FlowExpectedError[cannot-write]
      console.error = originalConsoleError;
    });

    it('does nothing with non-cancelable events', () => {
      const event = new Event('custom', {
        cancelable: false,
      });

      expect(event.defaultPrevented).toBe(false);

      event.preventDefault();

      expect(event.defaultPrevented).toBe(false);
    });

    it('cancels cancelable events', () => {
      const event = new Event('custom', {
        cancelable: true,
      });

      expect(event.defaultPrevented).toBe(false);

      event.preventDefault();

      expect(event.defaultPrevented).toBe(true);
    });

    it('does not cancel events with the "in passive listener" flag set, and logs an error', () => {
      const event = new Event('custom', {
        cancelable: true,
      });

      expect(event.defaultPrevented).toBe(false);

      setInPassiveListenerFlag(event, true);

      event.preventDefault();

      expect(event.defaultPrevented).toBe(false);

      expect(consoleErrorMock).toHaveBeenCalledTimes(1);
      const reportedError = consoleErrorMock.mock.lastCall[0];
      expect(reportedError).toBeInstanceOf(Error);
      expect(reportedError.message).toBe(
        'Unable to preventDefault inside passive event listener invocation.',
      );
    });
  });
});
