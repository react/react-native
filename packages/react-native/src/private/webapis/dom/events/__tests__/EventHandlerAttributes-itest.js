/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// flowlint unsafe-getters-setters:off

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import {
  getEventHandlerAttribute,
  setEventHandlerAttribute,
} from '../EventHandlerAttributes';

type EventCallback = (event: Event) => void;

class EventTargetSubclass extends EventTarget {
  get oncustomevent(): EventCallback | null {
    // $FlowFixMe[incompatible-type] The globals are backed by these implementations.
    return getEventHandlerAttribute(this, 'customEvent');
  }

  set oncustomevent(listener: ?EventCallback) {
    // $FlowFixMe[incompatible-type] The globals are backed by these implementations.
    setEventHandlerAttribute(this, 'customEvent', listener);
  }
}

describe('EventHandlerAttributes', () => {
  it('should register event listeners assigned to the attributes', () => {
    const target = new EventTargetSubclass();

    const listener = jest.fn();
    target.oncustomevent = listener;

    expect(target.oncustomevent).toBe(listener);

    const event = new Event('customEvent');

    target.dispatchEvent(event);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.lastCall[0]).toBe(event);
  });

  it('should NOT register values assigned to the attributes if they are not an event listener', () => {
    const target = new EventTargetSubclass();

    const listener = Symbol();
    // $FlowExpectedError[incompatible-type]
    target.oncustomevent = listener;

    expect(target.oncustomevent).toBe(null);

    const event = new Event('customEvent');

    // This doesn't fail.
    target.dispatchEvent(event);
  });

  it('should remove event listeners assigned to the attributes when reassigning them to null', () => {
    const target = new EventTargetSubclass();

    const listener = jest.fn();
    target.oncustomevent = listener;

    const event = new Event('customEvent');

    target.dispatchEvent(event);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.lastCall[0]).toBe(event);

    target.oncustomevent = null;

    expect(target.oncustomevent).toBe(null);

    target.dispatchEvent(event);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should remove event listeners assigned to the attributes when reassigning them to a different listener', () => {
    const target = new EventTargetSubclass();

    const listener = jest.fn();
    target.oncustomevent = listener;

    const event = new Event('customEvent');

    target.dispatchEvent(event);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.lastCall[0]).toBe(event);

    const newListener = jest.fn();
    target.oncustomevent = newListener;

    expect(target.oncustomevent).toBe(newListener);

    target.dispatchEvent(event);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(newListener).toHaveBeenCalledTimes(1);
    expect(newListener.mock.lastCall[0]).toBe(event);
  });

  it('should remove event listeners assigned to the attributes when reassigning them to an incorrect listener value', () => {
    const target = new EventTargetSubclass();

    const listener = jest.fn();
    target.oncustomevent = listener;

    const event = new Event('customEvent');

    target.dispatchEvent(event);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.lastCall[0]).toBe(event);

    const newListener = Symbol();
    // $FlowExpectedError[incompatible-type]
    target.oncustomevent = newListener;

    expect(target.oncustomevent).toBe(null);

    target.dispatchEvent(event);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should interoperate with listeners registered via `addEventListener`', () => {
    const target = new EventTargetSubclass();

    let order = 0;

    const regularListener1: JestMockFn<[Event], void> = jest.fn(() => {
      // $FlowExpectedError[prop-missing]
      regularListener1.order = order++;
    });
    target.addEventListener('customEvent', regularListener1);

    const attributeListener: JestMockFn<[Event], void> = jest.fn(() => {
      // $FlowExpectedError[prop-missing]
      attributeListener.order = order++;
    });
    target.oncustomevent = attributeListener;

    const regularListener2: JestMockFn<[Event], void> = jest.fn(() => {
      // $FlowExpectedError[prop-missing]
      regularListener2.order = order++;
    });
    target.addEventListener('customEvent', regularListener2);

    const event = new Event('customEvent');

    target.dispatchEvent(event);

    expect(regularListener1).toHaveBeenCalledTimes(1);
    expect(regularListener1.mock.lastCall[0]).toBe(event);
    // $FlowExpectedError[prop-missing]
    expect(regularListener1.order).toBe(0);

    expect(attributeListener).toHaveBeenCalledTimes(1);
    expect(attributeListener.mock.lastCall[0]).toBe(event);
    // $FlowExpectedError[prop-missing]
    expect(attributeListener.order).toBe(1);

    expect(regularListener2).toHaveBeenCalledTimes(1);
    expect(regularListener2.mock.lastCall[0]).toBe(event);
    // $FlowExpectedError[prop-missing]
    expect(regularListener2.order).toBe(2);
  });

  it('should not be considered the same callback when adding it again via `addEventListener`', () => {
    const target = new EventTargetSubclass();

    const listener = jest.fn();

    target.addEventListener('customEvent', listener);
    target.oncustomevent = listener;

    const event = new Event('customEvent');

    target.dispatchEvent(event);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[0][0]).toBe(event);
    expect(listener.mock.calls[1][0]).toBe(event);

    target.removeEventListener('customEvent', listener);

    target.dispatchEvent(event);

    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener.mock.lastCall[0]).toBe(event);
  });
});
