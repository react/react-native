/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {ensureMockFunction} from './mocks';
import {snapshotContext} from './snapshotContext';
import deepEqual from 'deep-equal';
import {diff} from 'jest-diff';
import {format, plugins} from 'pretty-format';

const stringify = (data: unknown): string =>
  format(data, {min: true, plugins: [plugins.ReactElement]});

class ErrorWithCustomBlame extends Error {
  // Initially 5 to ignore all the frames from Babel helpers to instantiate this
  // custom error class.
  #ignoredFrameCount: number = 5;
  #cachedProcessedStack: ?string;
  #customStack: ?string;

  constructor(message?: string, options?: {cause?: unknown, ...}) {
    super(message, options);

    // The Error constructor forces an own `stack` property that shadows our
    // getter, so deleting it restores that behavior.
    // $FlowExpectedError[incompatible-type]
    delete this.stack;
  }

  blameToPreviousFrame(): this {
    this.#cachedProcessedStack = null;
    this.#ignoredFrameCount++;
    return this;
  }

  // $FlowExpectedError[unsafe-getters-setters]
  get stack(): string {
    if (this.#cachedProcessedStack == null) {
      const originalStack = this.#customStack ?? super.stack;
      // Calling `super.stack` forces an own `stack` property that shadows our
      // getter, so deleting it restores that behavior.
      // $FlowExpectedError[incompatible-type]
      delete this.stack;

      const lines = originalStack.split('\n');
      const index = lines.findIndex(line =>
        /at (.*) \((.*):(\d+):(\d+)\)/.test(line),
      );
      lines.splice(index > -1 ? index : 1, this.#ignoredFrameCount);
      this.#cachedProcessedStack = lines.join('\n');
    }

    return this.#cachedProcessedStack;
  }

  // $FlowExpectedError[unsafe-getters-setters]
  set stack(value: string) {
    this.#cachedProcessedStack = null;
    this.#customStack = value;
  }

  static fromError(error: Error): ErrorWithCustomBlame {
    const errorWithCustomBlame = new ErrorWithCustomBlame(error.message);
    // In this case we're inheriting the error and we don't know if the stack
    // contains helpers that we need to ignore.
    errorWithCustomBlame.#ignoredFrameCount = 0;
    errorWithCustomBlame.stack = error.stack;
    return errorWithCustomBlame;
  }
}

class Expect {
  #received: unknown;
  #isNot: boolean = false;

  constructor(received: unknown) {
    this.#received = received;
  }

  // $FlowExpectedError[unsafe-getters-setters]
  get not(): this {
    this.#isNot = !this.#isNot;
    return this;
  }

