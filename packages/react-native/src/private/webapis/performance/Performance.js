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
  PerformanceEntryList,
  PerformanceEntryType,
} from './PerformanceEntry';
import type {
  DetailType,
  PerformanceMarkOptions,
  PerformanceMeasureInit,
} from './UserTiming';

import DOMException from '../errors/DOMException';
import structuredClone from '../structuredClone/structuredClone';
import {setPlatformObject} from '../webidl/PlatformObjects';
import {EventCounts} from './EventTiming';
import {
  performanceEntryTypeToRaw,
  rawToPerformanceEntry,
} from './internals/RawPerformanceEntry';
import {getCurrentTimeStamp} from './internals/Utilities';
import MemoryInfo from './MemoryInfo';
import ReactNativeStartupTiming from './ReactNativeStartupTiming';
import MaybeNativePerformance from './specs/NativePerformance';
import {PerformanceMark, PerformanceMeasure} from './UserTiming';
import nullthrows from 'nullthrows';

export type PerformanceMeasureOptions =
  | Readonly<{
      detail?: DetailType,
      start?: DOMHighResTimeStamp | string,
      duration?: DOMHighResTimeStamp,
    }>
  | Readonly<{
      detail?: DetailType,
      start?: DOMHighResTimeStamp | string,
      end?: DOMHighResTimeStamp | string,
    }>
  | Readonly<{
      detail?: DetailType,
      duration?: DOMHighResTimeStamp | string,
      end?: DOMHighResTimeStamp | string,
    }>;

const ENTRY_TYPES_AVAILABLE_FROM_TIMELINE: ReadonlyArray<PerformanceEntryType> =
  ['mark', 'measure'];

const NativePerformance = nullthrows(MaybeNativePerformance);

const cachedReportMark = NativePerformance.reportMark;
const cachedReportMeasure = NativePerformance.reportMeasure;
const cachedGetMarkTime = NativePerformance.getMarkTime;
const cachedNativeClearMarks = NativePerformance.clearMarks;
const cachedNativeClearMeasures = NativePerformance.clearMeasures;
let cachedTimeOrigin: ?DOMHighResTimeStamp;

const MARK_OPTIONS_REUSABLE_OBJECT: PerformanceMarkOptions = {
  startTime: 0,
  detail: undefined,
};

const MEASURE_OPTIONS_REUSABLE_OBJECT: PerformanceMeasureInit = {
  name: '',
  startTime: 0,
  duration: 0,
  detail: undefined,
};

const getMarkTimeForMeasure = (markName: string): number => {
  const markTime = cachedGetMarkTime(markName);
  if (markTime == null) {
    throw new DOMException(
      `Failed to execute 'measure' on 'Performance': The mark '${markName}' does not exist.`,
      'SyntaxError',
    );
  }
  return markTime;
};

/**
 * Partial implementation of the Performance interface for RN,
 * corresponding to the standard in
 * https://www.w3.org/TR/user-timing/#extensions-performance-interface
 */
export default class Performance {
  #eventCounts: EventCounts = new EventCounts();

  get eventCounts(): EventCounts {
    return this.#eventCounts;
  }

  // Get the current JS memory information.
  get memory(): MemoryInfo {
    // JSI API implementations may have different variants of names for the JS
    // heap information we need here. We will parse the result based on our
    // guess of the implementation for now.
    const memoryInfo = NativePerformance.getSimpleMemoryInfo();
    if (memoryInfo.hasOwnProperty('hermes_heapSize')) {
      // We got memory information from Hermes
      const {
        hermes_heapSize: totalJSHeapSize,
        hermes_allocatedBytes: usedJSHeapSize,
      } = memoryInfo;

      return new MemoryInfo({
        jsHeapSizeLimit: null, // We don't know the heap size limit from Hermes.
        totalJSHeapSize,
        usedJSHeapSize,
      });
    } else {
      // JSC and V8 has no native implementations for memory information in JSI::Instrumentation
      return new MemoryInfo();
    }
  }

  // Startup metrics is not used in web, but only in React Native.
  get rnStartupTiming(): ReactNativeStartupTiming {
    const {
      startTime,
      initializeRuntimeStart,
      executeJavaScriptBundleEntryPointStart,
      endTime,
    } = NativePerformance.getReactNativeStartupTiming();
    return new ReactNativeStartupTiming({
      startTime,
      initializeRuntimeStart,
      executeJavaScriptBundleEntryPointStart,
      endTime,
    });
  }

  /**
   * Returns the high resolution timestamp that is used as the baseline for
   * performance-related timestamps.
   * https://developer.mozilla.org/en-US/docs/Web/API/Performance/timeOrigin
   */
  get timeOrigin(): DOMHighResTimeStamp {
    if (cachedTimeOrigin == null) {
      if (NativePerformance.timeOrigin) {
        cachedTimeOrigin = NativePerformance?.timeOrigin();
      } else {
        // Very naive polyfill.
        cachedTimeOrigin = Date.now() - getCurrentTimeStamp();
      }
    }

    return cachedTimeOrigin;
  }

