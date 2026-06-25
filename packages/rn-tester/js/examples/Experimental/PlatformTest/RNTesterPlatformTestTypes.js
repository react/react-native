/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

type BasePlatformTestAssertionResult = Readonly<{
  name: string,
  description: string,
}>;

export type PassingPlatformTestAssertionResult = Readonly<{
  ...BasePlatformTestAssertionResult,
  passing: true,
}>;

export type FailingPlatformTestAssertionResult = Readonly<{
  ...BasePlatformTestAssertionResult,
  passing: false,
  failureMessage: string,
}>;

export type PlatformTestAssertionResult =
  | PassingPlatformTestAssertionResult
  | FailingPlatformTestAssertionResult;

export type PlatformTestResultStatus = 'PASS' | 'FAIL' | 'ERROR' | 'SKIPPED';

export type PlatformTestResult = Readonly<{
  name: string,
  status: PlatformTestResultStatus,
  assertions: ReadonlyArray<PlatformTestAssertionResult>,
  error: unknown | null, // null is technically unnecessary but is kept to ensure the error is described as nullable
}>;

export type PlatformTestContext = Readonly<{
  assert_true(a: boolean, description: string): void,
  assert_equals(a: any, b: any, description: string): void,
  assert_not_equals(a: any, b: any, description: string): void,
  assert_greater_than_equal(a: number, b: number, description: string): void,
  assert_less_than_equal(a: number, b: number, description: string): void,
}>;

export type PlatformTestCase = (context: PlatformTestContext) => void;

export type AsyncPlatformTest = Readonly<{
  done(): void,
  step(testcase: PlatformTestCase): void,
}>;

export type SyncTestOptions = Readonly<{
  skip?: boolean,
}>;

export type PlatformTestHarness = Readonly<{
  test(
    testcase: PlatformTestCase,
    name: string,
    options?: SyncTestOptions,
  ): void,
  useAsyncTest(description: string, timeout?: number): AsyncPlatformTest,
}>;

export type PlatformTestComponentBaseProps = {
  readonly harness: PlatformTestHarness,
  ...
};
