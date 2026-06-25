/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

export default function ensureInstance<T>(value: unknown, Class: Class<T>): T {
  if (!(value instanceof Class)) {
    // $FlowFixMe[incompatible-use]
    const className = Class.name;
    throw new Error(
      `Expected instance of ${className} but got ${String(value)}`,
    );
  }

  return value;
}
