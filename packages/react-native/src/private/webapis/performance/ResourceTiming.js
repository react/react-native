/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

// flowlint unsafe-getters-setters:off

import type {
  DOMHighResTimeStamp,
  PerformanceEntryJSON,
} from './PerformanceEntry';

import {PerformanceEntry} from './PerformanceEntry';

export type PerformanceResourceTimingJSON = {
  ...PerformanceEntryJSON,
  fetchStart: DOMHighResTimeStamp,
  requestStart: DOMHighResTimeStamp,
  connectStart: DOMHighResTimeStamp,
  connectEnd: DOMHighResTimeStamp,
  responseStart: DOMHighResTimeStamp,
  responseEnd: DOMHighResTimeStamp,
  responseStatus: number,
  contentType: string,
  encodedBodySize: number,
  decodedBodySize: number,
  ...
};

export interface PerformanceResourceTimingInit {
  readonly name: string;
  readonly startTime: DOMHighResTimeStamp;
  readonly duration: DOMHighResTimeStamp;
  readonly fetchStart: DOMHighResTimeStamp;
  readonly requestStart: DOMHighResTimeStamp;
  readonly connectStart: DOMHighResTimeStamp;
  readonly connectEnd: DOMHighResTimeStamp;
  readonly responseStart: DOMHighResTimeStamp;
  readonly responseEnd: DOMHighResTimeStamp;
  readonly responseStatus: number;
  readonly contentType: string;
  readonly encodedBodySize: number;
  readonly decodedBodySize: number;
}

export class PerformanceResourceTiming extends PerformanceEntry {
  #fetchStart: DOMHighResTimeStamp;
  #requestStart: DOMHighResTimeStamp;
  #connectStart: DOMHighResTimeStamp;
  #connectEnd: DOMHighResTimeStamp;
  #responseStart: DOMHighResTimeStamp;
  #responseEnd: DOMHighResTimeStamp;
  #responseStatus: number;
  #contentType: string;
  #encodedBodySize: number;
  #decodedBodySize: number;

  constructor(init: PerformanceResourceTimingInit) {
    super('resource', init);

    this.#fetchStart = init.fetchStart;
    this.#requestStart = init.requestStart;
    this.#connectStart = init.connectStart;
    this.#connectEnd = init.connectEnd;
    this.#responseStart = init.responseStart;
    this.#responseEnd = init.responseEnd;
    this.#responseStatus = init.responseStatus;
    this.#contentType = init.contentType;
    this.#encodedBodySize = init.encodedBodySize;
    this.#decodedBodySize = init.decodedBodySize;
  }

  get fetchStart(): DOMHighResTimeStamp {
    return this.#fetchStart;
  }

  get requestStart(): DOMHighResTimeStamp {
    return this.#requestStart;
  }

  get connectStart(): DOMHighResTimeStamp {
    return this.#connectStart;
  }

  get connectEnd(): DOMHighResTimeStamp {
    return this.#connectEnd;
  }

  get responseStart(): DOMHighResTimeStamp {
    return this.#responseStart;
  }

  get responseEnd(): DOMHighResTimeStamp {
    return this.#responseEnd;
  }

  get responseStatus(): number {
    return this.#responseStatus;
  }

  get contentType(): string {
    return this.#contentType;
  }

  get encodedBodySize(): number {
    return this.#encodedBodySize;
  }

  get decodedBodySize(): number {
    return this.#decodedBodySize;
  }

  toJSON(): PerformanceResourceTimingJSON {
    return {
      ...super.toJSON(),
      fetchStart: this.#fetchStart,
      requestStart: this.#requestStart,
      connectStart: this.#connectStart,
      connectEnd: this.#connectEnd,
      responseStart: this.#responseStart,
      responseEnd: this.#responseEnd,
      responseStatus: this.#responseStatus,
      contentType: this.contentType,
      encodedBodySize: this.encodedBodySize,
      decodedBodySize: this.decodedBodySize,
    };
  }
}

export const PerformanceResourceTiming_public: typeof PerformanceResourceTiming =
  /* eslint-disable no-shadow */
  // $FlowExpectedError[incompatible-type]
  function PerformanceResourceTiming() {
    throw new TypeError(
      "Failed to construct 'PerformanceResourceTiming': Illegal constructor",
    );
  };

// $FlowExpectedError[prop-missing]
PerformanceResourceTiming_public.prototype =
  PerformanceResourceTiming.prototype;
