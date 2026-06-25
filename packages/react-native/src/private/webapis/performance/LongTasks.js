/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// flowlint unsafe-getters-setters:off
import type {
  PerformanceEntryInit,
  PerformanceEntryJSON,
} from './PerformanceEntry';

import {PerformanceEntry} from './PerformanceEntry';

export type PerformanceLongTaskTimingJSON = {
  ...PerformanceEntryJSON,
  attribution: ReadonlyArray<TaskAttributionTiming>,
  ...
};

export class TaskAttributionTiming extends PerformanceEntry {}

export const TaskAttributionTiming_public: typeof TaskAttributionTiming =
  /* eslint-disable no-shadow */
  // $FlowExpectedError[incompatible-type]
  function TaskAttributionTiming() {
    throw new TypeError(
      "Failed to construct 'TaskAttributionTiming': Illegal constructor",
    );
  };

// $FlowExpectedError[prop-missing]
TaskAttributionTiming_public.prototype = TaskAttributionTiming.prototype;

const EMPTY_ATTRIBUTION: ReadonlyArray<TaskAttributionTiming> =
  Object.preventExtensions([]);

export interface PerformanceLongTaskTimingInit extends PerformanceEntryInit {}

export class PerformanceLongTaskTiming extends PerformanceEntry {
  constructor(init: PerformanceEntryInit) {
    super('longtask', init);
  }

  get attribution(): ReadonlyArray<TaskAttributionTiming> {
    return EMPTY_ATTRIBUTION;
  }

  toJSON(): PerformanceLongTaskTimingJSON {
    return {
      ...super.toJSON(),
      attribution: this.attribution,
    };
  }
}

export const PerformanceLongTaskTiming_public: typeof PerformanceLongTaskTiming =
  /* eslint-disable no-shadow */
  // $FlowExpectedError[incompatible-type]
  function PerformanceLongTaskTiming() {
    throw new TypeError(
      "Failed to construct 'PerformanceLongTaskTiming': Illegal constructor",
    );
  };

// $FlowExpectedError[prop-missing]
PerformanceLongTaskTiming_public.prototype =
  PerformanceLongTaskTiming.prototype;
