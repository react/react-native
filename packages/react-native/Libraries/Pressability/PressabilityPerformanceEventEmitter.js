/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {type PressabilityTouchSignal as TouchSignal} from './PressabilityTypes.js';

export type PressabilityPerformanceEvent = Readonly<{
  signal: TouchSignal,
  nativeTimestamp: number,
}>;
export type PressabilityPerformanceEventListener =
  PressabilityPerformanceEvent => void;

class PressabilityPerformanceEventEmitter {
  _listeners: Array<PressabilityPerformanceEventListener> = [];

  constructor() {}

  addListener(listener: PressabilityPerformanceEventListener): void {
    this._listeners.push(listener);
  }

  removeListener(listener: PressabilityPerformanceEventListener): void {
    const index = this._listeners.indexOf(listener);
    if (index > -1) {
      this._listeners.splice(index, 1);
    }
  }

  emitEvent(constructEvent: () => PressabilityPerformanceEvent): void {
    if (this._listeners.length === 0) {
      return;
    }

    const event = constructEvent();
    this._listeners.forEach(listener => listener(event));
  }
}

const PressabilityPerformanceEventEmitterSingleton: PressabilityPerformanceEventEmitter =
  new PressabilityPerformanceEventEmitter();

export default PressabilityPerformanceEventEmitterSingleton;
