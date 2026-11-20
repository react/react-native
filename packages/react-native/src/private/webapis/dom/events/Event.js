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
 * This module implements the `Event` interface from the DOM.
 * See https://dom.spec.whatwg.org/#interface-event.
 */

import type EventTarget from './EventTarget';
import type {EventInitWithTimestamp} from './internals/EventInternals';

import {setPlatformObject} from '../../webidl/PlatformObjects';
import {
  BUBBLED_PROP_NAME_KEY,
  CAPTURED_PROP_NAME_KEY,
  COMPOSED_PATH_KEY,
  CURRENT_TARGET_KEY,
  EVENT_INIT_TIMESTAMP_KEY,
  EVENT_PHASE_KEY,
  IN_PASSIVE_LISTENER_FLAG_KEY,
  IS_TRUSTED_KEY,
  STOP_IMMEDIATE_PROPAGATION_FLAG_KEY,
  STOP_PROPAGATION_FLAG_KEY,
  TARGET_KEY,
  getComposedPath,
  getCurrentTarget,
  getEventPhase,
  getInPassiveListenerFlag,
  getIsTrusted,
  getStopPropagationFlag,
  getTarget,
  setStopImmediatePropagationFlag,
  setStopPropagationFlag,
} from './internals/EventInternals';

export interface EventInit {
  readonly bubbles?: boolean;
  readonly cancelable?: boolean;
  readonly composed?: boolean;
  // React Native-specific. When true, the event is a "direct" event: it is
  // dispatched only to the target node (single AT_TARGET phase) and never
  // captures or bubbles through ancestors. A direct event must not bubble, so
  // `bubbles` cannot also be true.
  readonly rnIsDirect?: boolean;
}

export default class Event {
  static readonly NONE: 0;
  static readonly CAPTURING_PHASE: 1;
  static readonly AT_TARGET: 2;
  static readonly BUBBLING_PHASE: 3;

  readonly NONE: 0;
  readonly CAPTURING_PHASE: 1;
  readonly AT_TARGET: 2;
  readonly BUBBLING_PHASE: 3;

  _bubbles: boolean;
  _cancelable: boolean;
  _composed: boolean;
  _rnIsDirect: boolean;
  _type: string;

  _defaultPrevented: boolean = false;
  _timeStamp: number;

  [COMPOSED_PATH_KEY]: ReadonlyArray<EventTarget> = [];
  [CURRENT_TARGET_KEY]: EventTarget | null = null;
  [EVENT_PHASE_KEY]: EventPhase = Event.NONE;
  [IN_PASSIVE_LISTENER_FLAG_KEY]: boolean = false;
  [IS_TRUSTED_KEY]: boolean = false;
  [STOP_IMMEDIATE_PROPAGATION_FLAG_KEY]: boolean = false;
  [STOP_PROPAGATION_FLAG_KEY]: boolean = false;
  [TARGET_KEY]: EventTarget | null = null;
  [BUBBLED_PROP_NAME_KEY]: string | null | void;
  [CAPTURED_PROP_NAME_KEY]: string | null | void;

  constructor(type: string, options?: ?EventInit) {
    if (arguments.length < 1) {
      throw new TypeError(
        "Failed to construct 'Event': 1 argument required, but only 0 present.",
      );
    }

    const typeOfOptions = typeof options;

    if (
      options != null &&
      typeOfOptions !== 'object' &&
      typeOfOptions !== 'function'
    ) {
      throw new TypeError(
        "Failed to construct 'Event': The provided value is not of type 'EventInit'.",
      );
    }

    this._type = String(type);
    this._bubbles = Boolean(options?.bubbles);
    this._cancelable = Boolean(options?.cancelable);
    this._composed = Boolean(options?.composed);
    this._rnIsDirect = Boolean(options?.rnIsDirect);

    // A direct event is dispatched only to its target and never propagates, so
    // it cannot bubble. Reject the contradictory combination at construction
    // time.
    if (this._rnIsDirect && this._bubbles) {
      throw new TypeError(
        "Failed to construct 'Event': 'rnIsDirect' cannot be true when 'bubbles' is also true.",
      );
    }

    // For internal construction of events using a custom timestamp (instead of
    // event object creation), for use cases like dispatching events from the
    // host platform using the original timestamps.
    const initTimestamp: number | void = (
      options as EventInitWithTimestamp | null | void
    )?.[EVENT_INIT_TIMESTAMP_KEY];
    this._timeStamp =
      initTimestamp !== undefined ? initTimestamp : performance.now();
  }

