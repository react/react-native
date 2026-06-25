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

import createEventTargetHierarchyWithDepth from './createEventTargetHierarchyWithDepth';
import Event from 'react-native/src/private/webapis/dom/events/Event';
import EventTarget from 'react-native/src/private/webapis/dom/events/EventTarget';
import {dispatchTrustedEvent} from 'react-native/src/private/webapis/dom/events/internals/EventTargetInternals';

let listenerCallOrder = 0;

function resetListenerCallOrder() {
  listenerCallOrder = 0;
}

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

describe('EventTarget', () => {
  it('should have 3 enumerable methods', () => {
    const methods = new Set([
      'addEventListener',
      'removeEventListener',
      'dispatchEvent',
    ]);
    for (const key in new EventTarget()) {
      expect(methods.has(key)).toBe(true);
      methods.delete(key);
    }
    expect(methods.size).toBe(0);
  });

  describe('addEventListener', () => {
    it('should throw an error if event or callback are NOT passed', () => {
      const eventTarget = new EventTarget();

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.addEventListener();
      }).toThrow(
        "Failed to execute 'addEventListener' on 'EventTarget': 2 arguments required, but only 0 present.",
      );

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.addEventListener('custom');
      }).toThrow(
        "Failed to execute 'addEventListener' on 'EventTarget': 2 arguments required, but only 1 present.",
      );

      expect(() => {
        eventTarget.addEventListener('custom', () => {});
      }).not.toThrow();
    });

    it('should throw an error if the callback is NOT a function or an object', () => {
      const eventTarget = new EventTarget();

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.addEventListener('custom', 'foo');
      }).toThrow(
        "Failed to execute 'addEventListener' on 'EventTarget': parameter 2 is not of type 'Object'.",
      );

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.addEventListener('custom', Symbol('test'));
      }).toThrow(
        "Failed to execute 'addEventListener' on 'EventTarget': parameter 2 is not of type 'Object'.",
      );

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.addEventListener('custom', true);
      }).toThrow(
        "Failed to execute 'addEventListener' on 'EventTarget': parameter 2 is not of type 'Object'.",
      );

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.addEventListener('custom', 5);
      }).toThrow(
        "Failed to execute 'addEventListener' on 'EventTarget': parameter 2 is not of type 'Object'.",
      );

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.addEventListener('custom', {});
      }).not.toThrow();

      // It should work even if the `handleEvent` property is not a function.
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.addEventListener('custom', {
          handleEvent: 5,
        });
      }).not.toThrow();

      expect(() => {
        eventTarget.addEventListener('custom', {
          handleEvent: () => {},
        });
      }).not.toThrow();

      expect(() => {
        eventTarget.addEventListener('custom', () => {});
      }).not.toThrow();
    });

    it('should throw an error if the passed `signal` is not an instance of `AbortSignal`', () => {
      const eventTarget = new EventTarget();

      const abortController = new AbortController();

      expect(() => {
        eventTarget.addEventListener('custom', () => {}, {
          signal: undefined,
        });
      }).not.toThrow();

      expect(() => {
        eventTarget.addEventListener('custom', () => {}, {
          signal: abortController.signal,
        });
      }).not.toThrow();

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.addEventListener('custom', () => {}, {
          signal: null,
        });
      }).toThrow(
        "Failed to execute 'addEventListener' on 'EventTarget': Failed to read the 'signal' property from 'AddEventListenerOptions': Failed to convert value to 'AbortSignal'.",
      );

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.addEventListener('custom', () => {}, {
          signal: {},
        });
      }).toThrow(
        "Failed to execute 'addEventListener' on 'EventTarget': Failed to read the 'signal' property from 'AddEventListenerOptions': Failed to convert value to 'AbortSignal'.",
      );
    });
  });

  describe('removeEventListener', () => {
    it('should throw an error if event or callback are NOT passed', () => {
      const eventTarget = new EventTarget();

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.removeEventListener();
      }).toThrow(
        "Failed to execute 'removeEventListener' on 'EventTarget': 2 arguments required, but only 0 present.",
      );

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.removeEventListener('eventName');
      }).toThrow(
        "Failed to execute 'removeEventListener' on 'EventTarget': 2 arguments required, but only 1 present.",
      );

      expect(() => {
        eventTarget.removeEventListener('eventName', () => {});
      }).not.toThrow();
    });

    it('should throw an error if the callback is NOT a function or an object', () => {
      const eventTarget = new EventTarget();

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.removeEventListener('eventName', 'foo');
      }).toThrow(
        "Failed to execute 'removeEventListener' on 'EventTarget': parameter 2 is not of type 'Object'.",
      );

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.removeEventListener('eventName', Symbol('test'));
      }).toThrow(
        "Failed to execute 'removeEventListener' on 'EventTarget': parameter 2 is not of type 'Object'.",
      );

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.removeEventListener('eventName', true);
      }).toThrow(
        "Failed to execute 'removeEventListener' on 'EventTarget': parameter 2 is not of type 'Object'.",
      );

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.removeEventListener('eventName', 5);
      }).toThrow(
        "Failed to execute 'removeEventListener' on 'EventTarget': parameter 2 is not of type 'Object'.",
      );

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.removeEventListener('eventName', {});
      }).not.toThrow();

      // It should work even if the `handleEvent` property is not a function.
      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.removeEventListener('eventName', {
          handleEvent: 5,
        });
      }).not.toThrow();

      expect(() => {
        eventTarget.removeEventListener('eventName', {
          handleEvent: () => {},
        });
      }).not.toThrow();

      expect(() => {
        eventTarget.removeEventListener('eventName', () => {});
      }).not.toThrow();
    });
  });

  describe('internal `dispatchTrustedEvent`', () => {
    it('should set the `isTrusted` flag to `true`', () => {
      const eventTarget = new EventTarget();

      const listener = createListener();

      eventTarget.addEventListener('custom', listener);

      const event = new Event('custom');

      dispatchTrustedEvent(eventTarget, event);

      expect(event.isTrusted).toBe(true);
    });
  });

  describe('dispatchEvent', () => {
    it('should throw an error if event is NOT passed', () => {
      const eventTarget = new EventTarget();

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.dispatchEvent();
      }).toThrow(
        "Failed to execute 'dispatchEvent' on 'EventTarget': parameter 1 is not of type 'Event'.",
      );

      expect(() => {
        eventTarget.dispatchEvent(new Event('eventName'));
      }).not.toThrow();
    });

    it('should throw an error if the passed value is NOT an `Event` instance', () => {
      const eventTarget = new EventTarget();

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.dispatchEvent('foo');
      }).toThrow(
        "Failed to execute 'dispatchEvent' on 'EventTarget': parameter 1 is not of type 'Event'.",
      );

      expect(() => {
        // $FlowExpectedError[incompatible-type]
        eventTarget.dispatchEvent(true);
      }).toThrow(
        "Failed to execute 'dispatchEvent' on 'EventTarget': parameter 1 is not of type 'Event'.",
      );
    });

    it('works with listeners as functions and as objects with a `handleEvent` method', () => {
      const eventTarget = new EventTarget();

      const listenerFunction = createListener();
      const handleEventMethod = createListener();
      const listenerObject = {
        handleEvent: handleEventMethod,
      };

      eventTarget.addEventListener('custom', listenerFunction);
      eventTarget.addEventListener('custom', listenerObject);

      const event = new Event('custom');

      eventTarget.dispatchEvent(event);

      expect(listenerFunction.mock.lastCall[0]).toBe(event);
      expect(handleEventMethod.mock.lastCall[0]).toBe(event);
    });

    it('sets the global `event` value to the event while it is in dispatch', () => {
      const eventTarget = new EventTarget();

      let globalEventDuringDispatch;
      let globalEventBeforeDispatch = Symbol('some value');

      global.event = globalEventBeforeDispatch;

      const listener = createListener(() => {
        globalEventDuringDispatch = global.event;
      });

      eventTarget.addEventListener('custom', listener);

      const event = new Event('custom');

      eventTarget.dispatchEvent(event);

      expect(globalEventDuringDispatch).toBe(event);
      expect(global.event).toBe(globalEventBeforeDispatch);
    });

    it('sets the global `event` value to the right event, when they are dispatched recursively', () => {
      const eventTarget1 = new EventTarget();
      const eventTarget2 = new EventTarget();

      let globalEventBeforeDispatch = Symbol('some value');

      global.event = globalEventBeforeDispatch;

      const event1 = new Event('custom');
      const event2 = new Event('other');

      let globalEventInListener1A;
      const listener1A = createListener(() => {
        globalEventInListener1A = global.event;

        eventTarget2.dispatchEvent(event2);
      });

      let globalEventInListener1B;
      const listener1B = createListener(() => {
        globalEventInListener1B = global.event;
      });

      let globalEventInListener2;
      const listener2 = createListener(() => {
        globalEventInListener2 = global.event;
      });

      eventTarget1.addEventListener('custom', listener1A);
      eventTarget1.addEventListener('custom', listener1B);

      eventTarget2.addEventListener('other', listener2);

      eventTarget1.dispatchEvent(event1);

      expect(global.event).toBe(globalEventBeforeDispatch);
      expect(globalEventInListener1A).toBe(event1);
      expect(globalEventInListener1B).toBe(event1);
      expect(globalEventInListener2).toBe(event2);
    });

    it('sets the `isTrusted` flag to `false`', () => {
      const eventTarget = new EventTarget();

      const listener = createListener();

      eventTarget.addEventListener('custom', listener);

      const event = new Event('custom');

      expect(event.isTrusted).toBe(false);

      dispatchTrustedEvent(eventTarget, event);

      expect(event.isTrusted).toBe(true);

      eventTarget.dispatchEvent(event);

      expect(event.isTrusted).toBe(false);
    });

    it('should call listeners in the same target in the order in which they were added', () => {
      const [node] = createEventTargetHierarchyWithDepth(1);

      // Listener setup

      resetListenerCallOrder();

      const firstListener = createListener();
      const secondListener = createListener();
      const thirdListener = createListener();

      node.addEventListener('custom', firstListener);
      node.addEventListener('custom', secondListener);
      node.addEventListener('custom', thirdListener);

      // Dispatch

      const event = new Event('custom');

      node.dispatchEvent(event);

      expect(firstListener.eventData?.callOrder).toBe(0);
      expect(secondListener.eventData?.callOrder).toBe(1);
      expect(thirdListener.eventData?.callOrder).toBe(2);
    });

    describe('bubbling', () => {
      it('should call listeners in the capturing phase, target phase and bubbling phase when dispatching events that bubble', () => {
        const [parentTarget, childTarget, grandchildTarget] =
          createEventTargetHierarchyWithDepth(3);

        // Listener setup

        resetListenerCallOrder();

        const capturingListenerOnParent = createListener();
        const capturingListenerOnChild = createListener();
        const capturingListenerOnGrandchild = createListener();
        const bubblingListenerOnParent = createListener();
        const bubblingListenerOnChild = createListener();
        const bubblingListenerOnGrandchild = createListener();

        parentTarget.addEventListener(
          'custom',
          capturingListenerOnParent,
          true,
        );
        parentTarget.addEventListener('custom', bubblingListenerOnParent);

        childTarget.addEventListener('custom', capturingListenerOnChild, true);
        childTarget.addEventListener('custom', bubblingListenerOnChild);

        grandchildTarget.addEventListener(
          'custom',
          capturingListenerOnGrandchild,
          true,
        );
        grandchildTarget.addEventListener(
          'custom',
          bubblingListenerOnGrandchild,
        );

        // Dispatch

        const event = new Event('custom', {bubbles: true});

        const result = grandchildTarget.dispatchEvent(event);

        expect(result).toBe(true);

        expect(capturingListenerOnParent.eventData).toEqual({
          callOrder: 0,
          composedPath: [grandchildTarget, childTarget, parentTarget],
          currentTarget: parentTarget,
          eventPhase: Event.CAPTURING_PHASE,
          target: grandchildTarget,
        });
        expect(capturingListenerOnParent.mock.contexts[0]).toBe(parentTarget);

        expect(capturingListenerOnChild.eventData).toEqual({
          callOrder: 1,
          composedPath: [grandchildTarget, childTarget, parentTarget],
          currentTarget: childTarget,
          eventPhase: Event.CAPTURING_PHASE,
          target: grandchildTarget,
        });
        expect(capturingListenerOnChild.mock.contexts[0]).toBe(childTarget);

        expect(capturingListenerOnGrandchild.eventData).toEqual({
          callOrder: 2,
          composedPath: [grandchildTarget, childTarget, parentTarget],
          currentTarget: grandchildTarget,
          eventPhase: Event.AT_TARGET,
          target: grandchildTarget,
        });
        expect(capturingListenerOnGrandchild.mock.contexts[0]).toBe(
          grandchildTarget,
        );

        expect(bubblingListenerOnGrandchild.eventData).toEqual({
          callOrder: 3,
          composedPath: [grandchildTarget, childTarget, parentTarget],
          currentTarget: grandchildTarget,
          eventPhase: Event.AT_TARGET,
          target: grandchildTarget,
        });
        expect(bubblingListenerOnGrandchild.mock.contexts[0]).toBe(
          grandchildTarget,
        );

        expect(bubblingListenerOnChild.eventData).toEqual({
          callOrder: 4,
          composedPath: [grandchildTarget, childTarget, parentTarget],
          currentTarget: childTarget,
          eventPhase: Event.BUBBLING_PHASE,
          target: grandchildTarget,
        });
        expect(bubblingListenerOnChild.mock.contexts[0]).toBe(childTarget);

        expect(bubblingListenerOnParent.eventData).toEqual({
          callOrder: 5,
          composedPath: [grandchildTarget, childTarget, parentTarget],
          currentTarget: parentTarget,
          eventPhase: Event.BUBBLING_PHASE,
          target: grandchildTarget,
        });
        expect(bubblingListenerOnParent.mock.contexts[0]).toBe(parentTarget);
      });

      it('should call listeners in the capturing phase and target phase, but NOT in the bubbling phase when dispatching events that do NOT bubble', () => {
        const [parentTarget, childTarget, grandchildTarget] =
          createEventTargetHierarchyWithDepth(3);

        // Listener setup

        resetListenerCallOrder();

        const capturingListenerOnParent = createListener();
        const capturingListenerOnChild = createListener();
        const capturingListenerOnGrandchild = createListener();
        const bubblingListenerOnParent = createListener();
        const bubblingListenerOnChild = createListener();
        const bubblingListenerOnGrandchild = createListener();

        parentTarget.addEventListener(
          'custom',
          capturingListenerOnParent,
          true,
        );
        parentTarget.addEventListener('custom', bubblingListenerOnParent);

        childTarget.addEventListener('custom', capturingListenerOnChild, true);
        childTarget.addEventListener('custom', bubblingListenerOnChild);

        grandchildTarget.addEventListener(
          'custom',
          capturingListenerOnGrandchild,
          true,
        );
        grandchildTarget.addEventListener(
          'custom',
          bubblingListenerOnGrandchild,
        );

        // Dispatch

        const event = new Event('custom', {bubbles: false});

        const result = grandchildTarget.dispatchEvent(event);

        expect(result).toBe(true);

        expect(capturingListenerOnParent.eventData).toEqual({
          callOrder: 0,
          composedPath: [grandchildTarget, childTarget, parentTarget],
          currentTarget: parentTarget,
          eventPhase: Event.CAPTURING_PHASE,
          target: grandchildTarget,
        });
        expect(capturingListenerOnParent.mock.contexts[0]).toBe(parentTarget);

        expect(capturingListenerOnChild.eventData).toEqual({
          callOrder: 1,
          composedPath: [grandchildTarget, childTarget, parentTarget],
          currentTarget: childTarget,
          eventPhase: Event.CAPTURING_PHASE,
          target: grandchildTarget,
        });
        expect(capturingListenerOnChild.mock.contexts[0]).toBe(childTarget);

        expect(capturingListenerOnGrandchild.eventData).toEqual({
          callOrder: 2,
          composedPath: [grandchildTarget, childTarget, parentTarget],
          currentTarget: grandchildTarget,
          eventPhase: Event.AT_TARGET,
          target: grandchildTarget,
        });
        expect(capturingListenerOnGrandchild.mock.contexts[0]).toBe(
          grandchildTarget,
        );

        expect(bubblingListenerOnGrandchild.eventData).toEqual({
          callOrder: 3,
          composedPath: [grandchildTarget, childTarget, parentTarget],
          currentTarget: grandchildTarget,
          eventPhase: Event.AT_TARGET,
          target: grandchildTarget,
        });
        expect(bubblingListenerOnGrandchild.mock.contexts[0]).toBe(
          grandchildTarget,
        );

        // NO bubbling phase calls
        expect(bubblingListenerOnChild).not.toHaveBeenCalled();
        expect(bubblingListenerOnParent).not.toHaveBeenCalled();
      });

      it('should restore event properties after dispatch', () => {
        const [parentTarget, childTarget, grandchildTarget] =
          createEventTargetHierarchyWithDepth(3);

        // Listener setup

        resetListenerCallOrder();

        const capturingListenerOnParent = createListener();
        const capturingListenerOnChild = createListener();
        const capturingListenerOnGrandchild = createListener();
        const bubblingListenerOnParent = createListener();
        const bubblingListenerOnChild = createListener();
        const bubblingListenerOnGrandchild = createListener(event => {
          event.preventDefault();
        });

        parentTarget.addEventListener(
          'custom',
          capturingListenerOnParent,
          true,
        );
        parentTarget.addEventListener('custom', bubblingListenerOnParent);

        childTarget.addEventListener('custom', capturingListenerOnChild, true);
        childTarget.addEventListener('custom', bubblingListenerOnChild);

        grandchildTarget.addEventListener(
          'custom',
          capturingListenerOnGrandchild,
          true,
        );
        grandchildTarget.addEventListener(
          'custom',
          bubblingListenerOnGrandchild,
        );

        // Dispatch

        const event = new Event('custom', {bubbles: true, cancelable: true});

        grandchildTarget.dispatchEvent(event);

        // Should be restored
        expect(event.composedPath()).toEqual([]);
        expect(event.currentTarget).toBe(null);
        expect(event.eventPhase).toBe(Event.NONE);

        // Should be preserved
        expect(event.target).toBe(grandchildTarget);
        expect(event.defaultPrevented).toBe(true);
      });
    });

    describe('stopPropagation', () => {
      it('should continue calling listeners in the same target, but NOT on parents', () => {
        const [parentTarget, childTarget] =
          createEventTargetHierarchyWithDepth(2);

        // Listener setup

        resetListenerCallOrder();

        const parentListener = createListener();

        const firstListener = createListener();
        const secondListener = createListener(event => {
          event.stopPropagation();
        });
        const thirdListener = createListener();

        parentTarget.addEventListener('custom', parentListener);

        childTarget.addEventListener('custom', firstListener);
        childTarget.addEventListener('custom', secondListener);
        childTarget.addEventListener('custom', thirdListener);

        // Dispatch

        const event = new Event('custom');

        childTarget.dispatchEvent(event);

        resetListenerCallOrder();

        expect(firstListener).toHaveBeenCalled();
        expect(secondListener).toHaveBeenCalled();
        expect(thirdListener).toHaveBeenCalled();
        expect(parentListener).not.toHaveBeenCalled();
      });
    });

    describe('stopImmediatePropagation', () => {
      it('should stop calling listeners on the same target as well', () => {
        const [parentTarget, childTarget] =
          createEventTargetHierarchyWithDepth(2);

        // Listener setup

        resetListenerCallOrder();

        const parentListener = createListener();

        const firstListener = createListener();
        const secondListener = createListener(event => {
          event.stopImmediatePropagation();
        });
        const thirdListener = createListener();

        parentTarget.addEventListener('custom', parentListener);

        childTarget.addEventListener('custom', firstListener);
        childTarget.addEventListener('custom', secondListener);
        childTarget.addEventListener('custom', thirdListener);

        // Dispatch

        const event = new Event('custom');

        childTarget.dispatchEvent(event);

        resetListenerCallOrder();

        expect(firstListener).toHaveBeenCalled();
        expect(secondListener).toHaveBeenCalled();
        expect(thirdListener).not.toHaveBeenCalled();

        expect(parentListener).not.toHaveBeenCalled();
      });
    });

    describe('preventDefault', () => {
      it('should cancel cancelable events', () => {
        const [node] = createEventTargetHierarchyWithDepth(1);

        // Listener setup

        resetListenerCallOrder();

        const listener = createListener(event => {
          event.preventDefault();
        });

        node.addEventListener('custom', listener);

        // Dispatch

        const event = new Event('custom', {cancelable: true});

        const result = node.dispatchEvent(event);

        expect(result).toBe(false);

        expect(event.defaultPrevented).toBe(true);
      });

      it('should NOT cancel cancelable event in passive listeners', () => {
        const [node] = createEventTargetHierarchyWithDepth(1);

        // Listener setup

        resetListenerCallOrder();

        const listener = createListener(event => {
          event.preventDefault();
        });

        node.addEventListener('custom', listener, {passive: true});

        // Dispatch

        const event = new Event('custom', {cancelable: true});

        const result = node.dispatchEvent(event);

        expect(result).toBe(true);

        expect(event.defaultPrevented).toBe(false);
      });
    });

    describe('events with `once`', () => {
      it('should remove the listener after the first call', () => {
        const [node] = createEventTargetHierarchyWithDepth(1);

        // Listener setup

        resetListenerCallOrder();

        const listener = createListener();

        node.addEventListener('custom', listener, {once: true});

        // Dispatch

        const event = new Event('custom');

        node.dispatchEvent(event);

        expect(listener).toHaveBeenCalledTimes(1);

        node.dispatchEvent(event);

        expect(listener).toHaveBeenCalledTimes(1);
      });
    });

    describe('events with `signal`', () => {
      it('should remove the listener when the signal is aborted before registration', () => {
        const [node] = createEventTargetHierarchyWithDepth(1);

        // Listener setup

        resetListenerCallOrder();

        const listener = createListener();

        const abortController = new AbortController();

        abortController.abort();

        node.addEventListener('custom', listener, {
          signal: abortController.signal,
        });

        // Dispatch

        const event = new Event('custom');

        node.dispatchEvent(event);

        expect(listener).not.toHaveBeenCalled();
      });

      it('should remove the listener when the signal is aborted after registration', () => {
        const [node] = createEventTargetHierarchyWithDepth(1);

        // Listener setup

        resetListenerCallOrder();

        const listener = createListener();

        const abortController = new AbortController();

        node.addEventListener('custom', listener, {
          signal: abortController.signal,
        });

        // Dispatch

        const event = new Event('custom');

        node.dispatchEvent(event);

        expect(listener).toHaveBeenCalledTimes(1);

        abortController.abort();

        node.dispatchEvent(event);

        expect(listener).toHaveBeenCalledTimes(1);
      });
    });

    describe('dispatching an event while the same event is being dispatched', () => {
      it('should throw an error', () => {
        const [node] = createEventTargetHierarchyWithDepth(1);

        // Listener setup

        resetListenerCallOrder();

        const event = new Event('custom');

        let errorWhenRedispatching: ?Error;

        const listener = createListener(() => {
          try {
            node.dispatchEvent(event);
          } catch (error) {
            errorWhenRedispatching = error;
          }
        });

        node.addEventListener('custom', listener);

        node.dispatchEvent(event);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(errorWhenRedispatching).toBeInstanceOf(Error);
        expect(errorWhenRedispatching?.message).toBe(
          "Failed to execute 'dispatchEvent' on 'EventTarget': The event is already being dispatched.",
        );
      });
    });

    describe('adding listeners during dispatch', () => {
      it('should NOT call listeners for a target and phase that were added during the dispatch of the event for that target and phase', () => {
        const [parentTarget, childTarget] =
          createEventTargetHierarchyWithDepth(2);

        // Listener setup

        resetListenerCallOrder();

        const newParentBubblingListener = createListener();

        const newChildBubblingListener = createListener();
        const newChildCapturingListener = createListener();

        const childCapturingListener = createListener(() => {
          // These should be called
          childTarget.addEventListener('custom', newChildBubblingListener);
          parentTarget.addEventListener('custom', newParentBubblingListener);

          // This should NOT be called
          childTarget.addEventListener(
            'custom',
            newChildCapturingListener,
            true,
          );
        });

        childTarget.addEventListener('custom', childCapturingListener, true);

        // Dispatch

        const event = new Event('custom', {bubbles: true});

        childTarget.dispatchEvent(event);

        expect(childCapturingListener).toHaveBeenCalled();
        expect(newChildCapturingListener).not.toHaveBeenCalled();
        expect(newChildBubblingListener).toHaveBeenCalled();
        expect(newParentBubblingListener).toHaveBeenCalled();
      });
    });

    describe('removing listeners during dispatch', () => {
      it('should NOT call them', () => {
        const [node] = createEventTargetHierarchyWithDepth(1);

        // Listener setup

        resetListenerCallOrder();

        const listener = createListener(() => {
          node.removeEventListener('custom', listenerThatWillBeRemoved);
        });
        const listenerThatWillBeRemoved = createListener();

        node.addEventListener('custom', listener);
        node.addEventListener('custom', listenerThatWillBeRemoved);

        // Dispatch

        const event = new Event('custom');

        node.dispatchEvent(event);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listenerThatWillBeRemoved).not.toHaveBeenCalled();
      });
    });

    describe('re-attaching a previous listener with a pending signal', () => {
      // This is a regression test for https://github.com/whatwg/dom/issues/1346
      it('should NOT remove the new subscription when the signal for the old subscription is aborted', () => {
        const [node] = createEventTargetHierarchyWithDepth(1);

        // Listener setup

        resetListenerCallOrder();

        const listener = createListener();

        const abortController = new AbortController();

        node.addEventListener('custom', listener, {
          signal: abortController.signal,
        });

        // Dispatch

        const event = new Event('custom');

        node.dispatchEvent(event);

        expect(listener).toHaveBeenCalledTimes(1);

        node.removeEventListener('custom', listener);

        node.dispatchEvent(event);

        expect(listener).toHaveBeenCalledTimes(1);

        // Added without a signal
        node.addEventListener('custom', listener);

        node.dispatchEvent(event);

        // Listener is called
        expect(listener).toHaveBeenCalledTimes(2);

        abortController.abort();

        node.dispatchEvent(event);

        // Listener is called
        expect(listener).toHaveBeenCalledTimes(3);
      });
    });
  });
});
