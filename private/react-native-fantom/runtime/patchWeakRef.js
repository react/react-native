/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

let initialized = false;

/**
 * This method modifies the built-in `WeakRef.prototype.deref` method to make
 * sure it is always called within the Event Loop in Fantom tests.
 *
 * Calling it outside the Event Loop can lead to inconsistent and confusing
 * behavior as WeakRefs semantics are tied to the task + microtasks lifecycle.
 */
export default function patchWeakRef(): void {
  if (initialized) {
    return;
  }

  initialized = true;

  // $FlowExpectedError[method-unbinding]
  const originalDeref = WeakRef.prototype.deref;

  // $FlowExpectedError[cannot-write]
  WeakRef.prototype.deref = function patchedDeref<T>(this: WeakRef<T>): T {
    // Lazily require the module to avoid loading it before the test logic.
    const Fantom = require('@react-native/fantom');

    if (!Fantom.isInWorkLoop()) {
      throw new Error(
        'Unexpected call to `WeakRef.deref()` outside of the Event Loop. Please use this method within `Fantom.runTask()`.',
      );
    }

    /* $FlowFixMe[invalid-this-arg] Error exposed after fixing this typing
     * unsoundness in flow */
    return originalDeref.call(this);
  };

  const OriginalWeakRef = WeakRef;

  global.WeakRef = function WeakRef(...args) {
    // Lazily require the module to avoid loading it before the test logic.
    const Fantom = require('@react-native/fantom');

    if (!Fantom.isInWorkLoop()) {
      throw new Error(
        'Unexpected instantiation of `WeakRef` outside of the Event Loop. Please create the instance within `Fantom.runTask()`.',
      );
    }

    return new OriginalWeakRef(...args);
  };
}
