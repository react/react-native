/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../../Libraries/TurboModule/TurboModuleRegistry';

export type NativeMemoryInfo = {[key: string]: ?number};

export type ReactNativeStartupTiming = {[key: string]: ?number};

export type RawPerformanceEntryType = number;

export type RawPerformanceEntry = {
  name: string,
  entryType: RawPerformanceEntryType,
  startTime: number,
  duration: number,

  // For PerformanceEventTiming only
  processingStart?: number,
  processingEnd?: number,
  interactionId?: number,

  // For PerformanceResourceTiming only
  fetchStart?: number,
  requestStart?: number,
  connectStart?: number,
  connectEnd?: number,
  responseStart?: number,
  responseEnd?: number,
  responseStatus?: number,
  contentType?: string,
  encodedBodySize?: number,
  decodedBodySize?: number,
};

export opaque type OpaqueNativeObserverHandle = unknown;

export type NativeBatchedObserverCallback = () => void;
export type NativePerformanceMarkResult = number;
export type NativePerformanceMeasureResult = ReadonlyArray<number>; // [startTime, duration]

export type PerformanceObserverInit = {
  entryTypes?: ReadonlyArray<number>,
  type?: number,
  buffered?: boolean,
  durationThreshold?: number,
};

export interface Spec extends TurboModule {
  readonly now: () => number;
  readonly timeOrigin: () => number;

  readonly reportMark: (
    name: string,
    startTime: number,
    entry: unknown,
  ) => void;
  readonly reportMeasure: (
    name: string,
    startTime: number,
    duration: number,
    entry: unknown,
  ) => void;
  readonly getMarkTime: (name: string) => ?number;
  readonly clearMarks: (entryName?: string) => void;
  readonly clearMeasures: (entryName?: string) => void;
  readonly getEntries: () => ReadonlyArray<RawPerformanceEntry>;
  readonly getEntriesByName: (
    entryName: string,
    entryType?: ?RawPerformanceEntryType,
  ) => ReadonlyArray<RawPerformanceEntry>;
  readonly getEntriesByType: (
    entryType: RawPerformanceEntryType,
  ) => ReadonlyArray<RawPerformanceEntry>;
  readonly getEventCounts: () => ReadonlyArray<[string, number]>;
  readonly getSimpleMemoryInfo: () => NativeMemoryInfo;
  readonly getReactNativeStartupTiming: () => ReactNativeStartupTiming;

  readonly createObserver: (
    callback: NativeBatchedObserverCallback,
  ) => OpaqueNativeObserverHandle;
  readonly getDroppedEntriesCount: (
    observer: OpaqueNativeObserverHandle,
  ) => number;

  readonly observe: (
    observer: OpaqueNativeObserverHandle,
    options: PerformanceObserverInit,
  ) => void;
  readonly disconnect: (observer: OpaqueNativeObserverHandle) => void;
  readonly takeRecords: (
    observer: OpaqueNativeObserverHandle,
    sort: boolean,
  ) => ReadonlyArray<RawPerformanceEntry>;

  readonly getSupportedPerformanceEntryTypes: () => ReadonlyArray<RawPerformanceEntryType>;

  readonly clearEventCountsForTesting: () => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativePerformanceCxx',
) as Spec;
