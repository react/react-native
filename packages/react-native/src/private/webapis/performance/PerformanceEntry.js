/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import {setPlatformObject} from '../webidl/PlatformObjects';

export type DOMHighResTimeStamp = number;
export type PerformanceEntryType =
  'mark' | 'measure' | 'event' | 'longtask' | 'resource';

export type PerformanceEntryJSON = {
  name: string,
  entryType: PerformanceEntryType,
  startTime: DOMHighResTimeStamp,
  duration: DOMHighResTimeStamp,
  ...
};

export interface PerformanceEntryInit {
  readonly name: string;
  readonly startTime: DOMHighResTimeStamp;
  readonly duration: DOMHighResTimeStamp;
}

export class PerformanceEntry {
  // We don't use private fields because they're significantly slower to
  // initialize on construction and to access.
  // We also need these to be protected so they can be initialized in subclasses
  // where we avoid calling `super()` for performance reasons.
  __entryType: PerformanceEntryType;
  __name: string;
  __startTime: DOMHighResTimeStamp;
  __duration: DOMHighResTimeStamp;

  constructor(entryType: PerformanceEntryType, init: PerformanceEntryInit) {
    this.__entryType = entryType;
    this.__name = init.name;
    this.__startTime = init.startTime;
    this.__duration = init.duration;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get name(): string {
    return this.__name;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get entryType(): PerformanceEntryType {
    return this.__entryType;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get startTime(): DOMHighResTimeStamp {
    return this.__startTime;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get duration(): DOMHighResTimeStamp {
    return this.__duration;
  }

  toJSON(): PerformanceEntryJSON {
    return {
      name: this.__name,
      entryType: this.__entryType,
      startTime: this.__startTime,
      duration: this.__duration,
    };
  }
}

export const PerformanceEntry_public: typeof PerformanceEntry =
  /* eslint-disable no-shadow */
  // $FlowExpectedError[incompatible-type]
  function PerformanceEntry() {
    throw new TypeError(
      "Failed to construct 'PerformanceEntry': Illegal constructor",
    );
  };

PerformanceEntry_public.prototype = PerformanceEntry.prototype;

setPlatformObject(PerformanceEntry);

export type PerformanceEntryList = ReadonlyArray<PerformanceEntry>;
