/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {ExtendedError} from '../../../Libraries/Core/ExtendedError';

import toError from './toError';

/**
 * Converts an unknown value to an ExtendedError instance suitable for LogBox.
 * Uses the standard toError utility internally and then casts to ExtendedError.
 *
 * This is specifically designed for LogBox error reporting which requires
 * ExtendedError type compatibility.
 *
 * @param value - The unknown value to convert to an ExtendedError
 * @returns An ExtendedError instance
 */
export default function toExtendedError(value: unknown): ExtendedError {
  const error = toError(value);
  // ExtendedError extends Error, so this cast is safe for the LogBox system
  // $FlowFixMe[incompatible-type] ExtendedError extends Error, this cast is safe
  return error as ExtendedError;
}
