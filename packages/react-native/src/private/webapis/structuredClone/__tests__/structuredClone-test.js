/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import DOMException from '../../errors/DOMException';

// Snapshot the built-in prototypes before the first evaluation of the
// module under test. `structuredClone` is required (not imported) below so
// its top-level code runs after this snapshot, which is what lets the
// no-mutation regression test detect writes to the built-in prototypes.
const PROTOTYPE_SYMBOLS = {
  WeakMap: Object.getOwnPropertySymbols(WeakMap.prototype),
  WeakSet: Object.getOwnPropertySymbols(WeakSet.prototype),
  Promise: Object.getOwnPropertySymbols(Promise.prototype),
};

function expectDataCloneError(fn: () => unknown) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(DOMException);
    expect(error.name).toBe('DataCloneError');
    return;
  }

  throw new Error('Expected function to throw DataCloneError, but it did not');
}

describe('structuredClone', () => {
  it('does not add properties to built-in prototypes', () => {
    require('../structuredClone');

    expect(Object.getOwnPropertySymbols(WeakMap.prototype)).toEqual(
      PROTOTYPE_SYMBOLS.WeakMap,
    );
    expect(Object.getOwnPropertySymbols(WeakSet.prototype)).toEqual(
      PROTOTYPE_SYMBOLS.WeakSet,
    );
    expect(Object.getOwnPropertySymbols(Promise.prototype)).toEqual(
      PROTOTYPE_SYMBOLS.Promise,
    );
  });

  it('throws DataCloneError for non-serializable built-ins', () => {
    const {default: structuredClone} = require('../structuredClone');

    expectDataCloneError(() => structuredClone(new WeakMap()));
    expectDataCloneError(() => structuredClone(new WeakSet()));
    expectDataCloneError(() => structuredClone(new Promise(() => {})));
  });
});
