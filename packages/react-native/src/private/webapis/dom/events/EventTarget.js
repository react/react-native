/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/**
 * This module implements the `EventTarget` and related interfaces from the DOM.
 * See https://dom.spec.whatwg.org/#interface-eventtarget.
 */

import type {EventPhase} from './Event';

import * as ReactNativeFeatureFlags from '../../../featureflags/ReactNativeFeatureFlags';
import {setPlatformObject} from '../../webidl/PlatformObjects';
import Event from './Event';
import {
  getStopImmediatePropagationFlag,
  getStopPropagationFlag,
  setComposedPath,
  setCurrentTarget,
  setEventPhase,
  setInPassiveListenerFlag,
  setIsTrusted,
  setStopImmediatePropagationFlag,
  setStopPropagationFlag,
  setTarget,
} from './internals/EventInternals';
import {
  EVENT_TARGET_GET_DECLARATIVE_LISTENER_KEY,
  EVENT_TARGET_GET_THE_PARENT_KEY,
  INTERNAL_DISPATCH_METHOD_KEY,
  getEventTargetParent,
} from './internals/EventTargetInternals';

export type EventCallback = (event: Event) => void;
export type EventHandler = interface {
  handleEvent(event: Event): void,
};
export type EventListener = EventCallback | EventHandler;

export type EventListenerOptions = Readonly<{
  capture?: boolean,
}>;

export type AddEventListenerOptions = Readonly<{
  ...EventListenerOptions,
  passive?: boolean,
  once?: boolean,
  signal?: AbortSignal,
}>;

type EventListenerRegistration = {
  readonly callback: EventListener,
  readonly passive: boolean,
  readonly once: boolean,
  removed: boolean,
};

type ListenersMap = Map<string, Map<EventListener, EventListenerRegistration>>;

export default class EventTarget {
  addEventListener(
    type: string,
    callback: EventListener | null,
    optionsOrUseCapture?: AddEventListenerOptions | boolean = {},
  ): void {
    if (arguments.length < 2) {
      throw new TypeError(
        `Failed to execute 'addEventListener' on 'EventTarget': 2 arguments required, but only ${arguments.length} present.`,
      );
    }

    if (callback == null) {
      return;
    }

    validateCallback(callback, 'addEventListener');

    const processedType = String(type);

    let capture;
    let passive;
    let once;
    let signal;

    if (
      optionsOrUseCapture != null &&
      (typeof optionsOrUseCapture === 'object' ||
        typeof optionsOrUseCapture === 'function')
    ) {
      capture = Boolean(optionsOrUseCapture.capture);
      passive =
        optionsOrUseCapture.passive == null
          ? getDefaultPassiveValue(processedType, this)
          : Boolean(optionsOrUseCapture.passive);
      once = Boolean(optionsOrUseCapture.once);
      signal = optionsOrUseCapture.signal;
      if (signal !== undefined && !(signal instanceof AbortSignal)) {
        throw new TypeError(
          "Failed to execute 'addEventListener' on 'EventTarget': Failed to read the 'signal' property from 'AddEventListenerOptions': Failed to convert value to 'AbortSignal'.",
        );
      }
    } else {
      capture = Boolean(optionsOrUseCapture);
      passive = false;
      once = false;
      signal = null;
    }

    if (signal?.aborted) {
      return;
    }

    let listenersByType = getListenersForPhase(this, capture);
    let listeners = listenersByType?.get(processedType);
    if (listeners == null) {
      if (listenersByType == null) {
        listenersByType = new Map();
        setListenersMap(this, capture, listenersByType);
      }
      listeners = new Map();
      listenersByType.set(processedType, listeners);
    } else if (listeners.has(callback)) {
      return;
    }

    const listener: EventListenerRegistration = {
      callback,
      passive,
      once,
      removed: false,
    };
    listeners.set(callback, listener);

    const nonNullListeners = listeners;

    if (signal != null) {
      signal.addEventListener(
        'abort',
        () => {
          listener.removed = true;
          if (nonNullListeners.get(callback) === listener) {
            nonNullListeners.delete(callback);
          }
        },
        {
          once: true,
        },
      );
    }
  }

