/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

if (__DEV__) {
  const DevSettings = require('../Utilities/DevSettings').default;

  if (typeof DevSettings.reload !== 'function') {
    throw new Error('Could not find the reload() implementation.');
  }

  // This needs to run before the renderer initializes.
  // $FlowFixMe[untyped-import]
  const ReactRefreshRuntime = require('react-refresh/runtime');
  ReactRefreshRuntime.injectIntoGlobalHook(global);

  const Refresh = {
    performFullRefresh(reason: string) {
      DevSettings.reload(reason);
    },

    createSignatureFunctionForTransform:
      ReactRefreshRuntime.createSignatureFunctionForTransform,

    isLikelyComponentType: ReactRefreshRuntime.isLikelyComponentType,

    getFamilyByType: ReactRefreshRuntime.getFamilyByType,

    register: ReactRefreshRuntime.register,

    performReactRefresh() {
      ReactRefreshRuntime.performReactRefresh();
      DevSettings.onFastRefresh();
    },
  };

  // The metro require polyfill can not have dependencies (applies for all polyfills).
  // Expose `Refresh` by assigning it to global to make it available in the polyfill.
  global[(global.__METRO_GLOBAL_PREFIX__ || '') + '__ReactRefresh'] = Refresh;
}
