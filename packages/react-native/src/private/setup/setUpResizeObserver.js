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

export default function setUpResizeObserver() {
  if (initialized) {
    return;
  }

  initialized = true;

  polyfillGlobal(
    'ResizeObserver',
    () => require('../webapis/resizeobserver/ResizeObserver').default,
  );

  polyfillGlobal(
    'ResizeObserverEntry',
    () =>
      require('../webapis/resizeobserver/ResizeObserverEntry')
        .ResizeObserverEntry_public,
  );

  polyfillGlobal(
    'ResizeObserverSize',
    () =>
      require('../webapis/resizeobserver/ResizeObserverSize')
        .ResizeObserverSize_public,
  );
}
