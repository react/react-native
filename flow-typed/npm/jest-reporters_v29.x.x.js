/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

declare module '@jest/reporters' {
  declare export class DefaultReporter<
    TTestResult = unknown,
    TAggregatedResult = unknown,
  > {
    constructor(globalConfig: unknown): void;
    onRunStart(aggregatedResults: unknown, options: unknown): void;
    onTestResult(
      test: unknown,
      result: TTestResult,
      aggregatedResults: TAggregatedResult,
    ): void | Promise<void>;
    onRunComplete(
      testContexts: unknown,
      aggregatedResults: TAggregatedResult,
    ): void;
  }
  declare export class VerboseReporter<
    TTestResult = unknown,
    TAggregatedResult = unknown,
  > extends DefaultReporter<TTestResult, TAggregatedResult> {}
  declare export class SummaryReporter<TAggregatedResult = unknown> {
    constructor(globalConfig: unknown): void;
    onRunStart(aggregatedResults: unknown, options: unknown): void;
    onRunComplete(
      testContexts: unknown,
      aggregatedResults: TAggregatedResult,
    ): void;
  }
}