  toEqual(expected: unknown): void {
    const pass = deepEqual(this.#received, expected, {strict: true});
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected${this.#maybeNotLabel()} to equal:\n${
          diff(expected, this.#received, {
            contextLines: 1,
            expand: false,
            omitAnnotationLines: true,
          }) ?? 'Failed to compare outputs'
        }`,
      ).blameToPreviousFrame();
    }
  }

  toStrictEqual(expected: unknown): void {
    let expectedType: unknown =
      typeof expected === 'object' && expected !== null
        ? Object.getPrototypeOf(expected)
        : null;
    let receivedType: unknown =
      typeof this.#received === 'object' && this.#received !== null
        ? Object.getPrototypeOf(this.#received)
        : null;
    const pass =
      deepEqual(this.#received, expected, {strict: true}) &&
      expectedType === receivedType;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected${this.#maybeNotLabel()} to strictly equal:\n${
          diff(expected, this.#received, {
            contextLines: 1,
            expand: false,
            omitAnnotationLines: true,
          }) ?? 'Failed to compare outputs'
        }`,
      ).blameToPreviousFrame();
    }
  }

  toBe(expected: unknown): void {
    const pass = this.#received === expected;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected${this.#maybeNotLabel()} ${String(expected)} but received ${String(this.#received)}.`,
      ).blameToPreviousFrame();
    }
  }

  toBeInstanceOf(expected: Class<unknown>): void {
    const pass = this.#received instanceof expected;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `expected ${String(this.#received)}${this.#maybeNotLabel()} to be an instance of ${String(expected)}`,
      ).blameToPreviousFrame();
    }
  }

  toBeCloseTo(expected: number, precision: number = 2): void {
    const pass =
      Math.abs(expected - Number(this.#received)) < Math.pow(10, -precision);
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to be close to ${expected}`,
      ).blameToPreviousFrame();
    }
  }

  toBeDefined(): void {
    const pass = this.#received !== undefined;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to be defined`,
      ).blameToPreviousFrame();
    }
  }

  toBeUndefined(): void {
    const pass = this.#received === undefined;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to be undefined`,
      ).blameToPreviousFrame();
    }
  }

  toBeNull(): void {
    const pass = this.#received == null;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to be null`,
      ).blameToPreviousFrame();
    }
  }

  toBeFalsy(): void {
    const pass = Boolean(this.#received) === false;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to be falsy`,
      ).blameToPreviousFrame();
    }
  }

  toBeTruthy(): void {
    const pass = Boolean(this.#received);
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to be truthy`,
      ).blameToPreviousFrame();
    }
  }

  toThrow(expected?: string): void {
    if (expected != null && typeof expected !== 'string') {
      throw new ErrorWithCustomBlame(
        'toThrow() implementation only accepts strings as arguments.',
      ).blameToPreviousFrame();
    }

    let thrownError;
    try {
      // $FlowExpectedError[not-a-function]
      this.#received();
    } catch (error) {
      thrownError = error;
    }

    if (this.#isNot) {
      if (expected != null) {
        if (thrownError != null && thrownError.message === expected) {
          throw new ErrorWithCustomBlame(
            `Expected ${String(this.#received)} not to throw with message ${expected}"`,
          ).blameToPreviousFrame();
        }
      } else if (thrownError != null) {
        throw new ErrorWithCustomBlame(
          `Expected ${String(this.#received)} not to throw, but threw ${String(thrownError)}`,
        ).blameToPreviousFrame();
      }
    } else {
      if (thrownError == null) {
        throw new ErrorWithCustomBlame(
          `Expected ${String(this.#received)} to throw`,
        ).blameToPreviousFrame();
      } else if (expected != null && thrownError.message !== expected) {
        throw new ErrorWithCustomBlame(
          `Expected ${String(this.#received)} to throw with message "${expected}", but threw with message "${thrownError.message}"`,
        ).blameToPreviousFrame();
      }
    }
  }

  toBeCalled: () => void;
  toHaveBeenCalled(): void {
    const mock = this.#requireMock();
    const pass = mock.calls.length > 0;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to have been called, but it was${this.#isNot ? '' : "n't"}`,
      ).blameToPreviousFrame();
    }
  }

  toBeCalledTimes: (times: number) => void;
  toHaveBeenCalledTimes(times: number): void {
    const mock = this.#requireMock();
    const pass = mock.calls.length === times;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to have been called ${times} times, but it was called ${mock.calls.length} times`,
      ).blameToPreviousFrame();
    }
  }

  toBeCalledWith: (...args: Array<unknown>) => void;
  toHaveBeenCalledWith(...args: Array<unknown>): void {
    const mock = this.#requireMock();
    const pass = mock.calls.some(callArgs =>
      deepEqual(callArgs, args, {strict: true}),
    );
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to have been called with ${stringify(
          args,
        )}, but it was called with ${stringify(mock.calls)}`,
      ).blameToPreviousFrame();
    }
  }

  lastCalledWith: (...args: Array<unknown>) => void;
  toHaveBeenLastCalledWith(...args: unknown[]): void {
    const mock = this.#requireMock();
    if (mock.calls.length === 0) {
      if (this.#isNot) {
        return;
      }

      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)} to have been last called with ${stringify(args)}, but it was not called a single time.`,
      );
    }

    const pass = deepEqual(mock.lastCall, args, {strict: true});
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to have been last called with ${stringify(args)}, but it was last called with ${stringify(mock.lastCall)}.`,
      );
    }
  }

  nthCalledWith: (index: number, ...args: unknown[]) => void;
  toHaveBeenNthCalledWith(index: number, ...args: unknown[]): void {
    if (index < 1) {
      throw new ErrorWithCustomBlame(
        `Expected index to be positive number, got ${index}.`,
      ).blameToPreviousFrame();
    }

    const mock = this.#requireMock();
    if (this.#isNot && mock.calls.length < index) {
      return;
    }

    const pass = deepEqual(mock.calls[index - 1], args, {strict: true});
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to have been nth(${index}) called with ${stringify(args)}, but it was called with ${stringify(mock.calls[index - 1])}.`,
      );
    }
  }

  toBeGreaterThan(expected: number): void {
    if (typeof this.#received !== 'number') {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)} to be a number but it was a ${typeof this.#received}`,
      ).blameToPreviousFrame();
    }

    if (typeof expected !== 'number') {
      throw new ErrorWithCustomBlame(
        `Expected ${String(expected)} to be a number but it was a ${typeof expected}`,
      ).blameToPreviousFrame();
    }

    const pass = this.#received > expected;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to be greater than or equal to ${expected}`,
      ).blameToPreviousFrame();
    }
  }

  toBeGreaterThanOrEqual(expected: number): void {
    if (typeof this.#received !== 'number') {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)} to be a number but it was a ${typeof this.#received}`,
      ).blameToPreviousFrame();
    }

    if (typeof expected !== 'number') {
      throw new ErrorWithCustomBlame(
        `Expected ${String(expected)} to be a number but it was a ${typeof expected}`,
      ).blameToPreviousFrame();
    }

    const pass = this.#received >= expected;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to be greater than or equal to ${expected}`,
      ).blameToPreviousFrame();
    }
  }

  toBeLessThan(expected: number): void {
    if (typeof this.#received !== 'number') {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)} to be a number but it was a ${typeof this.#received}`,
      ).blameToPreviousFrame();
    }

    if (typeof expected !== 'number') {
      throw new ErrorWithCustomBlame(
        `Expected ${String(expected)} to be a number but it was a ${typeof expected}`,
      ).blameToPreviousFrame();
    }

    const pass = this.#received < expected;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to be less than or equal to ${expected}`,
      ).blameToPreviousFrame();
    }
  }

  toBeLessThanOrEqual(expected: number): void {
    if (typeof this.#received !== 'number') {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)} to be a number but it was a ${typeof this.#received}`,
      ).blameToPreviousFrame();
    }

    if (typeof expected !== 'number') {
      throw new ErrorWithCustomBlame(
        `Expected ${String(expected)} to be a number but it was a ${typeof expected}`,
      ).blameToPreviousFrame();
    }

    const pass = this.#received <= expected;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to be less than or equal to ${expected}`,
      ).blameToPreviousFrame();
    }
  }

  toContain(item: unknown): void {
    if (typeof this.#received === 'string') {
      if (typeof item !== 'string') {
        throw new ErrorWithCustomBlame(
          `Expected ${String(item)} to be a string but it was a ${typeof item}`,
        ).blameToPreviousFrame();
      }

      const pass = this.#received.includes(item);
      if (!this.#isExpectedResult(pass)) {
        throw new ErrorWithCustomBlame(
          `Expected ${String(this.#received)}${this.#maybeNotLabel()} to contain ${item}`,
        ).blameToPreviousFrame();
      }
      return;
    }

    if (!Array.isArray(this.#received)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)} to be an array`,
      ).blameToPreviousFrame();
    }

    const pass = this.#received.includes(item);
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to contain ${String(item)}`,
      ).blameToPreviousFrame();
    }
  }

  toContainEqual(item: unknown): void {
    if (typeof this.#received === 'string') {
      if (typeof item !== 'string') {
        throw new ErrorWithCustomBlame(
          `Expected ${String(item)} to be a string but it was a ${typeof item}`,
        ).blameToPreviousFrame();
      }

      const pass = this.#received.includes(item);
      if (!this.#isExpectedResult(pass)) {
        throw new ErrorWithCustomBlame(
          `Expected ${String(this.#received)}${this.#maybeNotLabel()} to contain ${item}`,
        ).blameToPreviousFrame();
      }
      return;
    }

    if (!Array.isArray(this.#received)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)} to be an array`,
      ).blameToPreviousFrame();
    }

    const pass = this.#received.some(value =>
      deepEqual(value, item, {strict: true}),
    );
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to contain item equal to ${String(item)}`,
      ).blameToPreviousFrame();
    }
  }

  toHaveLength(expected: number): void {
    if (typeof this.#received !== 'string' && !Array.isArray(this.#received)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)} to be a string or an array`,
      ).blameToPreviousFrame();
    }

    const length = this.#received.length;
    const pass = length === expected;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to have ${expected} length, but it has length of ${length}.`,
      ).blameToPreviousFrame();
    }
  }

  toMatch(expected: RegExp | string): void {
    const value = this.#received;
    if (typeof value !== 'string') {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)} to be a string but it was a ${typeof this.#received}`,
      ).blameToPreviousFrame();
    }

    if (typeof expected !== 'string' && !(expected instanceof RegExp)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(expected)} to be a string or a regular expression but it was a ${typeof expected}`,
      ).blameToPreviousFrame();
    }

    const pass =
      typeof expected === 'string'
        ? value.includes(expected)
        : expected.test(value);
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(value)}${this.#maybeNotLabel()} to match ${stringify(expected)}`,
      ).blameToPreviousFrame();
    }
  }

  toMatchSnapshot(expected?: string): void {
    if (this.#isNot) {
      throw new ErrorWithCustomBlame(
        'Snapshot matchers cannot be used with not.',
      ).blameToPreviousFrame();
    }

    const receivedValue = format(this.#received, {
      plugins: [plugins.ReactElement],
    });

    try {
      snapshotContext.toMatchSnapshot(receivedValue, expected);
    } catch (err) {
      throw new ErrorWithCustomBlame(err.message).blameToPreviousFrame();
    }
  }

  toMatchInlineSnapshot(expected?: string): void {
    if (this.#isNot) {
      throw new ErrorWithCustomBlame(
        'Snapshot matchers cannot be used with not.',
      ).blameToPreviousFrame();
    }

    const receivedValue = format(this.#received, {
      plugins: [plugins.ReactElement],
    });

    const stackTrace = new Error().stack ?? '';

    try {
      snapshotContext.toMatchInlineSnapshot(
        receivedValue,
        expected,
        stackTrace,
      );
    } catch (err) {
      throw new ErrorWithCustomBlame(err.message).blameToPreviousFrame();
    }
  }

  #isExpectedResult(pass: boolean): boolean {
    return this.#isNot ? !pass : pass;
  }

  #maybeNotLabel(): string {
    return this.#isNot ? ' not' : '';
  }

  #requireMock(): JestMockFn<Array<unknown>, unknown>['mock'] {
    try {
      return ensureMockFunction(this.#received).mock;
    } catch (error) {
      const errorWithCustomBlame = ErrorWithCustomBlame.fromError(error);
      errorWithCustomBlame.message = `Expected ${String(this.#received)} to be a mock function, but it wasn't`;
      errorWithCustomBlame
        .blameToPreviousFrame() // ignore `ensureMockFunction`
        .blameToPreviousFrame() // ignore `requireMock`
        .blameToPreviousFrame(); // ignore `expect().[method]`
      throw errorWithCustomBlame;
    }
  }
}

/**
 * Base methods can't be implemented as an arrow function because they
 * will not be added to the prototype.
 */
// $FlowExpectedError[method-unbinding]
Expect.prototype.toBeCalled = Expect.prototype.toHaveBeenCalled;
// $FlowExpectedError[method-unbinding]
Expect.prototype.toBeCalledTimes = Expect.prototype.toHaveBeenCalledTimes;
// $FlowExpectedError[method-unbinding]
Expect.prototype.toBeCalledWith = Expect.prototype.toHaveBeenCalledWith;
// $FlowExpectedError[method-unbinding]
Expect.prototype.lastCalledWith = Expect.prototype.toHaveBeenLastCalledWith;
// $FlowExpectedError[method-unbinding]
Expect.prototype.nthCalledWith = Expect.prototype.toHaveBeenNthCalledWith;

const expect: unknown => Expect = (received: unknown) => new Expect(received);

export default expect;
