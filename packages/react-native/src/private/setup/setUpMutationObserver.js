/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {polyfillGlobal} from '../../../Libraries/Utilities/PolyfillFunctions';

let initialized = false;

export default function setUpMutationObserver() {
  if (initialized) {
    return;
  }

  initialized = true;

  polyfillGlobal(
    'MutationObserver',
    () => require('../webapis/mutationobserver/MutationObserver').default,
  );

  polyfillGlobal(
    'MutationRecord',
    () =>
      require('../webapis/mutationobserver/MutationRecord')
        .MutationRecord_public,
  );
}
