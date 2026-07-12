/**
 * Based on abort-controller by Toru Nagashima
 * https://github.com/mysticatea/abort-controller
 *
 * Original work Copyright (c) 2017 Toru Nagashima
 * Modified work Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @flow strict
 * @format
 */

// flowlint unsafe-getters-setters:off

import type {EventCallback} from '../events/EventTarget';

import DOMException from '../../errors/DOMException';
import Event from '../events/Event';
import {
  getEventHandlerAttribute,
  setEventHandlerAttribute,
} from '../events/EventHandlerAttributes';
import EventTarget from '../events/EventTarget';
import {dispatchTrustedEvent} from '../events/internals/EventTargetInternals';
import {AbortController} from './AbortController';

const ABORTED_KEY: symbol = Symbol('aborted');
const REASON_KEY: symbol = Symbol('reason');

/**
 * The signal class.
 * @see https://dom.spec.whatwg.org/#abortsignal
 */
export class AbortSignal extends EventTarget {
  /**
   *
   * Returns an AbortSignal instance whose abort reason is set to reason if not undefined; otherwise to an "AbortError" DOMException.
   *  Docs: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/abort_static
   *  Spec: https://dom.spec.whatwg.org/#dom-abortsignal-abort
   */
  static abort(reason: unknown): AbortSignal {
    const signal = createAbortSignal();
    abortSignal(reason, signal);
    return signal;
  }

  /**
   *  AbortSignal.timeout static method
   *   Docs: https:developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static
   *   Spec: https://dom.spec.whatwg.org/#dom-abortsignal-timeout
   */
  static timeout(timeInMs: number): AbortSignal {
    if (!(timeInMs >= 0)) {
      throw new TypeError(
        "Failed to execute 'timeout' on 'AbortSignal': The provided value has to be a non-negative number.",
      );
    }
    const controller = new AbortController();
    setTimeout(
      () =>
        controller.abort(new DOMException('signal timed out', 'TimeoutError')),
      timeInMs,
    );
    return controller.signal;
  }

  /**
   * 3. AbortSignal.any static method
   *  Docs: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static
   *  Spec: https://dom.spec.whatwg.org/#dom-abortsignal-any
   */
  static any(signals: AbortSignal[]): AbortSignal {
    if (!Array.isArray(signals)) {
      throw new TypeError('The signals value must be an instance of Array');
    }

    // First pass: validate that every item is an AbortSignal.
    for (let i = 0; i < signals.length; i++) {
      const signal = signals[i];
      if (!(signal instanceof AbortSignal)) {
        throw new TypeError(
          'The "signals[' +
            i +
            ']" argument must be an instance of AbortSignal',
        );
      }
    }

    // Second pass: short-circuit if any of the signals is already aborted. No
    // listeners have been registered yet, so there is nothing to clean up if
    // we return early.
    for (let i = 0; i < signals.length; i++) {
      const signal = signals[i];
      if (signal.aborted) {
        return AbortSignal.abort(signal.reason);
      }
    }

    // Third pass: none of the signals is aborted, so subscribe to all of them
    // and abort the resulting signal when any of them aborts.
    const controller = new AbortController();
    const listeners = [];
    const cleanup = () => listeners.forEach(unsubscribe => unsubscribe());

    for (let i = 0; i < signals.length; i++) {
      const signal = signals[i];
      const onAbort = () => {
        controller.abort(signal.reason);
        cleanup();
      };
      signal.addEventListener('abort', onAbort);
      listeners.push(() => signal.removeEventListener('abort', onAbort));
    }
    return controller.signal;
  }

  // $FlowExpectedError[unsupported-syntax]
  [ABORTED_KEY]: boolean = false;
  // $FlowExpectedError[unsupported-syntax]
  [REASON_KEY]: unknown;

  /**
   * Returns `true` if this `AbortSignal`'s `AbortController` has signaled to abort, and `false` otherwise.
   */
  get aborted(): boolean {
    // $FlowExpectedError[prop-missing]
    const aborted = this[ABORTED_KEY];
    if (typeof aborted !== 'boolean') {
      throw new TypeError(
        `Expected 'this' to be an 'AbortSignal' object, but got ${
          // $FlowExpectedError[invalid-compare]
          this === null ? 'null' : typeof this
        }`,
      );
    }
    return aborted;
  }

  get reason(): unknown {
    // $FlowExpectedError[prop-missing]
    return this[REASON_KEY];
  }

  get onabort(): EventCallback | null {
    return getEventHandlerAttribute(this, 'abort');
  }

  set onabort(listener: ?EventCallback): void {
    setEventHandlerAttribute(this, 'abort', listener);
  }

  throwIfAborted(): void {
    if (this.aborted) {
      throw this.reason;
    }
  }
}

/**
 * Create an AbortSignal object.
 */
export function createAbortSignal(): AbortSignal {
  return new AbortSignal();
}

/**
 * Abort a given signal.
 */
export function abortSignal(
  reason: unknown | void = new DOMException(
    'signal is aborted without reason',
    'AbortError',
  ),
  signal: AbortSignal,
): void {
  // $FlowExpectedError[invalid-compare]
  // $FlowExpectedError[prop-missing]
  if (signal[ABORTED_KEY] !== false) {
    return;
  }
  // $FlowExpectedError[prop-missing]
  signal[ABORTED_KEY] = true;
  // $FlowExpectedError[prop-missing]
  signal[REASON_KEY] = reason;
  dispatchTrustedEvent(signal, new Event('abort'));
}

// Properties should be enumerable.
//$FlowExpectedError[cannot-write]
Object.defineProperties(AbortSignal.prototype, {
  aborted: {enumerable: true},
  reason: {enumerable: true},
  onabort: {enumerable: true},
  throwIfAborted: {enumerable: true},
});

// `toString()` should return `"[object AbortSignal]"`
Object.defineProperty(AbortSignal.prototype, Symbol.toStringTag, {
  configurable: true,
  value: 'AbortSignal',
});

/**
 * AbortSignal cannot be constructed directly.
 * So this wrapper is used to achieve such behavior
 */
export const AbortSignal_public: typeof AbortSignal =
  /* eslint-disable no-shadow */
  // $FlowExpectedError[incompatible-type]
  function AbortSignal() {
    throw new TypeError(
      "Failed to construct 'AbortSignal': Illegal constructor",
    );
  };

// Copy static properties ('length', 'name', 'prototype', 'abort', 'any', 'timeout') so that callers accessing them via the public constructor (e.g. `AbortSignal.timeout(0)`) still work.
// $FlowFixMe[unsafe-object-assign]
// $FlowFixMe[not-an-object]
Object.getOwnPropertyNames(AbortSignal).forEach(methodName => {
  Object.defineProperty(
    AbortSignal_public,
    methodName,
    // $FlowExpectedError[incompatible-type]
    Object.getOwnPropertyDescriptor(AbortSignal, methodName),
  );
});
