/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @deprecated
 */

import NativeTiming from './NativeTiming';

const toError = require('../../../src/private/utilities/toError').default;
const BatchedBridge = require('../../BatchedBridge/BatchedBridge').default;
const {trace} = require('../../Performance/Systrace');
const invariant = require('invariant');

/**
 * JS implementation of timer functions. Must be completely driven by an
 * external clock signal, all that's stored here is timerID, timer type, and
 * callback.
 */

export type JSTimerType =
  | 'setTimeout'
  | 'setInterval'
  | 'requestAnimationFrame'
  | 'queueReactNativeMicrotask'
  | 'requestIdleCallback';

// These timing constants should be kept in sync with the ones in native ios and
// android `RCTTiming` module.
const FRAME_DURATION = 1000 / 60;
const IDLE_CALLBACK_FRAME_DEADLINE = 1;

// Parallel arrays
const callbacks: Array<?Function> = [];
const types: Array<?JSTimerType> = [];
const timerIDs: Array<?number> = [];
const freeIdxs: Array<number> = [];
let reactNativeMicrotasks: Array<number> = [];
let requestIdleCallbacks: Array<number> = [];
const requestIdleCallbackTimeouts: {[number]: number, ...} = {};

let GUID = 1;
const errors: Array<Error> = [];

let hasEmittedTimeDriftWarning = false;

// Returns a free index if one is available, and the next consecutive index otherwise.
function _getFreeIndex(): number {
  const freeIdx = freeIdxs.pop();
  if (freeIdx === undefined) {
    return timerIDs.length;
  }
  return freeIdx;
}

function _allocateCallback(func: Function, type: JSTimerType): number {
  const id = GUID++;
  const freeIndex = _getFreeIndex();
  timerIDs[freeIndex] = id;
  callbacks[freeIndex] = func;
  types[freeIndex] = type;
  return id;
}

/**
 * Calls the callback associated with the ID. Also unregister that callback
 * if it was a one time timer (setTimeout), and not unregister it if it was
 * recurring (setInterval).
 */
function _callTimer(timerID: number, frameTime: number, didTimeout: ?boolean) {
  if (timerID > GUID) {
    console.warn(
      'Tried to call timer with ID %s but no such timer exists.',
      timerID,
    );
  }

  // timerIndex of -1 means that no timer with that ID exists. There are
  // two situations when this happens, when a garbage timer ID was given
  // and when a previously existing timer was deleted before this callback
  // fired. In both cases we want to ignore the timer id, but in the former
  // case we warn as well.
  const timerIndex = timerIDs.indexOf(timerID);
  if (timerIndex === -1) {
    return;
  }

  const type = types[timerIndex];
  const callback = callbacks[timerIndex];
  if (!callback || !type) {
    console.error('No callback found for timerID ' + timerID);
    return;
  }

  const doCallTimer = () => {
    // Clear the metadata
    if (type !== 'setInterval') {
      _clearIndex(timerIndex);
    }

    try {
      if (
        type === 'setTimeout' ||
        type === 'setInterval' ||
        type === 'queueReactNativeMicrotask'
      ) {
        callback();
      } else if (type === 'requestAnimationFrame') {
        callback(global.performance.now());
      } else if (type === 'requestIdleCallback') {
        callback({
          timeRemaining: function () {
            // TODO: Optimisation: allow running for longer than one frame if
            // there are no pending JS calls on the bridge from native. This
            // would require a way to check the bridge queue synchronously.
            return Math.max(
              0,
              FRAME_DURATION - (global.performance.now() - frameTime),
            );
          },
          didTimeout: !!didTimeout,
        });
      } else {
        console.error('Tried to call a callback with invalid type: ' + type);
      }
    } catch (e: unknown) {
      // Don't rethrow so that we can run all timers.
      errors.push(toError(e));
    }
  };

  if (__DEV__) {
    trace(type + ' [invoke]', doCallTimer);
  } else {
    doCallTimer();
  }
}

/**
 * Performs a single pass over the enqueued reactNativeMicrotasks. Returns whether
 * more reactNativeMicrotasks are queued up (can be used as a condition a while loop).
 */
function _callReactNativeMicrotasksPass() {
  if (reactNativeMicrotasks.length === 0) {
    return false;
  }

  const runPass = () => {
    // The main reason to extract a single pass is so that we can track
    // in the system trace
    const passReactNativeMicrotasks = reactNativeMicrotasks;
    reactNativeMicrotasks = [];

    // Use for loop rather than forEach as per @vjeux's advice
    // https://github.com/facebook/react-native/commit/c8fd9f7588ad02d2293cac7224715f4af7b0f352#commitcomment-14570051
    for (let i = 0; i < passReactNativeMicrotasks.length; ++i) {
      _callTimer(passReactNativeMicrotasks[i], 0);
    }
  };

  if (__DEV__) {
    trace('callReactNativeMicrotasksPass()', runPass);
  } else {
    runPass();
  }

  return reactNativeMicrotasks.length > 0;
}

