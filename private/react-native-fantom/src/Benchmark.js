/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {reportBenchmarkResult} from '../runtime/setup';
import {getConstants} from './index';
import nullthrows from 'nullthrows';
import NativeCPUTime from 'react-native/src/private/testing/fantom/specs/NativeCPUTime';
import {
  Bench,
  type BenchOptions,
  type FnOptions,
  type FnReturnedObject,
  type TaskResult,
} from 'tinybench';

type SyncFn = () => FnReturnedObject | void;

export type SuiteOptions = Readonly<{
  minIterations?: number,
  minTestExecutionTimeMs?: number,
  warmup?: boolean,
  minWarmupDurationMs?: number,
  minWarmupIterations?: number,
  disableOptimizedBuildCheck?: boolean,
  testOnly?: boolean,
}>;

export type TestOptions = FnOptions;

export type TestTaskTiming = {
  name: string,
  latency: {
    mean: number,
    min: number,
    max: number,
    p50?: number,
    p75?: number,
    p99?: number,
  },
};

export type BenchmarkResult = {
  type: string,
  timings: ReadonlyArray<TestTaskTiming>,
};

type InternalTestOptions = Readonly<{
  ...FnOptions,
  only?: boolean,
}>;

type SuiteResults = Array<Readonly<TaskResult>>;

type TestWithArgName<TestArgType> = string | ((testArg: TestArgType) => string);

type TestWithArgOptions<TestArgType> =
  | FnOptions
  | ((testArg: TestArgType) => FnOptions);

interface ParameterizedTestFunction {
  <TestArgType>(
    testArgs: ReadonlyArray<TestArgType>,
    name: TestWithArgName<TestArgType>,
    fn: (testArg: TestArgType) => ReturnType<SyncFn>,
    options?: TestWithArgOptions<TestArgType>,
  ): SuiteAPI;
  only: <TestArgType>(
    testArgs: ReadonlyArray<TestArgType>,
    name: TestWithArgName<TestArgType>,
    fn: (testArg: TestArgType) => ReturnType<SyncFn>,
    options?: TestWithArgOptions<TestArgType>,
  ) => SuiteAPI;
}

interface TestFunction {
  (name: string, fn: SyncFn, options?: FnOptions): SuiteAPI;
  only: (name: string, fn: SyncFn, options?: FnOptions) => SuiteAPI;
  // `each` allows to run the same test multiple times with different arguments, provided as an array of values:
  each: ParameterizedTestFunction;
}

interface SuiteAPI {
  readonly test: TestFunction;
  verify(fn: (results: SuiteResults) => void): SuiteAPI;
}

interface TestTask {
  name: string;
  fn: SyncFn;
  options: InternalTestOptions | void;
}

export function now(): number {
  return NativeCPUTime.getCPUTimeNanos() / 1000000;
}

