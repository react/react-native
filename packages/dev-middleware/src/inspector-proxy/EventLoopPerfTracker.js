/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// $FlowFixMe[cannot-resolve-module] libdef missing in RN OSS
import type {DebuggerSessionIDs} from '../types/EventReporter';

import {monitorEventLoopDelay, performance} from 'node:perf_hooks';
import {setTimeout} from 'node:timers';

export type EventLoopPerfTrackerArgs = {
  perfMeasurementDuration: number,
  minDelayPercentToReport: number,
  onHighDelay: (args: OnHighDelayArgs) => void,
};

export type OnHighDelayArgs = {
  eventLoopUtilization: number,
  maxEventLoopDelayPercent: number,
  duration: number,
  debuggerSessionIDs: DebuggerSessionIDs,
  connectionUptime: number,
};

export default class EventLoopPerfTracker {
  #perfMeasurementDuration: number;
  #minDelayPercentToReport: number;
  #onHighDelay: (args: OnHighDelayArgs) => void;

  #eventLoopPerfMeasurementOngoing: boolean;

  constructor(args: EventLoopPerfTrackerArgs) {
    this.#perfMeasurementDuration = args.perfMeasurementDuration;
    this.#minDelayPercentToReport = args.minDelayPercentToReport;
    this.#onHighDelay = args.onHighDelay;
    this.#eventLoopPerfMeasurementOngoing = false;
  }

  trackPerfThrottled(
    debuggerSessionIDs: DebuggerSessionIDs,
    connectionUptime: number,
  ): void {
    if (this.#eventLoopPerfMeasurementOngoing) {
      return;
    }

    this.#eventLoopPerfMeasurementOngoing = true;

    // https://nodejs.org/api/perf_hooks.html#performanceeventlooputilizationutilization1-utilization2
    const eluStart = performance.eventLoopUtilization();

    // https://nodejs.org/api/perf_hooks.html#perf_hooksmonitoreventloopdelayoptions
    const h = monitorEventLoopDelay({resolution: 20});
    h.enable();

    setTimeout(() => {
      const eluEnd = performance.eventLoopUtilization(eluStart);
      h.disable();

      // The % of time, between eluStart and eluEnd where event loop was busy
      const eventLoopUtilization = Math.floor(eluEnd.utilization * 100);

      // The max % of continious time between eluStart and eluEnd where event loop was busy
      const maxEventLoopDelayPercent = Math.floor(
        (h.max / 1e6 / this.#perfMeasurementDuration) * 100,
      );

      if (maxEventLoopDelayPercent >= this.#minDelayPercentToReport) {
        this.#onHighDelay({
          eventLoopUtilization,
          maxEventLoopDelayPercent,
          duration: this.#perfMeasurementDuration,
          debuggerSessionIDs,
          connectionUptime,
        });
      }

      this.#eventLoopPerfMeasurementOngoing = false;
    }, this.#perfMeasurementDuration).unref();
  }
}
