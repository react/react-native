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

export default function setUpIntersectionObserver() {
  if (initialized) {
    return;
  }

  initialized = true;

  polyfillGlobal(
    'IntersectionObserver',
    () =>
      require('../webapis/intersectionobserver/IntersectionObserver').default,
  );

  polyfillGlobal(
    'IntersectionObserverEntry',
    () =>
      require('../webapis/intersectionobserver/IntersectionObserverEntry')
        .IntersectionObserverEntry_public,
  );
}
