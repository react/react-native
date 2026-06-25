/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {
  PlatformTestAssertionResult,
  PlatformTestCase,
  PlatformTestContext,
  PlatformTestHarness,
  PlatformTestResult,
  SyncTestOptions,
} from './RNTesterPlatformTestTypes';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

type AsyncTestStatus = 'NOT_RAN' | 'COMPLETED' | 'TIMED_OUT';

function didAllAssertionsPass(
  assertions: Array<PlatformTestAssertionResult>,
): boolean {
  const hasFailingAssertion = assertions.some(assertion => !assertion.passing);
  return !hasFailingAssertion;
}

function constructAsyncTestHook(
  addTestResult: (newResult: PlatformTestResult) => void,
  updateAsyncTestStatuses: (
    (
      Readonly<{[string]: AsyncTestStatus}>,
    ) => Readonly<{[string]: AsyncTestStatus}>,
  ) => void,
  runTestCase: (
    testCase: PlatformTestCase,
  ) => Array<PlatformTestAssertionResult>,
) {
  return (description: string, timeoutMs?: number = 10000) => {
    const assertionsRef = useRef<Array<PlatformTestAssertionResult>>([]);

    const timeoutIDRef = useRef<TimeoutID | null>(null);

    const timeoutHandler = useCallback(() => {
      timeoutIDRef.current = null;
      addTestResult({
        name: description,
        assertions: [
          ...assertionsRef.current,
          {
            passing: false,
            name: 'async_timeout',
            description: `async test should be completed in ${timeoutMs}ms`,
            failureMessage: `expected to complete async test in ${timeoutMs}ms`,
          },
        ],
        status: 'FAIL',
        error: null,
      });
      updateAsyncTestStatuses(prev => ({
        ...prev,
        [description]: 'TIMED_OUT',
      }));
    }, [description, timeoutMs]);

    // timeout management
    useEffect(() => {
      timeoutIDRef.current = setTimeout(timeoutHandler, timeoutMs);
      return () => {
        if (timeoutIDRef.current != null) {
          clearTimeout(timeoutIDRef.current);
        }
      };
    }, [timeoutHandler, timeoutMs]);

    const completionHandler = useCallback(() => {
      const timeoutID = timeoutIDRef.current;
      if (timeoutID != null) {
        clearTimeout(timeoutID);
        timeoutIDRef.current = null;
      }

      updateAsyncTestStatuses(prev => {
        if (prev[description] === 'NOT_RAN') {
          addTestResult({
            name: description,
            assertions: [
              ...assertionsRef.current,
              {
                passing: true,
                name: 'async_test',
                description: 'async test should be completed',
              },
            ],
            status: didAllAssertionsPass(assertionsRef.current)
              ? 'PASS'
              : 'FAIL',
            error: null,
          });
          return {...prev, [description]: 'COMPLETED'};
        }
        return prev;
      });
    }, [description]);

    const stepHandler = useCallback((testCase: PlatformTestCase) => {
      const stepAssertions = runTestCase(testCase);
      assertionsRef.current.push(...stepAssertions);
    }, []);

    // test registration
    useEffect(() => {
      updateAsyncTestStatuses(prev => {
        if (!prev.hasOwnProperty(description)) {
          return {...prev, [description]: 'NOT_RAN'};
        }
        return prev;
      });
    }, [description]);

    return useMemo(
      () => ({
        done: completionHandler,
        step: stepHandler,
      }),
      [completionHandler, stepHandler],
    );
  };
}

export type PlatformTestHarnessHookResult = Readonly<{
  testKey: number,
  harness: PlatformTestHarness,
  numPending: number,
  reset: () => void,
  results: ReadonlyArray<PlatformTestResult>,
}>;

