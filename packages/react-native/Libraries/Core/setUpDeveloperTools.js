/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Platform from '../Utilities/Platform';

declare var console: {[string]: $FlowFixMe};

/**
 * Sets up developer tools for React Native.
 * You can use this module directly, or just require InitializeCore.
 */
if (__DEV__) {
  if (!Platform.isTesting) {
    const HMRClient = require('../Utilities/HMRClient').default;

    // TODO(T214991636): Remove legacy Metro log forwarding
    if (console._isPolyfilled) {
      // We assume full control over the console and send JavaScript logs to Metro.
      (
        [
          'trace',
          'info',
          'warn',
          'error',
          'log',
          'group',
          'groupCollapsed',
          'groupEnd',
          'debug',
        ] as const
      ).forEach(level => {
        const originalFunction = console[level];
        console[level] = function (...args: ReadonlyArray<unknown>) {
          HMRClient.log(level, args);
          originalFunction.apply(console, args);
        };
      });
    }
  }

  require('./setUpReactRefresh');

  global[`${global.__METRO_GLOBAL_PREFIX__ ?? ''}__loadBundleAsync`] =
    require('./Devtools/loadBundleFromServer').default;
}
