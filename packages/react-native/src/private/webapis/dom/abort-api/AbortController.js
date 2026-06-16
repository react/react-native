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

import {AbortSignal, abortSignal, createAbortSignal} from './AbortSignal';

const SIGNAL_KEY: symbol = Symbol('aborted');

/**
 * The AbortController.
 * @see https://dom.spec.whatwg.org/#abortcontroller
 */
export class AbortController {
  /**
   * Initialize this controller.
   */
  // $FlowExpectedError[unsupported-syntax]
  [SIGNAL_KEY]: AbortSignal;

  constructor() {
    // $FlowExpectedError[prop-missing]
    this[SIGNAL_KEY] = createAbortSignal();
  }

  /**
   * Returns the `AbortSignal` object associated with this object.
   */
  get signal(): AbortSignal {
    return getSignal(this);
  }

  /**
   * Abort and signal to any observers that the associated activity is to be aborted.
   */
  abort(reason: unknown): void {
    abortSignal(reason, getSignal(this));
  }
}

/**
 * Get the associated signal of a given controller.
 */
function getSignal(controller: AbortController): AbortSignal {
  // $FlowExpectedError[prop-missing]
  const signal = controller[SIGNAL_KEY];
  if (signal == null) {
    throw new TypeError(
      `Expected 'this' to be an 'AbortController' object, but got ${
        // $FlowExpectedError[invalid-compare]
        controller === null ? 'null' : typeof controller
      }`,
    );
  }
  return signal;
}

// Properties should be enumerable.
//$FlowExpectedError[cannot-write]
Object.defineProperties(AbortController.prototype, {
  signal: {enumerable: true},
  abort: {enumerable: true},
});

//$FlowExpectedError[cannot-write]
Object.defineProperty(AbortController.prototype, Symbol.toStringTag, {
  configurable: true,
  value: 'AbortController',
});
