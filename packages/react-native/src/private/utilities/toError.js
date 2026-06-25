/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/**
 * Converts an unknown value to an Error instance.
 * If the value is already an Error, returns it as-is.
 * Otherwise, creates a new Error with the stringified value as the message.
 *
 * This is particularly useful in catch blocks where the caught value
 * is annotated as `unknown` but needs to be treated as an Error.
 *
 * @param value - The unknown value to convert to an Error
 * @returns An Error instance
 */
export default function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  return new Error(String(value));
}
