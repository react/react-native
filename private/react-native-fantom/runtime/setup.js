/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {CoverageMap} from '../runner/coverage/types.flow';
import type {BenchmarkResult} from '../src/Benchmark';
import type {
  SnapshotConfig,
  TestInlineSnapshotResults,
  TestSnapshotResults,
} from './snapshotContext';

import {getConstants} from '../src/Constants';
import expect from './expect';
import {createMockFunction} from './mocks';
import patchWeakRef from './patchWeakRef';
import {setupSnapshotConfig, snapshotContext} from './snapshotContext';

export type TestCaseResult = {
  ancestorTitles: Array<string>,
  title: string,
  fullName: string,
  status: 'passed' | 'failed' | 'pending',
  duration: number,
  failureMessages: Array<string>,
  failureDetails: Array<FailureDetail>,
  numPassingAsserts: number,
  snapshotResults: TestSnapshotResults,
  inlineSnapshotResults: TestInlineSnapshotResults,
  // location: string,
};

export type FailureDetail = {
  message: string,
  stack?: string,
  cause?: FailureDetail,
};

export type TestSuiteResult =
  | {
      testResults: Array<TestCaseResult>,
      coverageMap?: CoverageMap,
    }
  | {
      error: FailureDetail,
    };

type FocusState = {
  focused: boolean,
  skipped: boolean,
};

type Spec = {
  ...FocusState,
  title: string,
  parentContext: Context,
  implementation: () => unknown,
};

type Suite = Spec | Context;

type Hook = () => void;

type Context = {
  ...FocusState,
  title?: string,
  afterAllHooks: Hook[],
  afterEachHooks: Hook[],
  beforeAllHooks: Hook[],
  beforeEachHooks: Hook[],
  parentContext?: Context,
  children: Array<Suite>,
};

const rootContext: Context = {
  beforeAllHooks: [],
  beforeEachHooks: [],
  afterAllHooks: [],
  afterEachHooks: [validateEmptyMessageQueue],
  children: [],
  focused: false,
  skipped: false,
};
let currentContext: Context = rootContext;

const globalModifiers: Array<'focused' | 'skipped'> = [];

const globalDescribe = (global.describe = (
  title: string,
  implementation: () => unknown,
) => {
  const parentContext = currentContext;
  const {focused, skipped} = getFocusState();
  const childContext: Context = {
    title,
    parentContext,
    afterAllHooks: [],
    afterEachHooks: [],
    beforeAllHooks: [],
    beforeEachHooks: [],
    children: [],
    focused,
    skipped,
  };
  currentContext.children.push(childContext);
  currentContext = childContext;
  implementation();
  currentContext = parentContext;
});

global.afterAll = (implementation: () => void) => {
  currentContext.afterAllHooks.push(implementation);
};

global.afterEach = (implementation: () => void) => {
  currentContext.afterEachHooks.push(implementation);
};

global.beforeAll = (implementation: () => void) => {
  currentContext.beforeAllHooks.push(implementation);
};

global.beforeEach = (implementation: () => void) => {
  currentContext.beforeEachHooks.push(implementation);
};

function getFocusState(): {focused: boolean, skipped: boolean} {
  const focused =
    globalModifiers.length > 0 &&
    globalModifiers[globalModifiers.length - 1] === 'focused';
  const skipped =
    globalModifiers.length > 0 &&
    globalModifiers[globalModifiers.length - 1] === 'skipped';
  return {focused, skipped};
}

const globalIt =
  (global.it =
  global.test =
    (title: string, implementation: () => unknown) => {
      const {focused, skipped} = getFocusState();
      currentContext.children.push({
        title,
        parentContext: currentContext,
        implementation,
        focused,
        skipped,
      });
    });

// $FlowExpectedError[prop-missing]
global.fdescribe = global.describe.only = (
  title: string,
  implementation: () => unknown,
) => {
  globalModifiers.push('focused');
  globalDescribe(title, implementation);
  globalModifiers.pop();
};