function _clearIndex(i: number) {
  timerIDs[i] = null;
  callbacks[i] = null;
  types[i] = null;
  freeIdxs.push(i);
}

function _freeCallback(timerID: number) {
  // timerIDs contains nulls after timers have been removed;
  // ignore nulls upfront so indexOf doesn't find them
  if (timerID == null) {
    return;
  }

  const index = timerIDs.indexOf(timerID);
  // See corresponding comment in `callTimers` for reasoning behind this
  if (index !== -1) {
    const type = types[index];
    _clearIndex(index);
    if (
      type !== 'queueReactNativeMicrotask' &&
      type !== 'requestIdleCallback'
    ) {
      deleteTimer(timerID);
    }
  }
}

/**
 * JS implementation of timer functions. Must be completely driven by an
 * external clock signal, all that's stored here is timerID, timer type, and
 * callback.
 */
const JSTimers = {
  /**
   * @param {function} func Callback to be invoked after `duration` ms.
   * @param {number} duration Number of milliseconds.
   */
  setTimeout: function (
    func: Function,
    duration: number,
    ...args: any
  ): number {
    const id = _allocateCallback(
      () => func.apply(undefined, args),
      'setTimeout',
    );
    createTimer(id, duration || 0, Date.now(), /* recurring */ false);
    return id;
  },

  /**
   * @param {function} func Callback to be invoked every `duration` ms.
   * @param {number} duration Number of milliseconds.
   */
  setInterval: function (
    func: Function,
    duration: number,
    ...args: any
  ): number {
    const id = _allocateCallback(
      () => func.apply(undefined, args),
      'setInterval',
    );
    createTimer(id, duration || 0, Date.now(), /* recurring */ true);
    return id;
  },

  /**
   * The React Native microtask mechanism is used to back public APIs e.g.
   * `queueMicrotask`, `clearImmediate`, and `setImmediate` (which is used by
   * the Promise polyfill) when the JSVM microtask mechanism is not used.
   *
   * @param {function} func Callback to be invoked before the end of the
   * current JavaScript execution loop.
   */
  queueReactNativeMicrotask: function (func: Function, ...args: any): number {
    const id = _allocateCallback(
      () => func.apply(undefined, args),
      'queueReactNativeMicrotask',
    );
    reactNativeMicrotasks.push(id);
    return id;
  },

  /**
   * @param {function} func Callback to be invoked every frame.
   */
  requestAnimationFrame: function (func: Function): any | number {
    const id = _allocateCallback(func, 'requestAnimationFrame');
    createTimer(id, 1, Date.now(), /* recurring */ false);
    return id;
  },

  /**
   * @param {function} func Callback to be invoked every frame and provided
   * with time remaining in frame.
   * @param {?object} options
   */
  requestIdleCallback: function (
    func: Function,
    options: ?Object,
  ): any | number {
    if (requestIdleCallbacks.length === 0) {
      setSendIdleEvents(true);
    }

    const timeout = options && options.timeout;
    const id: number = _allocateCallback(
      timeout != null
        ? (deadline: any) => {
            const timeoutId: number = requestIdleCallbackTimeouts[id];
            if (timeoutId) {
              JSTimers.clearTimeout(timeoutId);
              delete requestIdleCallbackTimeouts[id];
            }
            return func(deadline);
          }
        : func,
      'requestIdleCallback',
    );
    requestIdleCallbacks.push(id);

    if (timeout != null) {
      const timeoutId: number = JSTimers.setTimeout(() => {
        const index: number = requestIdleCallbacks.indexOf(id);
        if (index > -1) {
          requestIdleCallbacks.splice(index, 1);
          _callTimer(id, global.performance.now(), true);
        }
        delete requestIdleCallbackTimeouts[id];
        if (requestIdleCallbacks.length === 0) {
          setSendIdleEvents(false);
        }
      }, timeout);
      requestIdleCallbackTimeouts[id] = timeoutId;
    }
    return id;
  },

  cancelIdleCallback: function (timerID: number) {
    _freeCallback(timerID);
    const index = requestIdleCallbacks.indexOf(timerID);
    if (index !== -1) {
      requestIdleCallbacks.splice(index, 1);
    }

    const timeoutId = requestIdleCallbackTimeouts[timerID];
    if (timeoutId) {
      JSTimers.clearTimeout(timeoutId);
      delete requestIdleCallbackTimeouts[timerID];
    }

    if (requestIdleCallbacks.length === 0) {
      setSendIdleEvents(false);
    }
  },

  clearTimeout: function (timerID: number) {
    _freeCallback(timerID);
  },

  clearInterval: function (timerID: number) {
    _freeCallback(timerID);
  },

  clearReactNativeMicrotask: function (timerID: number) {
    _freeCallback(timerID);
    const index = reactNativeMicrotasks.indexOf(timerID);
    if (index !== -1) {
      reactNativeMicrotasks.splice(index, 1);
    }
  },

  cancelAnimationFrame: function (timerID: number) {
    _freeCallback(timerID);
  },

  /**
   * This is called from the native side. We are passed an array of timerIDs,
   * and
   */
  callTimers: function (timersToCall: Array<number>): any | void {
    invariant(
      timersToCall.length !== 0,
      'Cannot call `callTimers` with an empty list of IDs.',
    );

    errors.length = 0;
    for (let i = 0; i < timersToCall.length; i++) {
      _callTimer(timersToCall[i], 0);
    }

    const errorCount = errors.length;
    if (errorCount > 0) {
      if (errorCount > 1) {
        // Throw all the other errors in a setTimeout, which will throw each
        // error one at a time
        for (let ii = 1; ii < errorCount; ii++) {
          JSTimers.setTimeout(
            ((error: Error) => {
              throw error;
            }).bind(null, errors[ii]),
            0,
          );
        }
      }
      throw errors[0];
    }
  },

  callIdleCallbacks: function (frameTime: number) {
    if (
      FRAME_DURATION - (Date.now() - frameTime) <
      IDLE_CALLBACK_FRAME_DEADLINE
    ) {
      return;
    }

    errors.length = 0;
    if (requestIdleCallbacks.length > 0) {
      const passIdleCallbacks = requestIdleCallbacks;
      requestIdleCallbacks = [];

      for (let i = 0; i < passIdleCallbacks.length; ++i) {
        _callTimer(passIdleCallbacks[i], frameTime);
      }
    }

    if (requestIdleCallbacks.length === 0) {
      setSendIdleEvents(false);
    }

    errors.forEach(error =>
      JSTimers.setTimeout(() => {
        throw error;
      }, 0),
    );
  },

  /**
   * This is called after we execute any command we receive from native but
   * before we hand control back to native.
   */
  callReactNativeMicrotasks() {
    errors.length = 0;
    while (_callReactNativeMicrotasksPass()) {}
    errors.forEach(error =>
      JSTimers.setTimeout(() => {
        throw error;
      }, 0),
    );
  },

  /**
   * Called from native (in development) when environment times are out-of-sync.
   */
  emitTimeDriftWarning(warningMessage: string) {
    if (hasEmittedTimeDriftWarning) {
      return;
    }
    hasEmittedTimeDriftWarning = true;
    console.warn(warningMessage);
  },
};