export default function usePlatformTestHarness(): PlatformTestHarnessHookResult {
  const [testResults, updateTestResults] = useState<
    ReadonlyArray<PlatformTestResult>,
  >([]);

  // Since updating the test results array can get expensive at larger sizes
  // we use a basic debouncing logic to minimize the number of re-renders
  // caused by adding test results
  const resultQueueRef = useRef<Array<PlatformTestResult>>([]);
  const schedulerTimeoutIdRef = useRef<null | TimeoutID>(null);

  const commitResults = useCallback(() => {
    const queuedResults = resultQueueRef.current;
    if (queuedResults.length > 0) {
      updateTestResults(prev => [...prev, ...queuedResults]);
      resultQueueRef.current = [];
    }
  }, []);

  const scheduleResultsCommit = useCallback(() => {
    const schedulerTimeoutId = schedulerTimeoutIdRef.current;
    if (schedulerTimeoutId != null) {
      clearTimeout(schedulerTimeoutId);
    }
    schedulerTimeoutIdRef.current = setTimeout(() => commitResults(), 500);
  }, [commitResults]);

  const addTestResult = useCallback(
    (newResult: PlatformTestResult) => {
      resultQueueRef.current.push(newResult);
      scheduleResultsCommit();
    },
    [scheduleResultsCommit],
  );

  // When resetting the test results we should also re-mount the
  // so we apply a key to that component which we can increment
  // to ensure it re-mounts
  const [testElementKey, setTestElementKey] = useState<number>(0);

  const [asyncTestStatuses, updateAsyncTestStatuses] = useState<
    Readonly<{[string]: AsyncTestStatus}>,
  >({});

  const reset = useCallback(() => {
    updateTestResults([]);
    updateAsyncTestStatuses({});
    setTestElementKey(k => k + 1);
  }, []);

  const runTestCase = useCallback((testCase: PlatformTestCase) => {
    const assertionResults: Array<PlatformTestAssertionResult> = [];

    const baseAssert = (
      assertionName: string,
      testConditionResult: boolean,
      description: string,
      failureMessage: string,
    ) => {
      if (testConditionResult) {
        assertionResults.push({
          passing: true,
          name: assertionName,
          description,
        });
      } else {
        assertionResults.push({
          passing: false,
          name: assertionName,
          description,
          failureMessage,
        });
      }
    };

    const context: PlatformTestContext = {
      assert_true: (cond: boolean, desc: string) =>
        baseAssert(
          'assert_true',
          cond,
          desc,
          "expected 'true' but received 'false'",
        ),
      assert_equals: (a: any, b: any, desc: string) =>
        baseAssert(
          'assert_equal',
          a === b,
          desc,
          `expected ${a} to equal ${b}`,
        ),
      assert_not_equals: (a: any, b: any, desc: string) =>
        baseAssert(
          'assert_not_equals',
          a !== b,
          desc,
          `expected ${a} not to equal ${b}`,
        ),
      assert_greater_than_equal: (a: number, b: number, desc: string) =>
        baseAssert(
          'assert_greater_than_equal',
          a >= b,
          desc,
          `expected ${a} to be greater than or equal to ${b}`,
        ),
      assert_less_than_equal: (a: number, b: number, desc: string) =>
        baseAssert(
          'assert_less_than_equal',
          a <= b,
          desc,
          `expected ${a} to be less than or equal to ${b}`,
        ),
    };

    testCase(context);

    return assertionResults;
  }, []);

  const testFunction: PlatformTestHarness['test'] = useCallback(
    (
      testCase: PlatformTestCase,
      name: string,
      options?: SyncTestOptions,
    ): void => {
      const {skip = false} = options ?? {};

      if (skip) {
        addTestResult({
          name,
          status: 'SKIPPED',
          assertions: [],
          error: null,
        });
        return;
      }

      try {
        const assertionResults = runTestCase(testCase);
        addTestResult({
          name,
          status: didAllAssertionsPass(assertionResults) ? 'PASS' : 'FAIL',
          assertions: assertionResults,
          error: null,
        });
      } catch (error) {
        addTestResult({
          name,
          status: 'ERROR',
          assertions: [],
          error,
        });
      }
    },
    [addTestResult, runTestCase],
  );

  const asyncTestHook: PlatformTestHarness['useAsyncTest'] = useMemo(
    () =>
      constructAsyncTestHook(
        addTestResult,
        updateAsyncTestStatuses,
        runTestCase,
      ),
    [addTestResult, runTestCase],
  );

  const numPendingAsyncTests = useMemo(() => {
    let numPending = 0;
    for (const asyncTestName in asyncTestStatuses) {
      const asyncTestStatus = asyncTestStatuses[asyncTestName];
      if (asyncTestStatus === 'NOT_RAN') {
        numPending++;
      }
    }
    return numPending;
  }, [asyncTestStatuses]);

  const harness: PlatformTestHarness = useMemo(
    () => ({
      test: testFunction,
      useAsyncTest: asyncTestHook,
    }),
    [asyncTestHook, testFunction],
  );

  return {
    harness,
    numPending: numPendingAsyncTests,
    reset,
    results: testResults,
    testKey: testElementKey,
  };
}