// $FlowExpectedError[prop-missing]
global.it.only =
  global.fit =
  // $FlowExpectedError[prop-missing]
  global.test.only =
    (title: string, implementation: () => unknown) => {
      globalModifiers.push('focused');
      globalIt(title, implementation);
      globalModifiers.pop();
    };

// $FlowExpectedError[prop-missing]
global.xdescribe = global.describe.skip = (
  title: string,
  implementation: () => unknown,
) => {
  globalModifiers.push('skipped');
  globalDescribe(title, implementation);
  globalModifiers.pop();
};

// $FlowExpectedError[prop-missing]
global.it.skip =
  global.xit =
  // $FlowExpectedError[prop-missing]
  global.test.skip =
  global.xtest =
    (title: string, implementation: () => unknown) => {
      globalModifiers.push('skipped');
      globalIt(title, implementation);
      globalModifiers.pop();
    };

global.jest = {
  fn: createMockFunction,
};

global.expect = expect;

let testSetupError: ?Error;

function runWithGuard(fn: () => void) {
  try {
    fn();
  } catch (error) {
    testSetupError = error instanceof Error ? error : new Error(String(error));
  }
}

const focusCache = new Map<Suite, boolean>();

function isFocusedSuite(suite: Suite): boolean {
  const cached = focusCache.get(suite);
  if (cached != null) {
    return cached;
  }

  if (isSkipped(suite)) {
    focusCache.set(suite, false);
    return false;
  }

  if ('children' in suite) {
    const hasFocused = suite.children.some(isFocusedSuite);
    focusCache.set(suite, hasFocused);
    return hasFocused;
  }

  focusCache.set(suite, suite.focused);
  return suite.focused;
}

const skippedCache = new Map<Suite, boolean>();
function isSkipped(suite: Suite): boolean {
  const cached = skippedCache.get(suite);
  if (cached != null) {
    return cached;
  }

  if (suite.skipped) {
    skippedCache.set(suite, true);
    return true;
  }

  if (suite.parentContext != null) {
    const skipped = isSkipped(suite.parentContext);
    skippedCache.set(suite, skipped);
    return skipped;
  }

  skippedCache.set(suite, false);
  return false;
}

function getContextTitle(context: Context): string[] {
  if (context.parentContext == null) {
    return [];
  }

  const titles = getContextTitle(context.parentContext);
  if (context.title != null) {
    titles.push(context.title);
  }
  return titles;
}

function invokeHooks(
  context: Context,
  hookType: 'beforeEachHooks' | 'afterEachHooks',
) {
  const contextStack = [];
  let current: ?Context = context;
  while (current != null) {
    if (hookType === 'beforeEachHooks') {
      contextStack.unshift(current);
    } else {
      contextStack.push(current);
    }
    current = current.parentContext;
  }

  for (const c of contextStack) {
    for (const hook of c[hookType]) {
      hook();
    }
  }
}

function shouldRunSuite(suite: Suite): boolean {
  if (isSkipped(suite)) {
    return false;
  }

  if (isFocusedSuite(suite)) {
    return true;
  }

  // there is a focused suite in the root at some point
  // but not in this suite hence we should not run it
  if (isFocusedSuite(rootContext)) {
    return false;
  }

  return true;
}

function runSpec(spec: Spec): TestCaseResult {
  const ancestorTitles = getContextTitle(spec.parentContext);
  const result: TestCaseResult = {
    title: spec.title,
    ancestorTitles,
    fullName: [...ancestorTitles, spec.title].join(' '),
    status: 'pending',
    duration: 0,
    failureMessages: [],
    failureDetails: [],
    numPassingAsserts: 0,
    snapshotResults: {},
    inlineSnapshotResults: [],
  };

  if (!shouldRunSuite(spec)) {
    return result;
  }

  let status: 'passed' | 'failed' | 'pending';
  let error: unknown;

  const start = Date.now();
  snapshotContext.setTargetTest(result.fullName);

  try {
    invokeHooks(spec.parentContext, 'beforeEachHooks');
    spec.implementation();
    invokeHooks(spec.parentContext, 'afterEachHooks');

    status = 'passed';
  } catch (e: unknown) {
    error = e;
    status = 'failed';
  }

  result.status = status;
  result.duration = Date.now() - start;
  if (status === 'failed' && error != null) {
    if (error instanceof Error) {
      result.failureMessages = [error.stack ?? error.message ?? String(error)];
      result.failureDetails = [serializeError(error)];
    } else {
      result.failureMessages = [`Non-error value thrown: ${String(error)}`];
      result.failureDetails = [];
    }
  } else {
    result.failureMessages = [];
    result.failureDetails = [];
  }

  result.snapshotResults = snapshotContext.getSnapshotResults();
  result.inlineSnapshotResults = snapshotContext.getInlineSnapshotResults();
  return result;
}

