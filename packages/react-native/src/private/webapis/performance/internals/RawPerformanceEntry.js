/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {PerformanceEntryType} from '../PerformanceEntry';
import type {
  RawPerformanceEntry,
  RawPerformanceEntryType,
} from '../specs/NativePerformance';

import {PerformanceEventTiming} from '../EventTiming';
import {PerformanceLongTaskTiming} from '../LongTasks';
import {PerformanceEntry} from '../PerformanceEntry';
import {PerformanceResourceTiming} from '../ResourceTiming';
import {PerformanceMark, PerformanceMeasure} from '../UserTiming';

export const RawPerformanceEntryTypeValues = {
  MARK: 1,
  MEASURE: 2,
  EVENT: 3,
  LONGTASK: 4,
  RESOURCE: 5,
};

export function rawToPerformanceEntry(
  entry: RawPerformanceEntry,
): PerformanceEntry {
  switch (entry.entryType) {
    case RawPerformanceEntryTypeValues.EVENT:
      return new PerformanceEventTiming({
        name: entry.name,
        startTime: entry.startTime,
        duration: entry.duration,
        processingStart: entry.processingStart,
        processingEnd: entry.processingEnd,
        interactionId: entry.interactionId,
      });
    case RawPerformanceEntryTypeValues.LONGTASK:
      return new PerformanceLongTaskTiming({
        name: entry.name,
        startTime: entry.startTime,
        duration: entry.duration,
      });
    case RawPerformanceEntryTypeValues.MARK:
      return new PerformanceMark(entry.name, {
        startTime: entry.startTime,
      });
    case RawPerformanceEntryTypeValues.MEASURE:
      return new PerformanceMeasure({
        name: entry.name,
        startTime: entry.startTime,
        duration: entry.duration,
      });
    case RawPerformanceEntryTypeValues.RESOURCE:
      return new PerformanceResourceTiming({
        name: entry.name,
        startTime: entry.startTime,
        duration: entry.duration,
        fetchStart: entry.fetchStart ?? 0,
        requestStart: entry.requestStart ?? 0,
        connectStart: entry.connectStart ?? 0,
        connectEnd: entry.connectEnd ?? 0,
        responseStart: entry.responseStart ?? 0,
        responseEnd: entry.responseEnd ?? 0,
        responseStatus: entry.responseStatus ?? 0,
        contentType: entry.contentType ?? '',
        encodedBodySize: entry.encodedBodySize ?? 0,
        decodedBodySize: entry.decodedBodySize ?? 0,
      });
    default:
      return new PerformanceEntry(rawToPerformanceEntryType(entry.entryType), {
        name: entry.name,
        startTime: entry.startTime,
        duration: entry.duration,
      });
  }
}

export function rawToPerformanceEntryType(
  type: RawPerformanceEntryType,
): PerformanceEntryType {
  switch (type) {
    case RawPerformanceEntryTypeValues.MARK:
      return 'mark';
    case RawPerformanceEntryTypeValues.MEASURE:
      return 'measure';
    case RawPerformanceEntryTypeValues.EVENT:
      return 'event';
    case RawPerformanceEntryTypeValues.LONGTASK:
      return 'longtask';
    case RawPerformanceEntryTypeValues.RESOURCE:
      return 'resource';
    default:
      throw new TypeError(
        `rawToPerformanceEntryType: unexpected performance entry type received: ${type}`,
      );
  }
}

export function performanceEntryTypeToRaw(
  type: PerformanceEntryType,
): RawPerformanceEntryType {
  switch (type) {
    case 'mark':
      return RawPerformanceEntryTypeValues.MARK;
    case 'measure':
      return RawPerformanceEntryTypeValues.MEASURE;
    case 'event':
      return RawPerformanceEntryTypeValues.EVENT;
    case 'longtask':
      return RawPerformanceEntryTypeValues.LONGTASK;
    case 'resource':
      return RawPerformanceEntryTypeValues.RESOURCE;
    default:
      // Verify exhaustive check with Flow
      (type) as empty;
      throw new TypeError(
        `performanceEntryTypeToRaw: unexpected performance entry type received: ${type}`,
      );
  }
}
