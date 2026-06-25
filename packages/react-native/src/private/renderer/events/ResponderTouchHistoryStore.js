/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/**
 * Tracks the position and time of each active touch by `touch.identifier`. We
 * should typically only see IDs in the range of 1-20 because IDs get recycled
 * when touches end and start again.
 */
type TouchRecord = {
  touchActive: boolean,
  startPageX: number,
  startPageY: number,
  startTimeStamp: number,
  currentPageX: number,
  currentPageY: number,
  currentTimeStamp: number,
  previousPageX: number,
  previousPageY: number,
  previousTimeStamp: number,
};

type Touch = {
  identifier: ?number,
  pageX: number,
  pageY: number,
  timestamp: number,
  ...
};

export type TouchEvent = {
  changedTouches: Array<Touch>,
  touches: Array<Touch>,
  ...
};

function isStartish(topLevelType: string): boolean {
  return topLevelType === 'topTouchStart';
}

function isMoveish(topLevelType: string): boolean {
  return topLevelType === 'topTouchMove';
}

function isEndish(topLevelType: string): boolean {
  return topLevelType === 'topTouchEnd' || topLevelType === 'topTouchCancel';
}

export type TouchHistory = {
  touchBank: Array<TouchRecord>,
  numberActiveTouches: number,
  indexOfSingleActiveTouch: number,
  mostRecentTimeStamp: number,
};

const MAX_TOUCH_BANK = 20;
const touchBank: Array<TouchRecord> = [];
const touchHistory: TouchHistory = {
  touchBank,
  numberActiveTouches: 0,
  // If there is only one active touch, we remember its location. This prevents
  // us having to loop through all of the touches all the time in the most
  // common case.
  indexOfSingleActiveTouch: -1,
  mostRecentTimeStamp: 0,
};

function timestampForTouch(touch: Touch): number {
  // The legacy internal implementation provides "timeStamp", which has been
  // renamed to "timestamp". Let both work for now while we iron it out
  return (touch as $FlowFixMe).timeStamp || touch.timestamp;
}

function createTouchRecord(touch: Touch, timestamp: number): TouchRecord {
  return {
    touchActive: true,
    startPageX: touch.pageX,
    startPageY: touch.pageY,
    startTimeStamp: timestamp,
    currentPageX: touch.pageX,
    currentPageY: touch.pageY,
    currentTimeStamp: timestamp,
    previousPageX: touch.pageX,
    previousPageY: touch.pageY,
    previousTimeStamp: timestamp,
  };
}

function resetTouchRecord(
  touchRecord: TouchRecord,
  touch: Touch,
  timestamp: number,
): void {
  touchRecord.touchActive = true;
  touchRecord.startPageX = touch.pageX;
  touchRecord.startPageY = touch.pageY;
  touchRecord.startTimeStamp = timestamp;
  touchRecord.currentPageX = touch.pageX;
  touchRecord.currentPageY = touch.pageY;
  touchRecord.currentTimeStamp = timestamp;
  touchRecord.previousPageX = touch.pageX;
  touchRecord.previousPageY = touch.pageY;
  touchRecord.previousTimeStamp = timestamp;
}

function getTouchIdentifier({identifier}: Touch): number {
  if (identifier == null) {
    throw new Error('Touch object is missing identifier.');
  }

  if (__DEV__) {
    if (identifier > MAX_TOUCH_BANK) {
      console.error(
        'Touch identifier %s is greater than maximum supported %s which causes ' +
          'performance issues backfilling array locations for all of the indices.',
        identifier,
        MAX_TOUCH_BANK,
      );
    }
  }
  return identifier;
}

function recordTouchStart(touch: Touch): void {
  const identifier = getTouchIdentifier(touch);
  const timestamp = timestampForTouch(touch);
  const touchRecord = touchBank[identifier];
  if (touchRecord) {
    resetTouchRecord(touchRecord, touch, timestamp);
  } else {
    touchBank[identifier] = createTouchRecord(touch, timestamp);
  }
  touchHistory.mostRecentTimeStamp = timestamp;
}

