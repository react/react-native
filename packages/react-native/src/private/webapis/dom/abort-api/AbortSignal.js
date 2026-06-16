/**
 * @flow strict
 * @format
 */
import Event from '../events/Event';
import EventTarget from '../events/EventTarget'



/**
 * The signal class.
 * @see https://dom.spec.whatwg.org/#abortsignal
 */
export class AbortSignal extends EventTarget {
  /**
   * AbortSignal cannot be constructed directly.
   */
  constructor() {
    super();
    throw new TypeError('AbortSignal cannot be constructed directly');
  }

  /**
   * Returns `true` if this `AbortSignal`'s `AbortController` has signaled to abort, and `false` otherwise.
   */
  // $FlowExpectedError[unsafe-getters-setters]
  get aborted(): boolean {
    const aborted = abortedFlags.get(this);
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
}

const listeners = new WeakMap<AbortSignal, (()=> void)>();
Object.defineProperty(AbortSignal.prototype, `onabort`, {
  enumerable: true,
  configurable: true,
  get() {
    // $FlowExpectedError[object-this-reference]
    return listeners.get(this) || null;
  },
  // $FlowExpectedError[missing-local-annot]
  set(value) {
    // $FlowExpectedError[object-this-reference]
    const currentListener = listeners.get(this);
    if (currentListener === value) return; // same handler? do nothing!
    if (currentListener) {
      // Before setting a new listener, remove the old one if exists
      // $FlowExpectedError[object-this-reference]
      this.removeEventListener('abort', currentListener);
    }
    if (typeof value === 'function') {
      // $FlowExpectedError[object-this-reference]
      listeners.set(this, value);
      // $FlowExpectedError[object-this-reference]
      this.addEventListener('abort', value);
    } else {
      // $FlowExpectedError[object-this-reference]
      listeners.delete(this);
    }
  },
});


/**
 * Create an AbortSignal object.
 */
export function createAbortSignal(): AbortSignal {
  const signal = Object.create(AbortSignal.prototype);
  // $FlowExpectedError[incompatible-type]
  EventTarget.call(signal);
  abortedFlags.set(signal, false);
  return signal;
}

/**
 * Abort a given signal.
 */
export function abortSignal(signal: AbortSignal): void {
  if (abortedFlags.get(signal) !== false) {
    return;
  }

  abortedFlags.set(signal, true);
  // $FlowExpectedError[incompatible-type]
  signal.dispatchEvent(new Event('abort'));
}

/**
 * Aborted flag for each instances.
 */
const abortedFlags = new WeakMap<AbortSignal, boolean>()

// Properties should be enumerable.
//$FlowExpectedError[cannot-write]
Object.defineProperties(AbortSignal.prototype, {
  aborted: {enumerable: true},
});


// `toString()` should return `"[object AbortSignal]"`
if (typeof Symbol === "function" && typeof Symbol.toStringTag === "symbol") {
  Object.defineProperty(AbortSignal.prototype, Symbol.toStringTag, {
    configurable: true,
    value: "AbortSignal",
  })
}
