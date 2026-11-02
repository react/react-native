/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

declare module 'invariant' {
  declare module.exports: (
    condition: unknown,
    format?: string,
    ...args: Array<unknown>
  ) => asserts condition;
}

declare module 'invariant/invariant' {
  import typeof Invariant from 'invariant';

  declare module.exports: Invariant;
}
