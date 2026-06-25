/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {IPerformanceLogger} from './IPerformanceLogger.flow';

let didWarn: boolean = false;
function warnDeprecated(): void {
  if (didWarn) {
    return;
  }
  didWarn = true;
  console.warn(
    'The default `IPerformanceLogger` provided by `react-native` (the ' +
      "`'GlobalPerformanceLogger'` callable native module and the " +
      '`scopedPerformanceLogger` argument passed to the hook registered with ' +
      '`AppRegistry.setComponentProviderInstrumentationHook`) is deprecated and ' +
      'will be removed in a future release. The instance supplied today is a ' +
      'no-op stub. Embedders that need a per-app performance logger should ' +
      'attach their own implementation.',
  );
}

/**
 * @deprecated The `react-native` package no longer ships a real
 * `IPerformanceLogger`. This stub is exposed to keep existing extension points
 * (the `'GlobalPerformanceLogger'` callable native module and the second
 * argument of `AppRegistry.setComponentProviderInstrumentationHook`'s hook)
 * source-compatible for embedders. Every method is a no-op that emits a
 * one-time deprecation warning on first use.
 */
const DeprecatedPerformanceLoggerStub: IPerformanceLogger = {
  addTimespan: () => warnDeprecated(),
  append: () => warnDeprecated(),
  clear: () => warnDeprecated(),
  clearCompleted: () => warnDeprecated(),
  close: () => warnDeprecated(),
  currentTimestamp: () => {
    warnDeprecated();
    return 0;
  },
  getExtras: () => {
    warnDeprecated();
    return {};
  },
  getPoints: () => {
    warnDeprecated();
    return {};
  },
  getPointExtras: () => {
    warnDeprecated();
    return {};
  },
  getTimespans: () => {
    warnDeprecated();
    return {};
  },
  hasTimespan: () => {
    warnDeprecated();
    return false;
  },
  isClosed: () => {
    warnDeprecated();
    return false;
  },
  logEverything: () => warnDeprecated(),
  markPoint: () => warnDeprecated(),
  removeExtra: () => {
    warnDeprecated();
    return undefined;
  },
  setExtra: () => warnDeprecated(),
  startTimespan: () => warnDeprecated(),
  stopTimespan: () => warnDeprecated(),
};

export default DeprecatedPerformanceLoggerStub;
