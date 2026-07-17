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

export default function setUpPerformanceModern() {
  if (initialized) {
    return;
  }

  initialized = true;

  const Performance = require('../webapis/performance/Performance').default;

  // We don't use `polyfillGlobal` to define this lazily because the
  // `performance` object is always accessed.
  // $FlowExpectedError[cannot-write]
  global.performance = new Performance();

  polyfillGlobal(
    'EventCounts',
    () => require('../webapis/performance/EventTiming').EventCounts_public,
  );

  polyfillGlobal(
    'Performance',
    () => require('../webapis/performance/Performance').Performance_public,
  );

  polyfillGlobal(
    'PerformanceEntry',
    () =>
      require('../webapis/performance/PerformanceEntry')
        .PerformanceEntry_public,
  );

  polyfillGlobal(
    'PerformanceEventTiming',
    () =>
      require('../webapis/performance/EventTiming')
        .PerformanceEventTiming_public,
  );

  polyfillGlobal(
    'PerformanceLongTaskTiming',
    () =>
      require('../webapis/performance/LongTasks')
        .PerformanceLongTaskTiming_public,
  );

  polyfillGlobal(
    'PerformanceMark',
    () => require('../webapis/performance/UserTiming').PerformanceMark,
  );

  polyfillGlobal(
    'PerformanceMeasure',
    () =>
      require('../webapis/performance/UserTiming').PerformanceMeasure_public,
  );

  polyfillGlobal(
    'PerformanceObserver',
    () =>
      require('../webapis/performance/PerformanceObserver').PerformanceObserver,
  );

  polyfillGlobal(
    'PerformanceObserverEntryList',
    () =>
      require('../webapis/performance/PerformanceObserver')
        .PerformanceObserverEntryList_public,
  );

  polyfillGlobal(
    'PerformanceResourceTiming',
    () =>
      require('../webapis/performance/ResourceTiming')
        .PerformanceResourceTiming_public,
  );

  polyfillGlobal(
    'TaskAttributionTiming',
    () =>
      require('../webapis/performance/LongTasks').TaskAttributionTiming_public,
  );
}
