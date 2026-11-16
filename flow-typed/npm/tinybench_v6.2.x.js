/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

declare module 'tinybench' {
  declare export class Task extends EventTarget {
    readonly name: string;
    readonly result: Readonly<TaskResult>;
    readonly runs: number;
    readonly detectedResolution: void | number;

    reset(emit?: boolean): void;
    run(): Promise<Task>;
    runSync(): Task;
    warmup(): Promise<void>;
    warmupSync(): void;
  }

  export type HookMode = 'run' | 'warmup';

  export type Hook = (task: Task, mode: HookMode) => Promise<void> | void;

  export type FnHook = (this: Task, mode?: HookMode) => Promise<void> | void;

  export type Concurrency = null | 'task' | 'bench';

  export type BenchOptions = {
    concurrency?: Concurrency,
    iterations?: number,
    name?: string,
    now?: () => number,
    retainSamples?: boolean,
    setup?: Hook,
    signal?: AbortSignal,
    subtractTimerOverhead?: boolean,
    teardown?: Hook,
    threshold?: number,
    throws?: boolean,
    time?: number,
    warmup?: boolean,
    warmupIterations?: number,
    warmupTime?: number,
  };

  export interface Statistics {
    aad: number;
    critical: number;
    df: number;
    mad: number;
    max: number;
    mean: number;
    min: number;
    moe: number;
    p50: number;
    p75: number;
    p99: number;
    p995: number;
    p999: number;
    rme: number;
    samples: void | number[];
    samplesCount: number;
    sd: number;
    sem: number;
    variance: number;
  }

  export type TaskResultRuntimeInfo = {
    runtime: string,
    runtimeVersion: string,
    timestampProviderName: string,
  };

  export type TaskResultWithStatistics = {
    ...TaskResultRuntimeInfo,
    latency: Statistics,
    period: number,
    throughput: Statistics,
    totalTime: number,
  };

  export type TaskResultCompleted = {
    ...TaskResultWithStatistics,
    state: 'completed',
  };

  export type TaskResultAbortedWithStatistics = {
    ...TaskResultWithStatistics,
    state: 'aborted-with-statistics',
  };

  export type TaskResultErrored = {
    ...TaskResultRuntimeInfo,
    state: 'errored',
    error: Error,
  };

  export type TaskResult =
    | TaskResultCompleted
    | TaskResultAbortedWithStatistics
    | TaskResultErrored
    | {
        ...TaskResultRuntimeInfo,
        state: 'not-started' | 'started' | 'aborted',
      };

  export type FnOptions = {
    afterAll?: FnHook,
    afterEach?: FnHook,
    async?: boolean,
    beforeAll?: FnHook,
    beforeEach?: FnHook,
    retainSamples?: boolean,
    signal?: AbortSignal,
  };

  // A closed object catches misspelled measurement overrides.
  export type FnReturnedObject = {
    overriddenDuration?: number,
    overriddenIterationCost?: number,
  };

  // Fantom callbacks intentionally expose a narrower return type than upstream.
  export type Fn = () =>
    Promise<void | FnReturnedObject> | void | FnReturnedObject;

  declare export class Bench extends EventTarget {
    concurrency: Concurrency;
    iterations: number;
    name?: string;
    now: () => number;
    retainSamples: boolean;
    runtime: string;
    runtimeVersion: string;
    setup: Hook;
    signal?: AbortSignal;
    subtractTimerOverhead: boolean;
    teardown: Hook;
    threshold: number;
    throws: boolean;
    time: number;
    timerOverhead?: number;
    warmup: boolean;
    warmupIterations: number;
    warmupTime: number;
    readonly results: Array<Readonly<TaskResult>>;
    readonly tasks: Array<Task>;

    constructor(options?: BenchOptions): this;
    add(name: string, fn: Fn, fnOpts?: FnOptions): this;
    getTask(name: string): void | Task;
    remove(name: string): this;
    reset(): void;
    run(): Promise<Array<Task>>;
    runSync(): Array<Task>;
    table(
      convert?: (task: Task) => null | Record<string, void | string | number>,
    ): Array<null | Record<string, void | string | number>>;
  }
}