function recordTouchMove(touch: Touch): void {
  const touchRecord = touchBank[getTouchIdentifier(touch)];
  if (touchRecord) {
    touchRecord.touchActive = true;
    touchRecord.previousPageX = touchRecord.currentPageX;
    touchRecord.previousPageY = touchRecord.currentPageY;
    touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
    touchRecord.currentPageX = touch.pageX;
    touchRecord.currentPageY = touch.pageY;
    const timestamp = timestampForTouch(touch);
    touchRecord.currentTimeStamp = timestamp;
    touchHistory.mostRecentTimeStamp = timestamp;
  } else {
    if (__DEV__) {
      console.warn(
        'Cannot record touch move without a touch start.\n' +
          'Touch Move: %s\n' +
          'Touch Bank: %s',
        printTouch(touch),
        printTouchBank(),
      );
    }
  }
}

function recordTouchEnd(touch: Touch): void {
  const touchRecord = touchBank[getTouchIdentifier(touch)];
  if (touchRecord) {
    touchRecord.touchActive = false;
    touchRecord.previousPageX = touchRecord.currentPageX;
    touchRecord.previousPageY = touchRecord.currentPageY;
    touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
    touchRecord.currentPageX = touch.pageX;
    touchRecord.currentPageY = touch.pageY;
    const timestamp = timestampForTouch(touch);
    touchRecord.currentTimeStamp = timestamp;
    touchHistory.mostRecentTimeStamp = timestamp;
  } else {
    if (__DEV__) {
      console.warn(
        'Cannot record touch end without a touch start.\n' +
          'Touch End: %s\n' +
          'Touch Bank: %s',
        printTouch(touch),
        printTouchBank(),
      );
    }
  }
}

function printTouch(touch: Touch): string {
  return JSON.stringify({
    identifier: touch.identifier,
    pageX: touch.pageX,
    pageY: touch.pageY,
    timestamp: timestampForTouch(touch),
  });
}

function printTouchBank(): string {
  let printed = JSON.stringify(touchBank.slice(0, MAX_TOUCH_BANK));
  if (touchBank.length > MAX_TOUCH_BANK) {
    printed += ' (original size: ' + touchBank.length + ')';
  }
  return printed;
}

let instrumentationCallback: ?(string, TouchEvent) => void;

const ResponderTouchHistoryStore = {
  /**
   * Registers a listener which can be used to instrument every touch event.
   */
  instrument(callback: (string, TouchEvent) => void): void {
    instrumentationCallback = callback;
  },

  recordTouchTrack(topLevelType: string, nativeEvent: TouchEvent): void {
    if (instrumentationCallback != null) {
      instrumentationCallback(topLevelType, nativeEvent);
    }

    if (nativeEvent.changedTouches == null) {
      console.error(
        'Touch event "%s" received with no changedTouches. This is likely ' +
          'a bug in the native touch handling system.',
        topLevelType,
      );
      return;
    }

    if (isMoveish(topLevelType)) {
      nativeEvent.changedTouches.forEach(recordTouchMove);
    } else if (isStartish(topLevelType)) {
      nativeEvent.changedTouches.forEach(recordTouchStart);
      touchHistory.numberActiveTouches = nativeEvent.touches?.length ?? 0;
      if (touchHistory.numberActiveTouches === 1) {
        touchHistory.indexOfSingleActiveTouch =
          // $FlowFixMe[incompatible-type] might be null according to type
          nativeEvent.touches[0].identifier;
      }
    } else if (isEndish(topLevelType)) {
      nativeEvent.changedTouches.forEach(recordTouchEnd);
      touchHistory.numberActiveTouches = nativeEvent.touches?.length ?? 0;
      if (touchHistory.numberActiveTouches === 1) {
        for (let i = 0; i < touchBank.length; i++) {
          const touchTrackToCheck = touchBank[i];
          if (touchTrackToCheck != null && touchTrackToCheck.touchActive) {
            touchHistory.indexOfSingleActiveTouch = i;
            break;
          }
        }
        if (__DEV__) {
          const activeRecord = touchBank[touchHistory.indexOfSingleActiveTouch];
          if (activeRecord == null || !activeRecord.touchActive) {
            console.error('Cannot find single active touch.');
          }
        }
      }
    }
  },

  touchHistory,
};

export default ResponderTouchHistoryStore;
