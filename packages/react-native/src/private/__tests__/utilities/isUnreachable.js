/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as Fantom from '@react-native/fantom';

export default function isUnreachable<T extends interface {}>(
  weakRef: WeakRef<T>,
): boolean {
  let unreachable = true;

  Fantom.runTask(() => {
    global.gc();
  });

  Fantom.runTask(() => {
    unreachable = weakRef.deref() === undefined;
  });

  return unreachable;
}
