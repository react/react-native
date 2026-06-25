/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

/**
 * If your application is accepting different values for the same field over
 * time and is doing a diff on them, you can either (1) create a copy or
 * (2) ensure that those values are not mutated behind two passes.
 * This function helps you with (2) by freezing the object and throwing if
 * the user subsequently modifies the value.
 *
 * There are two caveats with this function:
 *   - If the call site is not in strict mode, it will only throw when
 *     mutating existing fields, adding a new one
 *     will unfortunately fail silently :(
 *   - If the object is already frozen or sealed, it will not continue the
 *     deep traversal and will leave leaf nodes unfrozen.
 *
 * Freezing the object and adding the throw mechanism is expensive and will
 * only be used in DEV.
 */
function deepFreezeAndThrowOnMutationInDev<T extends {...} | Array<unknown>>(
  object: T,
): T {
  if (__DEV__) {
    if (
      typeof object !== 'object' ||
      /* $FlowFixMe[invalid-compare] Error discovered during Constant Condition
       * roll out. See https://fburl.com/workplace/5whu3i34. */
      object === null ||
      Object.isFrozen(object) ||
      Object.isSealed(object)
    ) {
      return object;
    }

    // $FlowFixMe[not-an-object] `object` can be an array, but Object.keys works with arrays too
    const keys = Object.keys(object as {...} | Array<unknown>);
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    const hasOwnProperty = Object.prototype.hasOwnProperty;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (hasOwnProperty.call(object, key)) {
        Object.defineProperty(object, key, {
          get: identity.bind(null, object[key]),
        });
        Object.defineProperty(object, key, {
          set: throwOnImmutableMutation.bind(null, key),
        });
      }
    }

    Object.freeze(object);
    Object.seal(object);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (hasOwnProperty.call(object, key)) {
        deepFreezeAndThrowOnMutationInDev(object[key]);
      }
    }
  }
  return object;
}

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
function throwOnImmutableMutation(key: empty, value) {
  throw Error(
    'You attempted to set the key `' +
      key +
      '` with the value `' +
      JSON.stringify(value) +
      '` on an object that is meant to be immutable ' +
      'and has been frozen.',
  );
}

function identity(value: unknown) {
  return value;
}

export default deepFreezeAndThrowOnMutationInDev;
