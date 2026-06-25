/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {SymbolicatedStackTrace} from '../../../Core/Devtools/symbolicateStackTrace';
import type {StackFrame} from '../../../Core/NativeExceptionsManager';

jest.mock('../LogBoxSymbolication', () => {
  return {__esModule: true, symbolicate: jest.fn(), deleteStack: jest.fn()};
});

type CodeCodeFrame = Readonly<{
  content: string,
  location: ?{
    row: number,
    column: number,
    ...
  },
  fileName: string,
}>;

const STACK_CODE_FRAME: CodeCodeFrame = {
  fileName: '/path/to/Stack.js',
  location: {row: 199, column: 0},
  content: '<code frame>',
};

const COMPONENT_CODE_FRAME: CodeCodeFrame = {
  fileName: '/path/to/Component.js',
  location: {row: 199, column: 0},
  content: 'Component',
};

function getLogBoxLog() {
  return new (require('../LogBoxLog').default)({
    level: 'warn',
    isComponentError: false,
    message: {content: '...', substitutions: []},
    stack: createStack(['A', 'B', 'C']),
    category: 'Message category...',
    componentStack: createComponentStack(['A', 'B', 'C']),
    codeFrame: null,
  });
}

function getLogBoxSymbolication(): {
  symbolicate: JestMockFn<
    ReadonlyArray<Array<StackFrame>>,
    Promise<SymbolicatedStackTrace>,
  >,
} {
  return require('../LogBoxSymbolication') as any;
}

const createStack = (methodNames: Array<string>) =>
  methodNames.map((methodName): StackFrame => ({
    column: 0,
    file: 'file://path/to/file.js',
    lineNumber: 1,
    methodName,
  }));

const createComponentStack = (methodNames: Array<string>) =>
  methodNames.map((methodName): StackFrame => ({
    column: 0,
    file: 'file://path/to/component.js',
    lineNumber: 1,
    methodName,
  }));

function mockSymbolicate(
  stack: ReadonlyArray<StackFrame>,
  stackCodeFrame: ?CodeCodeFrame,
  componentCodeFrame: ?CodeCodeFrame,
): SymbolicatedStackTrace {
  const firstFrame = stack[0];
  if (
    firstFrame != null &&
    firstFrame.file != null &&
    firstFrame.file.indexOf('component.js') > 0
  ) {
    return {
      stack: createStack(stack.map(frame => `C(${frame.methodName})`)),
      codeFrame: COMPONENT_CODE_FRAME,
    };
  }
  return {
    stack: createStack(stack.map(frame => `S(${frame.methodName})`)),
    codeFrame: STACK_CODE_FRAME,
  };
}
// Adds a new task to the end of the microtask queue, so that awaiting this
// function will run all queued immediates
const runMicrotasks = async () => {};

