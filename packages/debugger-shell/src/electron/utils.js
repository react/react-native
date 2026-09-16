/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/** Equivalent of Swift's `if #available(macOS 26, *)`. */
export function isMacOSAtLeast(major: number): boolean {
  return (
    process.platform === 'darwin' &&
    // $FlowFixMe[prop-missing]
    Number.parseInt(process.getSystemVersion().split('.')[0], 10) >= major
  );
}