  removeEventListener(
    type: string,
    callback: EventListener,
    optionsOrUseCapture?: EventListenerOptions | boolean = {},
  ): void {
    if (arguments.length < 2) {
      throw new TypeError(
        `Failed to execute 'removeEventListener' on 'EventTarget': 2 arguments required, but only ${arguments.length} present.`,
      );
    }

    if (callback == null) {
      return;
    }

    validateCallback(callback, 'removeEventListener');

    const processedType = String(type);

    const capture =
      typeof optionsOrUseCapture === 'boolean'
        ? optionsOrUseCapture
        : Boolean(optionsOrUseCapture.capture);

    const listenersByType = getListenersForPhase(this, capture);
    const listeners = listenersByType?.get(processedType);
    if (listeners == null) {
      return;
    }

    const listener = listeners.get(callback);
    if (listener != null) {
      listener.removed = true;
      listeners.delete(callback);
    }
  }

  dispatchEvent(event: Event): boolean {
    if (!(event instanceof Event)) {
      throw new TypeError(
        "Failed to execute 'dispatchEvent' on 'EventTarget': parameter 1 is not of type 'Event'.",
      );
    }

    if (getEventDispatchFlag(event)) {
      throw new Error(
        "Failed to execute 'dispatchEvent' on 'EventTarget': The event is already being dispatched.",
      );
    }

    setIsTrusted(event, false);

    dispatch(this, event, false);

    return !event.defaultPrevented;
  }

  /**
   * This a "protected" method to be overridden by a subclass to provide
   * an additional event listener extracted from props.
   *
   * Called during event dispatch before explicitly registered listeners.
   * Return a callback to be invoked as an event listener, or null.
   *
   * `event.type` is the event type. `isCapture` distinguishes the capture pass
   * from the bubble pass — it cannot be derived from `event.eventPhase`,
   * which is `AT_TARGET` during both passes through the target node.
   */
  // $FlowExpectedError[unsupported-syntax]
  [EVENT_TARGET_GET_DECLARATIVE_LISTENER_KEY](
    event: Event,
    isCapture: boolean,
  ): EventCallback | null {
    return null;
  }

  /**
   * This a "protected" method to be overridden by a subclass to allow event
   * propagation.
   *
   * Should implement the "get the parent" algorithm
   * (see https://dom.spec.whatwg.org/#get-the-parent).
   */
  // $FlowExpectedError[unsupported-syntax]
  [EVENT_TARGET_GET_THE_PARENT_KEY](): EventTarget | null {
    return null;
  }

  /**
   * This is "protected" method to dispatch trusted events. Mirrors the
   * `dispatchEvent` return contract: returns `false` if the event was
   * canceled (i.e. `event.defaultPrevented`), otherwise `true`.
   */
  // $FlowExpectedError[unsupported-syntax]
  [INTERNAL_DISPATCH_METHOD_KEY](
    event: Event,
    rethrowListenerErrors?: boolean,
  ): boolean {
    dispatch(this, event, rethrowListenerErrors === true);
    return !event.defaultPrevented;
  }
}

// $FlowFixMe[cannot-write]
Object.defineProperties(EventTarget.prototype, {
  addEventListener: {enumerable: true},
  removeEventListener: {enumerable: true},
  dispatchEvent: {enumerable: true},
});

setPlatformObject(EventTarget);

function validateCallback(callback: EventListener, methodName: string): void {
  if (typeof callback !== 'function' && typeof callback !== 'object') {
    throw new TypeError(
      `Failed to execute '${methodName}' on 'EventTarget': parameter 2 is not of type 'Object'.`,
    );
  }
}

function getDefaultPassiveValue(
  type: string,
  eventTarget: EventTarget,
): boolean {
  return false;
}

/**
 * This internal version of `dispatchEvent` does not validate the input and
 * does not reset the `isTrusted` flag, so it can be used for both trusted
 * and not trusted events.
 *
 * Implements the "event dispatch" concept
 * (see https://dom.spec.whatwg.org/#concept-event-dispatch).
 */