export function suite(
  suiteName: string,
  suiteOptions?: SuiteOptions = {},
): SuiteAPI {
  const tasks: Array<TestTask> = [];
  const verifyFns = [];

  global.it(suiteName, () => {
    if (tasks.length === 0) {
      throw new Error('No benchmark tests defined');
    }

    const {isRunningFromCI, runBenchmarks} = getConstants();

    // If we're running from CI and there's no verification function, there's
    // no point in running the benchmark.
    // We still run a single iteration of each test just to make sure that the
    // logic in the benchmark doesn't break.
    const isTestOnly =
      suiteOptions.testOnly === true ||
      !runBenchmarks ||
      (isRunningFromCI && verifyFns.length === 0);

    const benchOptions: BenchOptions = isTestOnly
      ? {
          warmup: false,
          iterations: 1,
          time: 0,
        }
      : {};

    benchOptions.name = suiteName;
    benchOptions.throws = true;
    benchOptions.now = now;

    if (!isTestOnly) {
      if (suiteOptions.minIterations != null) {
        benchOptions.iterations = suiteOptions.minIterations;
      } else if (suiteOptions.minTestExecutionTimeMs != null) {
        // If the suite specifies `minTestExecutionTimeMs`, we don't need a
        // minimum number of iterations.
        benchOptions.iterations = 0;
      }

      if (suiteOptions.minTestExecutionTimeMs != null) {
        benchOptions.time = suiteOptions.minTestExecutionTimeMs;
      } else if (suiteOptions.minIterations != null) {
        // If the suite specifies `minIterations`, we don't need a minimum test
        // execution time.
        benchOptions.time = 0;
      }

      if (suiteOptions.warmup != null) {
        benchOptions.warmup = suiteOptions.warmup;
      }

      // Just 1 warmup execution for each test by default.
      benchOptions.warmupTime = suiteOptions.minWarmupDurationMs ?? 0;
      benchOptions.warmupIterations = suiteOptions.minWarmupIterations ?? 1;
    }

    const bench = new Bench(benchOptions);

    const isFocused = tasks.find(task => task.options?.only === true) != null;

    for (const task of tasks) {
      if (isFocused && task.options?.only !== true) {
        continue;
      }

      if (task.fn.name === '') {
        // $FlowExpectedError[cannot-write]
        Object.defineProperty(task.fn, 'name', {value: task.name});
      }

      const {only, ...options} = task.options ?? {};
      bench.add(task.name, task.fn, options);
    }

    if (isTestOnly) {
      console.log(
        `Running benchmark in test mode: ${suiteName}. Use --benchmarks to run in benchmark mode.`,
      );
    } else {
      console.log(`Running benchmark: ${suiteName}. Please wait.`);
    }

    const runStartTime = performance.now();

    bench.runSync();

    if (!isTestOnly) {
      printBenchmarkResults(bench, runStartTime);
    }

    for (const verify of verifyFns) {
      verify(bench.results);
    }

    if (!isTestOnly && !NativeCPUTime.hasAccurateCPUTimeNanosForBenchmarks()) {
      throw new Error(
        '`NativeCPUTime` module does not provide accurate CPU time information in this environment. Please run the benchmarks in an environment where it does.',
      );
    }

    if (__DEV__ && suiteOptions.disableOptimizedBuildCheck !== true) {
      throw new Error('Benchmarks should not be run in development mode');
    }

    if (isFocused) {
      throw new Error(
        'Failing focused test to prevent it from being committed',
      );
    }
    if (!isTestOnly) {
      reportBenchmarkResult(createBenchmarkResultsObject(bench, tasks));
    }
  });

  const test = (name: string, fn: SyncFn, options?: FnOptions): SuiteAPI => {
    tasks.push({name, fn, options});
    return suiteAPI;
  };

  test.only = (name: string, fn: SyncFn, options?: FnOptions): SuiteAPI => {
    tasks.push({name, fn, options: {...options, only: true}});
    return suiteAPI;
  };

  const testWithArg = <TestArgType>(
    testArg: TestArgType,
    name: TestWithArgName<TestArgType>,
    fn: (testArg: TestArgType) => ReturnType<SyncFn>,
    options?: TestWithArgOptions<TestArgType>,
    only?: boolean = false,
  ): TestTask => {
    const taskName =
      typeof name === 'function'
        ? name(testArg)
        : `${name} [arg=${String(testArg)}]`;
    const taskOptions =
      typeof options === 'function' ? options(testArg) : options;
    const taskFn = () => fn(testArg);
    return {name: taskName, fn: taskFn, options: {...taskOptions, only}};
  };

  // $FlowFixMe[incompatible-type]
  const testEach: ParameterizedTestFunction = <TestArgType>(
    testArgs: ReadonlyArray<TestArgType>,
    name: TestWithArgName<TestArgType>,
    fn: (testArg: TestArgType) => ReturnType<SyncFn>,
    options?: TestWithArgOptions<TestArgType>,
  ): SuiteAPI => {
    for (const testArg of testArgs) {
      tasks.push(testWithArg(testArg, name, fn, options));
    }
    return suiteAPI;
  };

  testEach.only = (testArgs, name, fn, options) => {
    for (const testArg of testArgs) {
      tasks.push(testWithArg(testArg, name, fn, options, true));
    }
    return suiteAPI;
  };

  test.each = testEach;

  const suiteAPI = {
    test,
    verify(fn: (results: SuiteResults) => void): SuiteAPI {
      verifyFns.push(fn);
      return suiteAPI;
    },
  };

  return suiteAPI;
}

function printBenchmarkResults(bench: Bench, runStartTime: number) {
  const {fantomConfigSummary} = getConstants();
  const benchmarkName =
    (bench.name ?? 'Benchmark') +
    (fantomConfigSummary ? ` (${fantomConfigSummary})` : '');

  const runDuration = performance.now() - runStartTime;
  const durationStr =
    runDuration < 1000
      ? `${runDuration.toFixed(0)}ms`
      : `${(runDuration / 1000).toFixed(0)}s`;

  console.log('');
  console.log(`### ${benchmarkName} ###`);
  console.table(nullthrows(bench.table()));
  console.log('');
  console.log(`Total benchmark duration: ${durationStr}`);
  console.log('');
}

function createBenchmarkResultsObject(
  bench: Bench,
  tasks: Array<TestTask>,
): BenchmarkResult {
  return {
    type: 'benchmark-result',
    timings: tasks.map((task, i) => {
      const result = bench.results[i];
      const {min, max, mean, p50, p75, p99} = result.latency;
      return {
        name: task.name,
        latency: {min, max, mean, p50, p75, p99},
      };
    }),
  };
}
