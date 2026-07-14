/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/**
 * Detects if a function is a native function (not a polyfill or user-defined).
 *
 * Checks if the function's toString representation includes `[native code]`.
 * Note: A polyfill can technically fake this, but most don't, making this
 * check reliable for practical purposes.
 *
 * @param {Function} f - Function to check
 * @returns {boolean} True if the function is a native function
 */
export function isNativeFunction(f: Function): boolean {
  return typeof f === 'function' && f.toString().indexOf('[native code]') > -1;
}

/**
 * Checks if an object's constructor is a native function with a specific name.
 *
 * @param {Object} o - Object to check
 * @param {string} expectedName - Expected constructor name
 * @returns {boolean} True if the constructor is native and matches the expected name
 */
export function hasNativeConstructor(o: Object, expectedName: string): boolean {
  const con = Object.getPrototypeOf(o).constructor;
  return con.name === expectedName && isNativeFunction(con);
}