function runContext(context: Context): TestCaseResult[] {
  const shouldRunHooks = shouldRunSuite(context);

  if (shouldRunHooks) {
    for (const beforeAllHook of context.beforeAllHooks) {
      beforeAllHook();
    }
  }

  const testResults: TestCaseResult[] = [];
  for (const child of context.children) {
    testResults.push(...runSuite(child));
  }

  if (shouldRunHooks) {
    for (const afterAllHook of context.afterAllHooks) {
      afterAllHook();
    }
  }

  return testResults;
}

function runSuite(suite: Suite): TestCaseResult[] {
  if ('children' in suite) {
    return runContext(suite);
  } else {
    return [runSpec(suite)];
  }
}

function reportTestSuiteResult(testSuiteResult: TestSuiteResult): void {
  // Force the import of the native module to be lazy
  const NativeFantom =
    require('react-native/src/private/testing/fantom/specs/NativeFantom').default;

  NativeFantom.reportTestSuiteResultsJSON(
    JSON.stringify({
      type: 'test-result',
      ...testSuiteResult,
    }),
  );
}

export function reportBenchmarkResult(result: BenchmarkResult): void {
  // Force the import of the native module to be lazy
  const NativeFantom =
    require('react-native/src/private/testing/fantom/specs/NativeFantom').default;
  NativeFantom.reportTestSuiteResultsJSON(JSON.stringify(result));
}

function validateEmptyMessageQueue(): void {
  // Force the import of the native module to be lazy
  const NativeFantom =
    require('react-native/src/private/testing/fantom/specs/NativeFantom').default;

  NativeFantom.validateEmptyMessageQueue();
}

function serializeError(error: Error): FailureDetail {
  const result: FailureDetail = {
    message: error.message,
    stack: error.stack,
  };
  if (error.cause instanceof Error) {
    result.cause = serializeError(error.cause);
  }
  return result;
}

function runTest(): Array<TestCaseResult> {
  const {jsTraceOutputPath} = getConstants();
  if (jsTraceOutputPath == null) {
    return runSuite(currentContext);
  }

  // Force the import of the native module to be lazy
  const NativeFantom =
    require('react-native/src/private/testing/fantom/specs/NativeFantom').default;

  try {
    NativeFantom.startJSSamplingProfiler();
  } catch (e) {
    console.error('Could not start JS sampling profiler', e);
  }

  try {
    return runSuite(currentContext);
  } finally {
    try {
      NativeFantom.stopJSSamplingProfilerAndSaveToFile(jsTraceOutputPath);
    } catch (e) {
      console.error('Could not stop JS sampling profiler', e);
    }
  }
}

global.$$RunTests$$ = () => {
  if (testSetupError != null) {
    reportTestSuiteResult({
      error: {
        message: testSetupError.message,
        stack: testSetupError.stack,
      },
    });
  } else {
    reportTestSuiteResult({
      testResults: runTest(),
      coverageMap: global.__coverage__,
    });
  }
};

export function registerTest(
  setUpTest: () => void,
  snapshotConfig: SnapshotConfig,
) {
  setupSnapshotConfig(snapshotConfig);

  runWithGuard(() => {
    setUpTest();
  });
}

patchWeakRef();