function createTimer(
  callbackID: number,
  duration: number,
  jsSchedulingTime: number,
  repeats: boolean,
): void {
  invariant(NativeTiming, 'NativeTiming is available');
  NativeTiming.createTimer(callbackID, duration, jsSchedulingTime, repeats);
}

function deleteTimer(timerID: number): void {
  invariant(NativeTiming, 'NativeTiming is available');
  NativeTiming.deleteTimer(timerID);
}

function setSendIdleEvents(sendIdleEvents: boolean): void {
  invariant(NativeTiming, 'NativeTiming is available');
  NativeTiming.setSendIdleEvents(sendIdleEvents);
}

let ExportedJSTimers: {
  callIdleCallbacks: (frameTime: number) => any | void,
  callReactNativeMicrotasks: () => void,
  callTimers: (timersToCall: Array<number>) => any | void,
  cancelAnimationFrame: (timerID: number) => void,
  cancelIdleCallback: (timerID: number) => void,
  clearReactNativeMicrotask: (timerID: number) => void,
  clearInterval: (timerID: number) => void,
  clearTimeout: (timerID: number) => void,
  emitTimeDriftWarning: (warningMessage: string) => any | void,
  requestAnimationFrame: (func: any) => any | number,
  requestIdleCallback: (func: any, options: ?any) => any | number,
  queueReactNativeMicrotask: (func: any, ...args: any) => number,
  setInterval: (func: any, duration: number, ...args: any) => number,
  setTimeout: (func: any, duration: number, ...args: any) => number,
};

if (!NativeTiming) {
  console.warn("Timing native module is not available, can't set timers.");
  // $FlowFixMe[incompatible-type] : we can assume timers are generally available
  ExportedJSTimers = {
    callReactNativeMicrotasks: JSTimers.callReactNativeMicrotasks,
    queueReactNativeMicrotask: JSTimers.queueReactNativeMicrotask,
    // $FlowFixMe[incompatible-variance]
  } as typeof JSTimers;
} else {
  // $FlowFixMe[incompatible-variance]
  ExportedJSTimers = JSTimers;
}

BatchedBridge.setReactNativeMicrotasksCallback(
  JSTimers.callReactNativeMicrotasks,
);

export default ExportedJSTimers;
