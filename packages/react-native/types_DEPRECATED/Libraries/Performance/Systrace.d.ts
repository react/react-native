/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

type EventName = string | (() => string);
type EventArgs = {[key: string]: string} | void | null;

/**
 * Indicates if the application is currently being traced.
 *
 * Calling methods on this module when the application isn't being traced is
 * cheap, but this method can be used to avoid computing expensive values for
 * those functions.
 *
 * @example
 * if (Systrace.isEnabled()) {
 *   const expensiveArgs = computeExpensiveArgs();
 *   Systrace.beginEvent('myEvent', expensiveArgs);
 * }
 */
export function isEnabled(): boolean;

/**
 * @deprecated This function is now a no-op but it's left for backwards
 * compatibility. `isEnabled` will now synchronously check if we're actively
 * profiling or not. This is necessary because we don't have callbacks to know
 * when profiling has started/stopped on Android APIs.
 */
export function setEnabled(_doEnable: boolean): void;

/**
 * Marks the start of a synchronous event that should end in the same stack
 * frame. The end of this event should be marked using the `endEvent` function.
 */
export function beginEvent(eventName: EventName, args?: EventArgs): void;

/**
 * Marks the end of a synchronous event started in the same stack frame.
 */
export function endEvent(args?: EventArgs): void;

/**
 * Marks the start of a potentially asynchronous event. The end of this event
 * should be marked calling the `endAsyncEvent` function with the cookie
 * returned by this function.
 */
export function beginAsyncEvent(eventName: EventName, args?: EventArgs): number;

/**
 * Registers a new value for a counter event.
 */
export function endAsyncEvent(
  eventName: EventName,
  cookie: number,
  args?: EventArgs,
): void;

/**
 * counterEvent registers the value to the eventName on the systrace timeline
 **/
export function counterEvent(eventName: EventName, value: number): void;