function dispatch(
  eventTarget: EventTarget,
  event: Event,
  rethrowErrors: boolean,
): void {
  setEventDispatchFlag(event, true);

  const eventPath = getEventPath(eventTarget, event);
  setComposedPath(event, eventPath);
  setTarget(event, eventTarget);

  // When `rethrowErrors` is set (trusted dispatch of native UI events), collect
  // the first listener error and rethrow it synchronously once the dispatch
  // completes, matching the legacy plugin system's `rethrowCaughtError`
  // behavior. Otherwise (the public `dispatchEvent` API, XHR, etc.) listener
  // errors are reported to the global error handler per the DOM spec.
  const errorState: ListenerErrorState | null = rethrowErrors
    ? {hasError: false, error: undefined}
    : null;

  for (let i = eventPath.length - 1; i >= 0; i--) {
    if (getStopPropagationFlag(event)) {
      break;
    }

    const target = eventPath[i];
    setEventPhase(
      event,
      target === eventTarget ? Event.AT_TARGET : Event.CAPTURING_PHASE,
    );
    invoke(target, event, Event.CAPTURING_PHASE, errorState);
  }

  for (const target of eventPath) {
    if (getStopPropagationFlag(event)) {
      break;
    }

    // If the event does NOT bubble, we only dispatch the event to the
    // target in the bubbling phase.
    if (!event.bubbles && target !== eventTarget) {
      break;
    }

    setEventPhase(
      event,
      target === eventTarget ? Event.AT_TARGET : Event.BUBBLING_PHASE,
    );
    invoke(target, event, Event.BUBBLING_PHASE, errorState);
  }

  setEventPhase(event, Event.NONE);
  setCurrentTarget(event, null);
  setComposedPath(event, []);

  setEventDispatchFlag(event, false);
  setStopImmediatePropagationFlag(event, false);
  setStopPropagationFlag(event, false);

  // Trusted dispatch: surface the first listener error synchronously, after the
  // event has been fully cleaned up.
  if (errorState != null && errorState.hasError) {
    throw errorState.error;
  }
}

/**
 * Builds the event path for an event about to be dispatched in this target
 * (see https://dom.spec.whatwg.org/#event-path).
 *
 * The return value is also set as `composedPath` for the event.
 */
function getEventPath(
  eventTarget: EventTarget,
  event: Event,
): ReadonlyArray<EventTarget> {
  // React Native-specific fast path: a "direct" event is dispatched only to its
  // target, as a single AT_TARGET phase, with just the target in the event
  // path. This skips the O(depth) ancestor walk (and the capture-phase
  // traversal over every ancestor) that the DOM dispatch algorithm otherwise
  // performs even for non-bubbling events.
  if (event.rnIsDirect) {
    return [eventTarget];
  }

  const path = [];
  let target: EventTarget | null = eventTarget;

  while (target != null) {
    path.push(target);
    target = getEventTargetParent(target);
  }

  return path;
}

/**
 * Implements the event listener invoke concept
 * (see https://dom.spec.whatwg.org/#concept-event-listener-invoke).
 */
function invoke(
  eventTarget: EventTarget,
  event: Event,
  eventPhase: EventPhase,
  errorState: ListenerErrorState | null,
) {
  const isCapture = eventPhase === Event.CAPTURING_PHASE;

  setCurrentTarget(event, eventTarget);

  if (ReactNativeFeatureFlags.enableNativeEventTargetEventDispatching()) {
    // Resolve the prop-based listener. Pass the event so subclasses can read
    // its `type` and any pre-resolved internal slots; pass `isCapture`
    // separately because it can't be derived from `event.eventPhase` (which
    // is `AT_TARGET` during both passes through the target node).
    // $FlowExpectedError[prop-missing]
    const propListener: EventCallback | null = eventTarget[
      EVENT_TARGET_GET_DECLARATIVE_LISTENER_KEY
    ](event, isCapture);

    const listenersByType = getListenersForPhase(eventTarget, isCapture);
    const maybeListeners = listenersByType?.get(event.type);

    // Fast path: only a prop listener (no `addEventListener` listeners).
    // This is the overwhelmingly common case for React-driven dispatch.
    if (maybeListeners == null) {
      if (propListener == null) {
        return;
      }
      const currentEvent = global.event;
      global.event = event;
      try {
        propListener.call(eventTarget, event);
      } catch (error) {
        handleListenerError(error, errorState);
      }
      global.event = currentEvent;
      return;
    }

    // Slow path: combine prop listener + addEventListener listeners.
    const listeners: Array<EventListenerRegistration> = [];
    if (propListener != null) {
      listeners.push({
        callback: propListener,
        passive: false,
        once: false,
        removed: false,
      });
    }
    for (const registration of maybeListeners.values()) {
      listeners.push(registration);
    }
    invokeListeners(eventTarget, event, listeners, isCapture, errorState);
    return;
  }

  // Legacy path (flag OFF): only `addEventListener` listeners.
  const listenersByType = getListenersForPhase(eventTarget, isCapture);
  const maybeListeners = listenersByType?.get(event.type);
  if (maybeListeners == null) {
    return;
  }
  invokeListeners(
    eventTarget,
    event,
    Array.from(maybeListeners.values()),
    isCapture,
    errorState,
  );
}