  mark(
    markName: string,
    markOptions?: PerformanceMarkOptions,
  ): PerformanceMark {
    // IMPORTANT: this method has been micro-optimized.
    // Please run the benchmarks in `Performance-benchmarks-itest` to ensure
    // changes do not regress performance.

    if (markName === undefined) {
      throw new TypeError(
        `Failed to execute 'mark' on 'Performance': 1 argument required, but only 0 present.`,
      );
    }

    const resolvedMarkName =
      typeof markName === 'string' ? markName : String(markName);

    let resolvedStartTime;
    let resolvedDetail;

    let startTime;
    let detail;
    if (markOptions != null) {
      ({startTime, detail} = markOptions);
    }

    if (startTime !== undefined) {
      resolvedStartTime =
        typeof startTime === 'number' ? startTime : Number(startTime);
      if (resolvedStartTime < 0) {
        throw new TypeError(
          `Failed to execute 'mark' on 'Performance': '${resolvedMarkName}' cannot have a negative start time.`,
        );
      } else if (
        // This is faster than calling Number.isFinite()
        // eslint-disable-next-line no-self-compare
        resolvedStartTime !== resolvedStartTime ||
        resolvedStartTime === Infinity
      ) {
        throw new TypeError(
          `Failed to execute 'mark' on 'Performance': Failed to read the 'startTime' property from 'PerformanceMarkOptions': The provided double value is non-finite.`,
        );
      }
    } else {
      resolvedStartTime = getCurrentTimeStamp();
    }

    if (detail !== undefined) {
      resolvedDetail = structuredClone(detail);
    }

    // $FlowExpectedError[cannot-write]
    MARK_OPTIONS_REUSABLE_OBJECT.startTime = resolvedStartTime;
    // $FlowExpectedError[cannot-write]
    MARK_OPTIONS_REUSABLE_OBJECT.detail = resolvedDetail;

    const entry = new PerformanceMark(
      resolvedMarkName,
      MARK_OPTIONS_REUSABLE_OBJECT,
    );

    cachedReportMark(resolvedMarkName, resolvedStartTime, entry);

    return entry;
  }

  clearMarks(markName?: string): void {
    cachedNativeClearMarks(markName);
  }

