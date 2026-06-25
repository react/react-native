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
 * This method contains internal implementation details for the `EventTarget`
 * module and it is defined in a separate module to keep the exports in
 * the original module clean (only with public exports).
 */

import type Event from '../Event';
import type EventTarget from '../EventTarget';

import {setIsTrusted} from './EventInternals';

/**
 * Use this symbol as key for a method to implement the "get the parent"
 * algorithm in an `EventTarget` subclass.
 */
export const EVENT_TARGET_GET_THE_PARENT_KEY: symbol = Symbol(
  'EventTarget[get the parent]',
);

/**
 * Use this symbol as key for a method to provide an additional event listener
 * from props in an `EventTarget` subclass.
 *
 * During event dispatch, this method is called before processing explicitly
 * registered `addEventListener` listeners. If it returns a non-null callback,
 * that callback is invoked as an event listener.
 */
export const EVENT_TARGET_GET_DECLARATIVE_LISTENER_KEY: symbol = Symbol(
  'EventTarget[get listener from props]',
);

/**
 * This is only exposed to implement the method in `EventTarget`.
 * Do NOT use this directly (use the `dispatchTrustedEvent` method instead).
 */
export const INTERNAL_DISPATCH_METHOD_KEY: symbol = Symbol(
  'EventTarget[dispatch]',
);

const EVENT_DISPATCH_PARENT_CACHE_KEY: symbol = Symbol(
  'EventTarget[dispatch parent cache]',
);

export function getEventTargetParent(target: EventTarget): EventTarget | null {
  // The slot is `undefined` until populated; a populated slot may hold
  // `null` (no parent), so check against `undefined` rather than nullishness.
  // $FlowExpectedError[prop-missing] symbol-keyed slot
  const cached: EventTarget | null | void =
    // $FlowExpectedError[prop-missing] symbol-keyed slot
    target[EVENT_DISPATCH_PARENT_CACHE_KEY];
  if (cached !== undefined) {
    return cached;
  }
  // $FlowExpectedError[prop-missing] symbol-keyed method
  const parent: EventTarget | null = target[EVENT_TARGET_GET_THE_PARENT_KEY]();
  // $FlowExpectedError[prop-missing] symbol-keyed slot
  target[EVENT_DISPATCH_PARENT_CACHE_KEY] = parent;
  return parent;
}

/**
 * Dispatches a trusted event to the given event target. Mirrors the
 * `dispatchEvent` method on `EventTarget`: returns `false` if the event
 * was canceled (i.e. `event.defaultPrevented`), otherwise `true`.
 *
 * This should only be used by the runtime to dispatch native events to
 * JavaScript.
 *
 * When `rethrowListenerErrors` is `true`, the first error thrown by a listener
 * is rethrown synchronously once dispatch completes (matching the legacy
 * plugin system's `rethrowCaughtError` behavior). This is used by the renderer
 * for native UI events so listener errors stay catchable by React error
 * boundaries and the native event call. When omitted/`false`, listener errors
 * are reported to the global error handler per the DOM spec (used by XHR and
 * other web API event targets).
 */
export function dispatchTrustedEvent(
  eventTarget: EventTarget,
  event: Event,
  rethrowListenerErrors?: boolean,
): boolean {
  setIsTrusted(event, true);

  // $FlowExpectedError[prop-missing]
  return eventTarget[INTERNAL_DISPATCH_METHOD_KEY](
    event,
    rethrowListenerErrors,
  );
}