  // $FlowFixMe[unsafe-getters-setters]
  get bubbles(): boolean {
    return this._bubbles;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get cancelable(): boolean {
    return this._cancelable;
  }

  /**
   * Historical alias for the stop-propagation flag. Reading it returns whether
   * `stopPropagation()` has been called (or `cancelBubble` has been set to
   * `true`). Setting it to `true` stops propagation; setting it to `false` is a
   * no-op. See https://dom.spec.whatwg.org/#dom-event-cancelbubble.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get cancelBubble(): boolean {
    return getStopPropagationFlag(this);
  }

  // $FlowFixMe[unsafe-getters-setters]
  set cancelBubble(value: boolean) {
    if (value) {
      setStopPropagationFlag(this, true);
    }
  }

  // $FlowFixMe[unsafe-getters-setters]
  get composed(): boolean {
    return this._composed;
  }

  /**
   * React Native-specific. When true, this event is dispatched only to its
   * target (single `AT_TARGET` phase) and never captures or bubbles through
   * ancestors.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get rnIsDirect(): boolean {
    return this._rnIsDirect;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get currentTarget(): EventTarget | null {
    return getCurrentTarget(this);
  }

  // $FlowFixMe[unsafe-getters-setters]
  get defaultPrevented(): boolean {
    return this._defaultPrevented;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get eventPhase(): EventPhase {
    return getEventPhase(this);
  }

  // $FlowFixMe[unsafe-getters-setters]
  get isTrusted(): boolean {
    return getIsTrusted(this);
  }

  // $FlowFixMe[unsafe-getters-setters]
  get target(): EventTarget | null {
    return getTarget(this);
  }

  // $FlowFixMe[unsafe-getters-setters]
  get timeStamp(): number {
    return this._timeStamp;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get type(): string {
    return this._type;
  }

  composedPath(): ReadonlyArray<EventTarget> {
    return getComposedPath(this).slice();
  }

  preventDefault(): void {
    if (!this._cancelable) {
      return;
    }

    if (getInPassiveListenerFlag(this)) {
      console.error(
        new Error(
          'Unable to preventDefault inside passive event listener invocation.',
        ),
      );
      return;
    }

    this._defaultPrevented = true;
  }

  stopImmediatePropagation(): void {
    setStopPropagationFlag(this, true);
    setStopImmediatePropagationFlag(this, true);
  }

  stopPropagation(): void {
    setStopPropagationFlag(this, true);
  }
}

// $FlowExpectedError[cannot-write]
Object.defineProperty(Event, 'NONE', {
  enumerable: true,
  value: 0,
});

// $FlowExpectedError[cannot-write]
Object.defineProperty(Event.prototype, 'NONE', {
  enumerable: true,
  value: 0,
});

// $FlowExpectedError[cannot-write]
Object.defineProperty(Event, 'CAPTURING_PHASE', {
  enumerable: true,
  value: 1,
});

// $FlowExpectedError[cannot-write]
Object.defineProperty(Event.prototype, 'CAPTURING_PHASE', {
  enumerable: true,
  value: 1,
});

// $FlowExpectedError[cannot-write]
Object.defineProperty(Event, 'AT_TARGET', {
  enumerable: true,
  value: 2,
});

// $FlowExpectedError[cannot-write]
Object.defineProperty(Event.prototype, 'AT_TARGET', {
  enumerable: true,
  value: 2,
});

// $FlowExpectedError[cannot-write]
Object.defineProperty(Event, 'BUBBLING_PHASE', {
  enumerable: true,
  value: 3,
});

// $FlowExpectedError[cannot-write]
Object.defineProperty(Event.prototype, 'BUBBLING_PHASE', {
  enumerable: true,
  value: 3,
});

export type EventPhase =
  | (typeof Event)['NONE']
  | (typeof Event)['CAPTURING_PHASE']
  | (typeof Event)['AT_TARGET']
  | (typeof Event)['BUBBLING_PHASE'];

setPlatformObject(Event);
