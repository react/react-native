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

export const COMPOSED_PATH_KEY: symbol = Symbol('composedPath');
export const CURRENT_TARGET_KEY: symbol = Symbol('currentTarget');
export const EVENT_PHASE_KEY: symbol = Symbol('eventPhase');
export const IN_PASSIVE_LISTENER_FLAG_KEY: symbol = Symbol(
  'inPassiveListenerFlag',
);
export const IS_TRUSTED_KEY: symbol = Symbol('isTrusted');
export const STOP_IMMEDIATE_PROPAGATION_FLAG_KEY: symbol = Symbol(
  'stopPropagationFlag',
);
export const STOP_PROPAGATION_FLAG_KEY: symbol = Symbol('stopPropagationFlag');
export const TARGET_KEY: symbol = Symbol('target');

// For internal construction of events using a custom timestamp (instead of
// event object creation), for use cases like dispatching events from the host
// platform using the original timestamps.
export const EVENT_INIT_TIMESTAMP_KEY: symbol = Symbol('eventInitTimestamp');

// Internal slots used by the React Native renderer to pass pre-resolved
// React prop names ("onPointerUp" / "onPointerUpCapture") through the event
// to subclasses of `EventTarget` (i.e. `ReactNativeElement`). This avoids
// recomputing `getEventTypePropName(event.type, isCapture)` per ancestor per
// phase during dispatch, which is hot.
export const BUBBLED_PROP_NAME_KEY: symbol = Symbol('bubbledPropName');
export const CAPTURED_PROP_NAME_KEY: symbol = Symbol('capturedPropName');

export function getBubbledPropName(event: Event): string | null | void {
  // $FlowExpectedError[prop-missing]
  return event[BUBBLED_PROP_NAME_KEY];
}

export function setBubbledPropName(
  event: Event,
  propName: string | null,
): void {
  // $FlowExpectedError[prop-missing]
  // $FlowExpectedError[invalid-computed-prop]
  event[BUBBLED_PROP_NAME_KEY] = propName;
}

export function getCapturedPropName(event: Event): string | null | void {
  // $FlowExpectedError[prop-missing]
  return event[CAPTURED_PROP_NAME_KEY];
}

export function setCapturedPropName(
  event: Event,
  propName: string | null,
): void {
  // $FlowExpectedError[prop-missing]
  // $FlowExpectedError[invalid-computed-prop]
  event[CAPTURED_PROP_NAME_KEY] = propName;
}

export function getCurrentTarget(event: Event): EventTarget | null {
  // $FlowExpectedError[prop-missing]
  return event[CURRENT_TARGET_KEY];
}

export function setCurrentTarget(
  event: Event,
  currentTarget: EventTarget | null,
): void {
  // $FlowExpectedError[prop-missing]
  event[CURRENT_TARGET_KEY] = currentTarget;
}

export function getComposedPath(event: Event): ReadonlyArray<EventTarget> {
  // $FlowExpectedError[prop-missing]
  return event[COMPOSED_PATH_KEY];
}

export function setComposedPath(
  event: Event,
  composedPath: ReadonlyArray<EventTarget>,
): void {
  // $FlowExpectedError[prop-missing]
  event[COMPOSED_PATH_KEY] = composedPath;
}

export function getEventPhase(event: Event): EventPhase {
  // $FlowExpectedError[prop-missing]
  return event[EVENT_PHASE_KEY];
}

export function setEventPhase(event: Event, eventPhase: EventPhase): void {
  // $FlowExpectedError[prop-missing]
  event[EVENT_PHASE_KEY] = eventPhase;
}

export function getInPassiveListenerFlag(event: Event): boolean {
  // $FlowExpectedError[prop-missing]
  return event[IN_PASSIVE_LISTENER_FLAG_KEY];
}

export function setInPassiveListenerFlag(event: Event, value: boolean): void {
  // $FlowExpectedError[prop-missing]
  event[IN_PASSIVE_LISTENER_FLAG_KEY] = value;
}

export function getIsTrusted(event: Event): boolean {
  // $FlowExpectedError[prop-missing]
  return event[IS_TRUSTED_KEY];
}

export function setIsTrusted(event: Event, isTrusted: boolean): void {
  // $FlowExpectedError[prop-missing]
  event[IS_TRUSTED_KEY] = isTrusted;
}

export function getStopImmediatePropagationFlag(event: Event): boolean {
  // $FlowExpectedError[prop-missing]
  return event[STOP_IMMEDIATE_PROPAGATION_FLAG_KEY];
}

export function setStopImmediatePropagationFlag(
  event: Event,
  value: boolean,
): void {
  // $FlowExpectedError[prop-missing]
  event[STOP_IMMEDIATE_PROPAGATION_FLAG_KEY] = value;
}

export function getStopPropagationFlag(event: Event): boolean {
  // $FlowExpectedError[prop-missing]
  return event[STOP_PROPAGATION_FLAG_KEY];
}

export function setStopPropagationFlag(event: Event, value: boolean): void {
  // $FlowExpectedError[prop-missing]
  event[STOP_PROPAGATION_FLAG_KEY] = value;
}

export function getTarget(event: Event): EventTarget | null {
  // $FlowExpectedError[prop-missing]
  return event[TARGET_KEY];
}

export function setTarget(event: Event, target: EventTarget | null): void {
  // $FlowExpectedError[prop-missing]
  event[TARGET_KEY] = target;
}

export function setEventInitTimeStamp(
  eventInit: EventInit,
  timeStamp: number,
): void {
  if (typeof timeStamp !== 'number') {
    return;
  }
  // $FlowExpectedError[prop-missing]
  // $FlowExpectedError[invalid-computed-prop]
  eventInit[EVENT_INIT_TIMESTAMP_KEY] = timeStamp;
}
