/**
 * @flow strict
 * @format
 */
import {AbortSignal, abortSignal, createAbortSignal} from './AbortSignal';

/**
 * The AbortController.
 * @see https://dom.spec.whatwg.org/#abortcontroller
 */
export class AbortController {
  /**
   * Initialize this controller.
   */
  constructor() {
    signals.set(this, createAbortSignal());
  }

  /**
   * Returns the `AbortSignal` object associated with this object.
   */
  // $FlowExpectedError[unsafe-getters-setters]
  get signal(): AbortSignal {
    return getSignal(this);
  }

  /**
   * Abort and signal to any observers that the associated activity is to be aborted.
   */
  abort(): void {
    abortSignal(getSignal(this));
  }
}

/**
 * Associated signals.
 */
const signals = new WeakMap<AbortController, AbortSignal>()

/**
 * Get the associated signal of a given controller.
 */
function getSignal(controller: AbortController): AbortSignal {
  const signal = signals.get(controller)
  if (signal == null) {
    throw new TypeError(
      `Expected 'this' to be an 'AbortController' object, but got ${
        // $FlowExpectedError[invalid-compare]
        controller === null ? 'null' : typeof controller
      }`,
    );
  }
  return signal
}

// Properties should be enumerable.
//$FlowExpectedError[cannot-write]
Object.defineProperties(AbortController.prototype, {
  signal: { enumerable: true },
  abort: { enumerable: true },
})

if (typeof Symbol === "function" && typeof Symbol.toStringTag === "symbol") {
  //$FlowExpectedError[cannot-write]
  Object.defineProperty(AbortController.prototype, Symbol.toStringTag, {
    configurable: true,
    value: 'AbortController',
  });
}