function invokeListeners(
  eventTarget: EventTarget,
  event: Event,
  listeners: Array<EventListenerRegistration>,
  isCapture: boolean,
  errorState: ListenerErrorState | null,
): void {
  for (const listener of listeners) {
    if (listener.removed) {
      continue;
    }

    if (listener.once) {
      eventTarget.removeEventListener(event.type, listener.callback, isCapture);
    }

    if (listener.passive) {
      setInPassiveListenerFlag(event, true);
    }

    const currentEvent = global.event;
    global.event = event;

    const callback = listener.callback;

    try {
      if (typeof callback === 'function') {
        callback.call(eventTarget, event);
        // $FlowExpectedError[method-unbinding]
      } else if (typeof callback.handleEvent === 'function') {
        callback.handleEvent(event);
      }
    } catch (error) {
      handleListenerError(error, errorState);
    }

    if (listener.passive) {
      setInPassiveListenerFlag(event, false);
    }

    global.event = currentEvent;

    if (getStopImmediatePropagationFlag(event)) {
      break;
    }
  }
}

const CAPTURING_LISTENERS_KEY = Symbol('capturingListeners');
const BUBBLING_LISTENERS_KEY = Symbol('bubblingListeners');

function getListenersForPhase(
  eventTarget: EventTarget,
  isCapture: boolean,
): ?ListenersMap {
  return isCapture
    ? // $FlowExpectedError[prop-missing]
      eventTarget[CAPTURING_LISTENERS_KEY]
    : // $FlowExpectedError[prop-missing]
      eventTarget[BUBBLING_LISTENERS_KEY];
}

function setListenersMap(
  eventTarget: EventTarget,
  isCapture: boolean,
  listenersMap: ListenersMap,
): void {
  if (isCapture) {
    // $FlowExpectedError[prop-missing]
    eventTarget[CAPTURING_LISTENERS_KEY] = listenersMap;
  } else {
    // $FlowExpectedError[prop-missing]
    eventTarget[BUBBLING_LISTENERS_KEY] = listenersMap;
  }
}

const EVENT_DISPATCH_FLAG = Symbol('Event.dispatch');

function getEventDispatchFlag(event: Event): boolean {
  // $FlowExpectedError[prop-missing]
  return event[EVENT_DISPATCH_FLAG];
}

function setEventDispatchFlag(event: Event, value: boolean): void {
  // $FlowExpectedError[prop-missing]
  event[EVENT_DISPATCH_FLAG] = value;
}

type ListenerErrorState = {hasError: boolean, error: unknown};

/**
 * Handle an error thrown by an event listener without aborting the rest of the
 * dispatch.
 *
 * For trusted dispatch of native UI events (`errorState` is non-null), the
 * first error is recorded so `dispatch` can rethrow it synchronously once the
 * dispatch completes, matching the legacy plugin path (React's
 * runEventsInBatch + `rethrowCaughtError`). This keeps listener errors
 * catchable by React error boundaries and the native event call, instead of
 * escaping as deferred uncaught exceptions.
 *
 * Otherwise (`errorState` is null: the public `dispatchEvent` API, XHR, etc.)
 * the DOM spec requires reporting the exception to the global error handler
 * without throwing, so it is deferred via `reportListenerError`.
 */
function handleListenerError(
  error: unknown,
  errorState: ListenerErrorState | null,
): void {
  if (errorState != null) {
    if (!errorState.hasError) {
      errorState.hasError = true;
      errorState.error = error;
    }
    return;
  }

  reportListenerError(error);
}

/**
 * Surface a listener error to the global error handler without aborting the
 * rest of the dispatch. Throws in a new task so the error becomes an uncaught
 * exception. Used for dispatches that follow the DOM `dispatchEvent` contract
 * (the public API, XHR, etc.), where errors are reported rather than thrown
 * synchronously.
 *
 * `setTimeout(0)` schedules a new macrotask; the throw inside it has no
 * catcher above, so it bubbles up to the host's unhandled-error reporter.
 */
function reportListenerError(error: unknown): void {
  setTimeout(() => {
    throw error;
  }, 0);
}
