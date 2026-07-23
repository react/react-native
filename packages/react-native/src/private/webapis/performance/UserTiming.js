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
  DOMHighResTimeStamp,
  PerformanceEntryInit,
} from './PerformanceEntry';
import type {
  ExtensionMarkerPayload,
  ExtensionTrackEntryPayload,
} from './UserTimingExtensibility';

import {PerformanceEntry} from './PerformanceEntry';
import NativePerformance from './specs/NativePerformance';

const {now} = NativePerformance;

export type DetailType =
  | unknown
  // This will effectively ignored by Flow (mixed | anything = mixed)
  // but we'll use it as documentation for how to use the extensibility API.
  | {devtools?: ExtensionMarkerPayload | ExtensionTrackEntryPayload, ...};

export interface PerformanceMarkOptions {
  readonly detail?: DetailType;
  readonly startTime?: DOMHighResTimeStamp;
}

export type TimeStampOrName = DOMHighResTimeStamp | string;

export interface PerformanceMeasureInit extends PerformanceEntryInit {
  readonly detail?: DetailType;
}

class PerformanceMarkTemplate extends PerformanceEntry {
  // We don't use private fields because they're significantly slower to
  // initialize on construction and to access.
  __detail: DetailType;

  // This constructor isn't really used. See `PerformanceMark` below.
  constructor(markName: string, markOptions?: PerformanceMarkOptions) {
    super('mark', {
      name: markName,
      startTime: markOptions?.startTime ?? now(),
      duration: 0,
    });

    this.__detail = markOptions?.detail ?? null;
  }

  get detail(): DetailType {
    return this.__detail;
  }
}

// This is the real value we're exporting where we define the class a function
// so we don't need to call `super()` and we can avoid the performance penalty
// of the current code transpiled with Babel.
// We should remove this when we have built-in support for classes in the
// runtime.
export const PerformanceMark: typeof PerformanceMarkTemplate =
  // $FlowExpectedError[incompatible-type]
  function PerformanceMark(
    this: PerformanceMarkTemplate,
    markName: string,
    markOptions?: PerformanceMarkOptions,
  ) {
    this.__entryType = 'mark';
    this.__name = markName;
    this.__startTime = markOptions?.startTime ?? now();
    this.__duration = 0;

    this.__detail = markOptions?.detail ?? null;
  };

// $FlowExpectedError[prop-missing]
PerformanceMark.prototype = PerformanceMarkTemplate.prototype;

class PerformanceMeasureTemplate extends PerformanceEntry {
  // We don't use private fields because they're significantly slower to
  // initialize on construction and to access.
  __detail: DetailType;

  // This constructor isn't really used. See `PerformanceMeasure` below.
  constructor(init: PerformanceMeasureInit) {
    super('measure', init);

    this.__detail = init?.detail ?? null;
  }

  get detail(): DetailType {
    return this.__detail;
  }
}

// We do the same here as we do for `PerformanceMark` for performance reasons.
export const PerformanceMeasure: typeof PerformanceMeasureTemplate =
  // $FlowExpectedError[incompatible-type]
  function PerformanceMeasure(
    this: PerformanceMeasureTemplate,
    init: PerformanceMeasureInit,
  ) {
    this.__entryType = 'measure';
    this.__name = init.name;
    this.__startTime = init.startTime;
    this.__duration = init.duration;

    this.__detail = init.detail ?? null;
  };

// $FlowExpectedError[prop-missing]
PerformanceMeasure.prototype = PerformanceMeasureTemplate.prototype;

export const PerformanceMeasure_public: typeof PerformanceMeasure =
  /* eslint-disable no-shadow */
  // $FlowExpectedError[incompatible-type]
  function PerformanceMeasure() {
    throw new TypeError(
      "Failed to construct 'PerformanceMeasure': Illegal constructor",
    );
  };

// $FlowExpectedError[prop-missing]
PerformanceMeasure_public.prototype = PerformanceMeasure.prototype;
