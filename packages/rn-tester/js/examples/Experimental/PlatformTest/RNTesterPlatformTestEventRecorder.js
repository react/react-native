/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ViewProps} from 'react-native';

import {useMemo} from 'react';

type EventRecorderOptions = Readonly<{
  mergeEventTypes: Array<string>,
  relevantEvents: Array<string>,
}>;

type EventRecord = {
  chronologicalOrder: number,
  sequentialOccurrences: number,
  nestedEvents: ?Array<EventRecord>,
  target: string,
  type: string,
  event: Object,
};

export default class RNTesterPlatformTestEventRecorder {
  allRecords: Array<EventRecord> = [];
  relevantEvents: Array<string> = [];
  rawOrder: number = 1;
  eventsInScope: Array<EventRecord> = []; // Tracks synchronous event dispatches
  recording: boolean = true;

  mergeTypesTruthMap: {[string]: boolean} = {};

  constructor(options: EventRecorderOptions) {
    if (options.mergeEventTypes && Array.isArray(options.mergeEventTypes)) {
      options.mergeEventTypes.forEach(eventType => {
        this.mergeTypesTruthMap[eventType] = true;
      });
    }
    if (options.relevantEvents && Array.isArray(options.relevantEvents)) {
      this.relevantEvents = options.relevantEvents;
    }
  }

  _createEventRecord(
    rawEvent: Object,
    target: string,
    type: string,
  ): EventRecord {
    return {
      chronologicalOrder: this.rawOrder++,
      sequentialOccurrences: 1,
      nestedEvents: undefined,
      target,
      type,
      event: rawEvent,
    };
  }

  _recordEvent(e: Object, targetName: string, eventType: string): ?EventRecord {
    const record = this._createEventRecord(e, targetName, eventType);
    let recordList = this.allRecords;
    // Adjust which sequential list to use depending on scope
    if (this.eventsInScope.length > 0) {
      let newRecordList =
        this.eventsInScope[this.eventsInScope.length - 1].nestedEvents;
      if (newRecordList == null) {
        newRecordList = this.eventsInScope[
          this.eventsInScope.length - 1
        ].nestedEvents = [];
      }
      recordList = newRecordList;
    }
    if (this.mergeTypesTruthMap[eventType] && recordList.length > 0) {
      const tail = recordList[recordList.length - 1];
      // Same type and target?
      if (tail.type === eventType && tail.target === targetName) {
        tail.sequentialOccurrences++;
        return;
      }
    }
    recordList.push(record);
    return record;
  }

  _generateRecordedEventHandlerWithCallback(
    targetName: string,
    callback?: (event: Object, eventType: string) => void,
  ): (Object, string) => void {
    return (e: Object, eventType: string) => {
      if (this.recording) {
        this._recordEvent(e, targetName, eventType);
        if (callback) {
          callback(e, eventType);
        }
      }
    };
  }

  createRecorderTestEventHandlers(
    targetNames: ReadonlyArray<string>,
    callback?: (event: Object, eventType: string, targetName: string) => void,
  ): Readonly<{[targetName: string]: ViewProps}> {
    const result: {[targetName: string]: ViewProps} = {};
    for (const targetName of targetNames) {
      const recordedEventHandler =
        this._generateRecordedEventHandlerWithCallback(
          targetName,
          (event, eventType) => callback?.(event, eventType, targetName),
        );
      // $FlowFixMe[incompatible-type]
      const eventListenerProps = this.relevantEvents.reduce(
        (acc: ViewProps, eventName) => {
          const eventPropName =
            'on' + eventName[0].toUpperCase() + eventName.slice(1);
          return {
            ...acc,
            [eventPropName]: (e => {
              recordedEventHandler(e, eventName);
            }) as $FlowFixMe,
          };
        },
        {},
      );
      result[targetName] = eventListenerProps;
    }
    return result;
  }

  getRecords(): Array<EventRecord> {
    return this.allRecords;
  }

  checkRecords(
    expected: Array<{
      type: string,
      target: string,
      optional?: boolean,
    }>,
  ): boolean {
    if (expected.length < this.allRecords.length) {
      return false;
    }
    let j = 0;
    for (let i = 0; i < expected.length; ++i) {
      if (j >= this.allRecords.length) {
        if (expected[i].optional === true) {
          continue;
        }
        return false;
      }
      if (
        expected[i].type === this.allRecords[j].type &&
        expected[i].target === this.allRecords[j].target
      ) {
        j++;
        continue;
      }
      if (expected[i].optional === true) {
        continue;
      }
      return false;
    }
    return true;
  }
}

export function useRecorderTestEventHandlers(
  eventRecorder: RNTesterPlatformTestEventRecorder,
  targetNames: ReadonlyArray<string>,
  callback?: (event: Object, eventType: string, targetName: string) => void,
): Readonly<{[targetName: string]: ViewProps}> {
  return useMemo(
    () => eventRecorder.createRecorderTestEventHandlers(targetNames, callback),
    [eventRecorder, targetNames, callback],
  );
}