describe('LogBoxLog', () => {
  beforeEach(() => {
    jest.resetModules();

    getLogBoxSymbolication().symbolicate.mockImplementation(async stack =>
      mockSymbolicate(stack),
    );
  });

  describe('symbolicate component stacks', () => {
    it('creates a LogBoxLog object', () => {
      const log = getLogBoxLog();

      expect(log.level).toEqual('warn');
      expect(log.message).toEqual({content: '...', substitutions: []});
      expect(log.stack).toEqual(createStack(['A', 'B', 'C']));
      expect(log.category).toEqual('Message category...');
      expect(log.componentStack).toEqual(createComponentStack(['A', 'B', 'C']));
      expect(log.codeFrame).toEqual(null);
      expect(log.componentCodeFrame).toEqual(undefined);
    });

    it('increments LogBoxLog count', () => {
      const log = getLogBoxLog();

      expect(log.count).toEqual(1);

      log.incrementCount();

      expect(log.count).toEqual(2);
    });

    it('starts without a symbolicated stack', () => {
      const log = getLogBoxLog();

      expect(log.symbolicated).toEqual({
        error: null,
        stack: null,
        status: 'NONE',
      });
      expect(log.symbolicatedComponentStack).toEqual({
        error: null,
        stack: null,
        status: 'NONE',
      });
    });

    it('updates when symbolication is in progress', () => {
      const log = getLogBoxLog();

      const callback = jest.fn();
      log.symbolicate(callback);

      expect(callback).toBeCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('PENDING');
      expect(callback.mock.calls[1][0]).toBe('PENDING');
      expect(getLogBoxSymbolication().symbolicate).toBeCalledTimes(2);
      expect(log.symbolicated).toEqual({
        error: null,
        stack: null,
        status: 'PENDING',
      });
      expect(log.symbolicatedComponentStack).toEqual({
        error: null,
        stack: null,
        status: 'PENDING',
      });

      // Symbolicating while pending should not make more requests.
      callback.mockClear();
      getLogBoxSymbolication().symbolicate.mockClear();

      log.symbolicate(callback);
      expect(callback).not.toBeCalled();
      expect(getLogBoxSymbolication().symbolicate).not.toBeCalled();
    });

    it('updates when symbolication finishes', async () => {
      const log = getLogBoxLog();

      const callback = jest.fn();
      log.symbolicate(callback);
      expect(callback).toBeCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('PENDING');
      expect(callback.mock.calls[1][0]).toBe('PENDING');
      expect(getLogBoxSymbolication().symbolicate).toBeCalledTimes(2);
      callback.mockClear();

      await runMicrotasks();

      expect(callback).toBeCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('COMPLETE');
      expect(callback.mock.calls[1][0]).toBe('COMPLETE');
      expect(log.symbolicated).toEqual({
        error: null,
        stack: createStack(['S(A)', 'S(B)', 'S(C)']),
        status: 'COMPLETE',
      });
      expect(log.codeFrame).toBe(STACK_CODE_FRAME);
      expect(log.symbolicatedComponentStack).toEqual({
        error: null,
        stack: createStack(['C(A)', 'C(B)', 'C(C)']),
        status: 'COMPLETE',
      });
      expect(log.componentCodeFrame).toBe(COMPONENT_CODE_FRAME);

      // Do not symbolicate again.
      callback.mockClear();
      getLogBoxSymbolication().symbolicate.mockClear();

      log.symbolicate(callback);

      await runMicrotasks();

      expect(callback).toBeCalledTimes(0);
      expect(getLogBoxSymbolication().symbolicate).not.toBeCalled();
    });

    it('updates when first symbolication fails', async () => {
      const error = new Error('...');
      let count = 0;
      getLogBoxSymbolication().symbolicate.mockImplementation(async stack => {
        count += 1;
        if (count === 1) {
          throw error;
        }
        return mockSymbolicate(stack);
      });

      const log = getLogBoxLog();

      const callback = jest.fn();
      log.symbolicate(callback);
      expect(callback).toBeCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('PENDING');
      expect(callback.mock.calls[1][0]).toBe('PENDING');
      expect(getLogBoxSymbolication().symbolicate).toBeCalled();
      callback.mockClear();

      await runMicrotasks();

      expect(callback).toBeCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('FAILED');
      expect(callback.mock.calls[1][0]).toBe('COMPLETE');
      expect(log.symbolicated).toEqual({
        error,
        stack: null,
        status: 'FAILED',
      });
      expect(log.symbolicatedComponentStack).toEqual({
        error: null,
        stack: createStack(['C(A)', 'C(B)', 'C(C)']),
        status: 'COMPLETE',
      });

      expect(log.componentCodeFrame).toBe(COMPONENT_CODE_FRAME);

      // Do not symbolicate again, retry if needed.
      callback.mockClear();
      getLogBoxSymbolication().symbolicate.mockClear();

      log.symbolicate(callback);

      await runMicrotasks();

      expect(callback).toBeCalledTimes(0);
      expect(getLogBoxSymbolication().symbolicate).not.toBeCalled();
    });

    it('updates when second symbolication fails', async () => {
      const error = new Error('...');
      let count = 0;
      getLogBoxSymbolication().symbolicate.mockImplementation(async stack => {
        count += 1;
        if (count === 2) {
          throw error;
        }
        return mockSymbolicate(stack);
      });

      const log = getLogBoxLog();

      const callback = jest.fn();
      log.symbolicate(callback);
      expect(callback).toBeCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('PENDING');
      expect(callback.mock.calls[1][0]).toBe('PENDING');
      expect(getLogBoxSymbolication().symbolicate).toBeCalled();
      callback.mockClear();

      await runMicrotasks();

      expect(callback).toBeCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('COMPLETE');
      expect(callback.mock.calls[1][0]).toBe('FAILED');
      expect(log.symbolicated).toEqual({
        error: null,
        stack: createStack(['S(A)', 'S(B)', 'S(C)']),
        status: 'COMPLETE',
      });
      expect(log.codeFrame).toBe(STACK_CODE_FRAME);
      expect(log.symbolicatedComponentStack).toEqual({
        error,
        stack: null,
        status: 'FAILED',
      });

      // Do not symbolicate again, retry if needed.
      callback.mockClear();
      getLogBoxSymbolication().symbolicate.mockClear();

      log.symbolicate(callback);

      await runMicrotasks();

      expect(callback).toBeCalledTimes(0);
      expect(getLogBoxSymbolication().symbolicate).not.toBeCalled();
    });

    it('retry updates when symbolication is in progress', () => {
      const log = getLogBoxLog();

      const callback = jest.fn();
      log.retrySymbolicate(callback);

      expect(callback).toBeCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('PENDING');
      expect(callback.mock.calls[1][0]).toBe('PENDING');
      expect(getLogBoxSymbolication().symbolicate).toBeCalledTimes(2);
      expect(log.symbolicated).toEqual({
        error: null,
        stack: null,
        status: 'PENDING',
      });
      expect(log.symbolicatedComponentStack).toEqual({
        error: null,
        stack: null,
        status: 'PENDING',
      });

      // Symbolicating while pending should not make more requests.
      callback.mockClear();
      getLogBoxSymbolication().symbolicate.mockClear();

      log.symbolicate(callback);
      expect(callback).not.toBeCalled();
      expect(getLogBoxSymbolication().symbolicate).not.toBeCalled();
    });

    it('retry updates when symbolication finishes', async () => {
      const log = getLogBoxLog();

      const callback = jest.fn();
      log.retrySymbolicate(callback);
      expect(callback).toBeCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('PENDING');
      expect(callback.mock.calls[1][0]).toBe('PENDING');
      expect(getLogBoxSymbolication().symbolicate).toBeCalledTimes(2);
      callback.mockClear();

      await runMicrotasks();

      expect(callback).toBeCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('COMPLETE');
      expect(callback.mock.calls[1][0]).toBe('COMPLETE');
      expect(log.symbolicated).toEqual({
        error: null,
        stack: createStack(['S(A)', 'S(B)', 'S(C)']),
        status: 'COMPLETE',
      });
      expect(log.codeFrame).toBe(STACK_CODE_FRAME);
      expect(log.symbolicatedComponentStack).toEqual({
        error: null,
        stack: createStack(['C(A)', 'C(B)', 'C(C)']),
        status: 'COMPLETE',
      });
      expect(log.componentCodeFrame).toBe(COMPONENT_CODE_FRAME);

      // Do not symbolicate again
      callback.mockClear();
      getLogBoxSymbolication().symbolicate.mockClear();

      log.retrySymbolicate(callback);
      jest.runAllTicks();

      expect(callback).toBeCalledTimes(0);
      expect(getLogBoxSymbolication().symbolicate).not.toBeCalled();
    });

    it('retry updates when both symbolications fail', async () => {
      const error = new Error('...');
      getLogBoxSymbolication().symbolicate.mockImplementation(async stack => {
        throw error;
      });

      const log = getLogBoxLog();

      const callback = jest.fn();
      log.retrySymbolicate(callback);
      expect(callback).toBeCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('PENDING');
      expect(callback.mock.calls[1][0]).toBe('PENDING');
      expect(getLogBoxSymbolication().symbolicate).toBeCalledTimes(2);
      callback.mockClear();

      await runMicrotasks();

      expect(callback).toBeCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('FAILED');
      expect(callback.mock.calls[1][0]).toBe('FAILED');
      expect(log.symbolicated).toEqual({
        error,
        stack: null,
        status: 'FAILED',
      });
      expect(log.symbolicatedComponentStack).toEqual({
        error,
        stack: null,
        status: 'FAILED',
      });

      // Retry to symbolicate again.
      callback.mockClear();
      getLogBoxSymbolication().symbolicate.mockClear();
      getLogBoxSymbolication().symbolicate.mockImplementation(async stack =>
        mockSymbolicate(stack),
      );

      log.retrySymbolicate(callback);

      expect(callback).toBeCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('PENDING');
      expect(callback.mock.calls[1][0]).toBe('PENDING');
      expect(getLogBoxSymbolication().symbolicate).toBeCalledTimes(2);
      callback.mockClear();

      await runMicrotasks();

      expect(callback.mock.calls[0][0]).toBe('COMPLETE');
      expect(callback.mock.calls[1][0]).toBe('COMPLETE');
      expect(log.symbolicated).toEqual({
        error: null,
        stack: createStack(['S(A)', 'S(B)', 'S(C)']),
        status: 'COMPLETE',
      });
      expect(log.codeFrame).toBe(STACK_CODE_FRAME);
      expect(log.symbolicatedComponentStack).toEqual({
        error: null,
        stack: createStack(['C(A)', 'C(B)', 'C(C)']),
        status: 'COMPLETE',
      });
      expect(log.componentCodeFrame).toBe(COMPONENT_CODE_FRAME);
    });

    it('retry updates when stack symbolication fails', async () => {
      const error = new Error('...');
      let count = 0;
      getLogBoxSymbolication().symbolicate.mockImplementation(async stack => {
        count += 1;
        if (count === 1) {
          throw error;
        }
        return mockSymbolicate(stack);
      });

      const log = getLogBoxLog();

      const callback = jest.fn();
      log.retrySymbolicate(callback);
      expect(callback).toBeCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('PENDING');
      expect(callback.mock.calls[1][0]).toBe('PENDING');
      expect(getLogBoxSymbolication().symbolicate).toBeCalledTimes(2);
      callback.mockClear();

      await runMicrotasks();

      expect(callback).toBeCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('FAILED');
      expect(callback.mock.calls[1][0]).toBe('COMPLETE');
      expect(log.symbolicated).toEqual({
        error,
        stack: null,
        status: 'FAILED',
      });
      expect(log.symbolicatedComponentStack).toEqual({
        error: null,
        stack: createStack(['C(A)', 'C(B)', 'C(C)']),
        status: 'COMPLETE',
      });
      expect(log.componentCodeFrame).toBe(COMPONENT_CODE_FRAME);

      // Retry to symbolicate again.
      callback.mockClear();
      getLogBoxSymbolication().symbolicate.mockClear();
      getLogBoxSymbolication().symbolicate.mockImplementation(async stack =>
        mockSymbolicate(stack),
      );

      log.retrySymbolicate(callback);

      // Since only one symbolication failed, we should only have one pending.
      expect(callback).toBeCalledTimes(1);
      expect(callback.mock.calls[0][0]).toBe('PENDING');
      expect(getLogBoxSymbolication().symbolicate).toBeCalledTimes(1);
      callback.mockClear();

      await runMicrotasks();

      expect(callback).toBeCalledTimes(1);
      expect(callback.mock.calls[0][0]).toBe('COMPLETE');
      expect(log.symbolicated).toEqual({
        error: null,
        stack: createStack(['S(A)', 'S(B)', 'S(C)']),
        status: 'COMPLETE',
      });
      expect(log.codeFrame).toBe(STACK_CODE_FRAME);
      expect(log.symbolicatedComponentStack).toEqual({
        error: null,
        stack: createStack(['C(A)', 'C(B)', 'C(C)']),
        status: 'COMPLETE',
      });
      expect(log.componentCodeFrame).toBe(COMPONENT_CODE_FRAME);
    });

    it('retry updates when component symbolication fails', async () => {
      const error = new Error('...');
      let count = 0;
      getLogBoxSymbolication().symbolicate.mockImplementation(async stack => {
        count += 1;
        if (count === 2) {
          throw error;
        }
        return mockSymbolicate(stack);
      });

      const log = getLogBoxLog();

      const callback = jest.fn();
      log.retrySymbolicate(callback);
      expect(callback).toBeCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('PENDING');
      expect(callback.mock.calls[1][0]).toBe('PENDING');
      expect(getLogBoxSymbolication().symbolicate).toBeCalledTimes(2);
      callback.mockClear();

      await runMicrotasks();

      expect(callback).toBeCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('COMPLETE');
      expect(callback.mock.calls[1][0]).toBe('FAILED');
      expect(log.symbolicated).toEqual({
        error: null,
        stack: createStack(['S(A)', 'S(B)', 'S(C)']),
        status: 'COMPLETE',
      });
      expect(log.codeFrame).toBe(STACK_CODE_FRAME);
      expect(log.symbolicatedComponentStack).toEqual({
        error,
        stack: null,
        status: 'FAILED',
      });

      // Retry to symbolicate again.
      callback.mockClear();
      getLogBoxSymbolication().symbolicate.mockClear();
      getLogBoxSymbolication().symbolicate.mockImplementation(async stack =>
        mockSymbolicate(stack),
      );

      log.retrySymbolicate(callback);

      // Since only one symbolication failed, we should only have one pending.
      expect(callback).toBeCalledTimes(1);
      expect(callback.mock.calls[0][0]).toBe('PENDING');
      expect(getLogBoxSymbolication().symbolicate).toBeCalledTimes(1);
      callback.mockClear();

      await runMicrotasks();

      expect(callback).toBeCalledTimes(1);
      expect(callback.mock.calls[0][0]).toBe('COMPLETE');
      expect(log.symbolicated).toEqual({
        error: null,
        stack: createStack(['S(A)', 'S(B)', 'S(C)']),
        status: 'COMPLETE',
      });
      expect(log.codeFrame).toBe(STACK_CODE_FRAME);
      expect(log.symbolicatedComponentStack).toEqual({
        error: null,
        stack: createStack(['C(A)', 'C(B)', 'C(C)']),
        status: 'COMPLETE',
      });
      expect(log.componentCodeFrame).toBe(COMPONENT_CODE_FRAME);
    });
  });
});
