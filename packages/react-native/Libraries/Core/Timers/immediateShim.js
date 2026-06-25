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

'use strict';

// Globally Unique Immediate ID.
let GUIID = 1;

// A global set of the currently cleared immediates.
const clearedImmediates: Set<number> = new Set();

/**
 * Shim the setImmediate API on top of queueMicrotask.
 * @param {function} func Callback to be invoked before the end of the
 * current JavaScript execution loop.
 */
export function setImmediate(callback: Function, ...args: any): number {
  if (arguments.length < 1) {
    throw new TypeError(
      'setImmediate must be called with at least one argument (a function to call)',
    );
  }
  if (typeof callback !== 'function') {
    throw new TypeError(
      'The first argument to setImmediate must be a function.',
    );
  }

  const id = GUIID++;
  // This is an edgey case in which the sequentially assigned ID has been
  // "guessed" and "cleared" ahead of time, so we need to clear it up first.
  if (clearedImmediates.has(id)) {
    clearedImmediates.delete(id);
  }

  // $FlowFixMe[incompatible-type]
  global.queueMicrotask(() => {
    if (!clearedImmediates.has(id)) {
      callback.apply(undefined, args);
    } else {
      // Free up the Set entry.
      clearedImmediates.delete(id);
    }
  });

  return id;
}

/**
 * @param {number} immediateID The ID of the immediate to be cleared.
 */
export function clearImmediate(immediateID: number) {
  clearedImmediates.add(immediateID);
}