  measure(
    measureName: string,
    startMarkOrOptions?: string | PerformanceMeasureOptions,
    endMark?: string,
  ): PerformanceMeasure {
    // IMPORTANT: this method has been micro-optimized.
    // Please run the benchmarks in `Performance-benchmarks-itest` to ensure
    // changes do not regress performance.

    let resolvedMeasureName: string;
    let resolvedStartTime: number;
    let resolvedDuration: number;
    let resolvedDetail: unknown;

    if (measureName === undefined) {
      throw new TypeError(
        `Failed to execute 'measure' on 'Performance': 1 argument required, but only 0 present.`,
      );
    }

    resolvedMeasureName =
      typeof measureName === 'string' ? measureName : String(measureName);

    if (startMarkOrOptions != null) {
      switch (typeof startMarkOrOptions) {
        case 'object': {
          if (endMark !== undefined) {
            throw new TypeError(
              `Failed to execute 'measure' on 'Performance': If a non-empty PerformanceMeasureOptions object was passed, |end_mark| must not be passed.`,
            );
          }

          const {start, end, duration, detail} = startMarkOrOptions;

          let resolvedEndTime;

          if (
            start !== undefined &&
            end !== undefined &&
            duration !== undefined
          ) {
            throw new TypeError(
              `Failed to execute 'measure' on 'Performance': If a non-empty PerformanceMeasureOptions object was passed, it must not have all of its 'start', 'duration', and 'end' properties defined`,
            );
          }

          switch (typeof start) {
            case 'undefined': {
              // This will be handled after all options have been processed.
              break;
            }
            case 'number': {
              resolvedStartTime = start;
              break;
            }
            case 'string': {
              resolvedStartTime = getMarkTimeForMeasure(start);
              break;
            }
            default: {
              resolvedStartTime = getMarkTimeForMeasure(String(start));
            }
          }

          switch (typeof end) {
            case 'undefined': {
              // This will be handled after all options have been processed.
              break;
            }
            case 'number': {
              resolvedEndTime = end;
              break;
            }
            case 'string': {
              resolvedEndTime = getMarkTimeForMeasure(end);
              break;
            }
            default: {
              resolvedEndTime = getMarkTimeForMeasure(String(end));
            }
          }

          switch (typeof duration) {
            case 'undefined': {
              // This will be handled after all options have been processed.
              break;
            }
            case 'number': {
              resolvedDuration = duration;
              break;
            }
            default: {
              resolvedDuration = Number(duration);
              if (!Number.isFinite(resolvedDuration)) {
                throw new TypeError(
                  `Failed to execute 'measure' on 'Performance': Failed to read the 'duration' property from 'PerformanceMeasureOptions': The provided double value is non-finite.`,
                );
              }
            }
          }

          if (resolvedStartTime === undefined) {
            if (
              resolvedEndTime !== undefined &&
              resolvedDuration !== undefined
            ) {
              resolvedStartTime = resolvedEndTime - resolvedDuration;
            } else {
              resolvedStartTime = 0;
            }
          }

          if (resolvedDuration === undefined) {
            if (
              resolvedStartTime !== undefined &&
              resolvedEndTime !== undefined
            ) {
              resolvedDuration = resolvedEndTime - resolvedStartTime;
            } else {
              resolvedDuration = getCurrentTimeStamp() - resolvedStartTime;
            }
          }

          if (detail !== undefined) {
            resolvedDetail = structuredClone(detail);
          }

          break;
        }
        case 'string': {
          resolvedStartTime = getMarkTimeForMeasure(startMarkOrOptions);

          if (endMark !== undefined) {
            resolvedDuration =
              getMarkTimeForMeasure(endMark) - resolvedStartTime;
          } else {
            resolvedDuration = getCurrentTimeStamp() - resolvedStartTime;
          }
          break;
        }
        default: {
          resolvedStartTime = getMarkTimeForMeasure(String(startMarkOrOptions));

          if (endMark !== undefined) {
            resolvedDuration =
              getMarkTimeForMeasure(endMark) - resolvedStartTime;
          } else {
            resolvedDuration = getCurrentTimeStamp() - resolvedStartTime;
          }
        }
      }
    } else {
      resolvedStartTime = 0;

      if (endMark !== undefined) {
        resolvedDuration = getMarkTimeForMeasure(endMark) - resolvedStartTime;
      } else {
        resolvedDuration = getCurrentTimeStamp() - resolvedStartTime;
      }
    }

    // $FlowExpectedError[cannot-write]
    MEASURE_OPTIONS_REUSABLE_OBJECT.name = resolvedMeasureName;
    // $FlowExpectedError[cannot-write]
    MEASURE_OPTIONS_REUSABLE_OBJECT.startTime = resolvedStartTime;
    // $FlowExpectedError[cannot-write]
    MEASURE_OPTIONS_REUSABLE_OBJECT.duration = resolvedDuration;
    // $FlowExpectedError[cannot-write]
    MEASURE_OPTIONS_REUSABLE_OBJECT.detail = resolvedDetail;

    const entry = new PerformanceMeasure(MEASURE_OPTIONS_REUSABLE_OBJECT);

    cachedReportMeasure(
      resolvedMeasureName,
      resolvedStartTime,
      resolvedDuration,
      entry,
    );

    return entry;
  }

  clearMeasures(measureName?: string): void {
    cachedNativeClearMeasures(measureName);
  }

  /**
   * Returns a double, measured in milliseconds.
   * https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
   */
  now: () => DOMHighResTimeStamp = getCurrentTimeStamp;

  /**
   * An extension that allows to get back to JS all currently logged marks/measures
   * (in our case, be it from JS or native), see
   * https://www.w3.org/TR/performance-timeline/#extensions-to-the-performance-interface
   */
  getEntries(): PerformanceEntryList {
    return NativePerformance.getEntries().map(rawToPerformanceEntry);
  }

  getEntriesByType(entryType: PerformanceEntryType): PerformanceEntryList {
    if (
      entryType != null &&
      !ENTRY_TYPES_AVAILABLE_FROM_TIMELINE.includes(entryType)
    ) {
      console.warn('Deprecated API for given entry type.');
      return [];
    }

    return NativePerformance.getEntriesByType(
      performanceEntryTypeToRaw(entryType),
    ).map(rawToPerformanceEntry);
  }

  getEntriesByName(
    entryName: string,
    entryType?: PerformanceEntryType,
  ): PerformanceEntryList {
    if (
      entryType != null &&
      !ENTRY_TYPES_AVAILABLE_FROM_TIMELINE.includes(entryType)
    ) {
      console.warn('Deprecated API for given entry type.');
      return [];
    }

    return NativePerformance.getEntriesByName(
      entryName,
      entryType != null ? performanceEntryTypeToRaw(entryType) : undefined,
    ).map(rawToPerformanceEntry);
  }
}

export const Performance_public: typeof Performance =
  /* eslint-disable no-shadow */
  // $FlowExpectedError[incompatible-type]
  function Performance() {
    throw new TypeError(
      "Failed to construct 'Performance': Illegal constructor",
    );
  };

// $FlowExpectedError[prop-missing]
Performance_public.prototype = Performance.prototype;

setPlatformObject(Performance);
