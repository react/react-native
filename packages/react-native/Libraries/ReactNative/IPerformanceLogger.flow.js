/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

export type ExtraValue = number | string | boolean;
export type Extras = {[key: string]: ExtraValue};
export type Timespan = {
  startTime: number,
  endTime?: number,
  totalTime?: number,
  startExtras?: Extras,
  endExtras?: Extras,
};

/**
 * @deprecated The scoped performance logger argument passed to the
 * `componentProviderInstrumentationHook` is no longer used by `react-native`
 * itself and will be removed in a future release. The instance supplied today
 * is a no-op stub.
 */
export interface IPerformanceLogger {
  addTimespan(
    key: string,
    startTime: number,
    endTime: number,
    startExtras?: Extras,
    endExtras?: Extras,
  ): void;
  append(logger: IPerformanceLogger): void;
  clear(): void;
  clearCompleted(): void;
  close(): void;
  currentTimestamp(): number;
  getExtras(): Readonly<{[key: string]: ?ExtraValue}>;
  getPoints(): Readonly<{[key: string]: ?number}>;
  getPointExtras(): Readonly<{[key: string]: ?Extras}>;
  getTimespans(): Readonly<{[key: string]: ?Timespan}>;
  hasTimespan(key: string): boolean;
  isClosed(): boolean;
  logEverything(): void;
  markPoint(key: string, timestamp?: number, extras?: Extras): void;
  removeExtra(key: string): ?ExtraValue;
  setExtra(key: string, value: ExtraValue): void;
  startTimespan(key: string, timestamp?: number, extras?: Extras): void;
  stopTimespan(key: string, timestamp?: number, extras?: Extras): void;
}
