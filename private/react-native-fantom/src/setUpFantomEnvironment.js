/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import setUpAssetSourceResolver from './setUpAssetSourceResolver';
import setUpDefaultFonts from './setUpDefaultFonts';

let initialized = false;

export default function setUpFantomEnvironment(): void {
  if (initialized) {
    return;
  }

  setUpAssetSourceResolver();
  setUpDefaultFonts();
  initialized = true;
}
