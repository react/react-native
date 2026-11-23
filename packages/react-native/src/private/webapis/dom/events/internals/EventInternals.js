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
 * This method contains internal implementation details for the `Event` module
 * and it is defined in a separate module to keep the exports in `Event` clean
 * (only with public exports).
 */

import type Event, {EventInit, EventPhase} from '../Event';
import type EventTarget from '../EventTarget';

export const COMPOSED_PATH_KEY = Symbol('composedPath');
export const CURRENT_TARGET_KEY = Symbol('currentTarget');
export const EVENT_PHASE_KEY = Symbol('eventPhase');
export const IN_PASSIVE_LISTENER_FLAG_KEY = Symbol('inPassiveListenerFlag');
export const IS_TRUSTED_KEY = Symbol('isTrusted');
export const STOP_IMMEDIATE_PROPAGATION_FLAG_KEY = Symbol(
  'stopPropagationFlag',
);
export const STOP_PROPAGATION_FLAG_KEY = Symbol('stopPropagationFlag');
export const TARGET_KEY = Symbol('target');

// For internal construction of events using a custom timestamp (instead of
// event object creation), for use cases like dispatching events from the host
// platform using the original timestamps.
export const EVENT_INIT_TIMESTAMP_KEY = Symbol('eventInitTimestamp');

export interface EventInitWithTimestamp extends EventInit {
  [EVENT_INIT_TIMESTAMP_KEY]?: number;
}

// Internal slots used by the React Native renderer to pass pre-resolved
// React prop names ("onPointerUp" / "onPointerUpCapture") through the event
// to subclasses of `EventTarget` (i.e. `ReactNativeElement`). This avoids
// recomputing `getEventTypePropName(event.type, isCapture)` per ancestor per
// phase during dispatch, which is hot.
export const BUBBLED_PROP_NAME_KEY = Symbol('bubbledPropName');
export const CAPTURED_PROP_NAME_KEY = Symbol('capturedPropName');

export function getBubbledPropName(event: Event): string | null | void {
  return event[BUBBLED_PROP_NAME_KEY];
}

export function setBubbledPropName(
  event: Event,
  propName: string | null,
): void {
  event[BUBBLED_PROP_NAME_KEY] = propName;
}

export function getCapturedPropName(event: Event): string | null | void {
  return event[CAPTURED_PROP_NAME_KEY];
}

export function setCapturedPropName(
  event: Event,
  propName: string | null,
): void {
  event[CAPTURED_PROP_NAME_KEY] = propName;
}

export function getCurrentTarget(event: Event): EventTarget | null {
  return event[CURRENT_TARGET_KEY];
}

export function setCurrentTarget(
  event: Event,
  currentTarget: EventTarget | null,
): void {
  event[CURRENT_TARGET_KEY] = currentTarget;
}

export function getComposedPath(event: Event): ReadonlyArray<EventTarget> {
  return event[COMPOSED_PATH_KEY];
}

export function setComposedPath(
  event: Event,
  composedPath: ReadonlyArray<EventTarget>,
): void {
  event[COMPOSED_PATH_KEY] = composedPath;
}

export function getEventPhase(event: Event): EventPhase {
  return event[EVENT_PHASE_KEY];
}

export function setEventPhase(event: Event, eventPhase: EventPhase): void {
  event[EVENT_PHASE_KEY] = eventPhase;
}

export function getInPassiveListenerFlag(event: Event): boolean {
  return event[IN_PASSIVE_LISTENER_FLAG_KEY];
}

export function setInPassiveListenerFlag(event: Event, value: boolean): void {
  event[IN_PASSIVE_LISTENER_FLAG_KEY] = value;
}

export function getIsTrusted(event: Event): boolean {
  return event[IS_TRUSTED_KEY];
}

export function setIsTrusted(event: Event, isTrusted: boolean): void {
  event[IS_TRUSTED_KEY] = isTrusted;
}

export function getStopImmediatePropagationFlag(event: Event): boolean {
  return event[STOP_IMMEDIATE_PROPAGATION_FLAG_KEY];
}

export function setStopImmediatePropagationFlag(
  event: Event,
  value: boolean,
): void {
  event[STOP_IMMEDIATE_PROPAGATION_FLAG_KEY] = value;
}

export function getStopPropagationFlag(event: Event): boolean {
  return event[STOP_PROPAGATION_FLAG_KEY];
}

export function setStopPropagationFlag(event: Event, value: boolean): void {
  event[STOP_PROPAGATION_FLAG_KEY] = value;
}

export function getTarget(event: Event): EventTarget | null {
  return event[TARGET_KEY];
}

export function setTarget(event: Event, target: EventTarget | null): void {
  event[TARGET_KEY] = target;
}

export function setEventInitTimeStamp(
  eventInit: {...},
  timeStamp: number,
): void {
  if (typeof timeStamp !== 'number') {
    return;
  }
  Object.defineProperty(eventInit, EVENT_INIT_TIMESTAMP_KEY, {
    configurable: true,
    enumerable: true,
    value: timeStamp,
    writable: true,
  });
}
