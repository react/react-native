/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {ExceptionData} from '../NativeExceptionsManager';

const ExceptionsManager = require('../ExceptionsManager').default;
const ReactFiberErrorDialog = require('../ReactFiberErrorDialog').default;
const fs = require('fs');
const path = require('path');

const capturedErrorDefaults = {
  componentName: 'A',
  componentStack: '\n  in A\n  in B\n  in C',
  errorBoundary: null,
  errorBoundaryFound: false,
  errorBoundaryName: null,
  willRetry: false,
};

describe('checkVersion', () => {
  describe('in development', () => {
    setDevelopmentModeForTests(true);
    runExceptionsManagerTests();
  });

  describe('in production', () => {
    setDevelopmentModeForTests(false);
    runExceptionsManagerTests();
  });
});

function setDevelopmentModeForTests(dev: unknown) {
  let originalDev;

  beforeAll(() => {
    originalDev = global.__DEV__;
    // $FlowExpectedError[cannot-write]
    global.__DEV__ = dev;
  });

  afterAll(() => {
    // $FlowExpectedError[cannot-write]
    global.__DEV__ = originalDev;
  });
}

function runExceptionsManagerTests() {
  describe('ExceptionsManager', () => {
    let nativeReportException: JestMockFn<[ExceptionData], void>;
    let logBoxAddException: JestMockFn<[ExceptionData], void>;
    let logBoxAddConsoleLog;

    beforeEach(() => {
      nativeReportException = jest.fn();
      logBoxAddException = jest.fn();
      logBoxAddConsoleLog = jest.fn();

      jest.resetModules();
      jest.mock('../../LogBox/LogBox', () => ({
        default: {
          addException: logBoxAddException,
          addConsoleLog: logBoxAddConsoleLog,
        },
      }));
      jest.mock('../NativeExceptionsManager', () => {
        return {
          default: {
            reportException: nativeReportException,
          },
        };
      });
      // Make symbolication a no-op.
      jest.mock('../Devtools/symbolicateStackTrace', () => ({
        __esModule: true,
        default: async function symbolicateStackTrace(stack) {
          return {stack};
        },
      }));
      jest.spyOn(console, 'error').mockReturnValue(undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('ReactFiberErrorDialog.showErrorDialog', () => {
      test('forwards error instance to reportException', () => {
        const error = new ReferenceError('Some error happened');
        // Copy all the data we care about before any possible mutation.
        const {message, name} = error;

        const logToConsoleInReact = ReactFiberErrorDialog.showErrorDialog({
          ...capturedErrorDefaults,
          error,
        });

        let exceptionData;
        if (__DEV__) {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBe(0);
          expect(logBoxAddException).toBeCalledTimes(1);
          exceptionData = logBoxAddException.mock.calls[0][0];
        } else {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException.mock.calls.length).toBe(1);
          exceptionData = nativeReportException.mock.calls[0][0];
        }

        const formattedMessage =
          'ReferenceError: ' +
          message +
          '\n\n' +
          'This error is located at:' +
          capturedErrorDefaults.componentStack;
        expect(exceptionData.message).toBe(formattedMessage);
        expect(exceptionData.originalMessage).toBe(message);
        expect(exceptionData.name).toBe(name);
        expect(exceptionData.componentStack).toBe(
          capturedErrorDefaults.componentStack,
        );
        expect(getLineFromFrame(exceptionData.stack[0])).toBe(
          "const error = new ReferenceError('Some error happened');",
        );
        expect(exceptionData.isFatal).toBe(false);
        expect(logToConsoleInReact).toBe(false);
        expect(console.error).toBeCalledWith(error);
      });

      test('does not pop frames off the stack with framesToPop', () => {
        function createError() {
          const error = new Error('Some error happened');
          // $FlowFixMe[prop-missing]
          error.framesToPop = 1;
          return error;
        }
        const error = createError();

        ReactFiberErrorDialog.showErrorDialog({
          ...capturedErrorDefaults,
          error,
        });

        let exceptionData;

        if (__DEV__) {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddException).toBeCalledTimes(1);
          exceptionData = logBoxAddException.mock.calls[0][0];
        } else {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
          exceptionData = nativeReportException.mock.calls[0][0];
        }
        expect(getLineFromFrame(exceptionData.stack[0])).toBe(
          "const error = new Error('Some error happened');",
        );
        expect(console.error).toBeCalledWith(error);
      });

      test('wraps string in an Error and sends to handleException', () => {
        const message = 'Some error happened';

        const logToConsoleInReact = ReactFiberErrorDialog.showErrorDialog({
          ...capturedErrorDefaults,
          error: message,
        });

        let exceptionData;

        if (__DEV__) {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddException).toBeCalledTimes(1);
          exceptionData = logBoxAddException.mock.calls[0][0];
        } else {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
          exceptionData = nativeReportException.mock.calls[0][0];
        }
        const formattedMessage =
          message +
          '\n\n' +
          'This error is located at:' +
          capturedErrorDefaults.componentStack;
        expect(exceptionData.message).toBe(formattedMessage);
        expect(exceptionData.originalMessage).toBe(message);
        expect(exceptionData.componentStack).toBe(
          capturedErrorDefaults.componentStack,
        );
        expect(exceptionData.stack[0].file).toMatch(
          /ReactFiberErrorDialog\.js$/,
        );
        expect(exceptionData.isFatal).toBe(false);
        expect(logToConsoleInReact).toBe(false);
        expect(console.error).toBeCalledTimes(1);
        // $FlowFixMe[prop-missing]
        expect(console.error.mock.calls[0][0]).toBeInstanceOf(
          ExceptionsManager.SyntheticError,
        );
        // $FlowFixMe[prop-missing]
        expect(console.error.mock.calls[0][0].toString()).toBe(message);
      });

      test('reports "Unspecified error" if error is null', () => {
        const logToConsoleInReact = ReactFiberErrorDialog.showErrorDialog({
          ...capturedErrorDefaults,
          error: null,
        });

        let exceptionData;

        if (__DEV__) {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddException).toBeCalledTimes(1);
          exceptionData = logBoxAddException.mock.calls[0][0];
        } else {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
          exceptionData = nativeReportException.mock.calls[0][0];
        }
        const formattedMessage =
          'Unspecified error' +
          '\n\n' +
          'This error is located at:' +
          capturedErrorDefaults.componentStack;
        expect(exceptionData.message).toBe(formattedMessage);
        expect(exceptionData.originalMessage).toBe('Unspecified error');
        expect(exceptionData.name).toBe(null);
        expect(exceptionData.componentStack).toBe(
          capturedErrorDefaults.componentStack,
        );
        expect(exceptionData.stack[0].file).toMatch(
          /ReactFiberErrorDialog\.js$/,
        );
        expect(exceptionData.isFatal).toBe(false);
        expect(logToConsoleInReact).toBe(false);
        expect(console.error).toBeCalledTimes(1);
        // $FlowFixMe[prop-missing]
        expect(console.error.mock.calls[0][0]).toBeInstanceOf(
          ExceptionsManager.SyntheticError,
        );
        // $FlowFixMe[prop-missing]
        expect(console.error.mock.calls[0][0].toString()).toBe(
          'Unspecified error',
        );
      });

      test('works with a frozen error object', () => {
        const error = Object.freeze(new Error('Some error happened'));

        ReactFiberErrorDialog.showErrorDialog({
          ...capturedErrorDefaults,
          error,
        });

        let exceptionData;

        if (__DEV__) {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddException).toBeCalledTimes(1);
          exceptionData = logBoxAddException.mock.calls[0][0];
        } else {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
          exceptionData = nativeReportException.mock.calls[0][0];
        }
        expect(getLineFromFrame(exceptionData.stack[0])).toBe(
          "const error = Object.freeze(new Error('Some error happened'));",
        );

        // No component stack.
        const formattedMessage = 'Error: ' + error.message;
        expect(exceptionData.message).toBe(formattedMessage);
        expect(console.error).toBeCalledWith(error);
      });

      test('does not mutate the message', () => {
        const error = new ReferenceError('Some error happened');
        const {message} = error;

        ReactFiberErrorDialog.showErrorDialog({
          ...capturedErrorDefaults,
          error,
        });

        let exceptionData;
        if (__DEV__) {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddException).toBeCalledTimes(1);
          exceptionData = logBoxAddException.mock.calls[0][0];
        } else {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
          expect(error.message).toBe(message);
          exceptionData = nativeReportException.mock.calls[0][0];
        }
        const formattedMessage =
          'ReferenceError: ' +
          message +
          '\n\n' +
          'This error is located at:' +
          capturedErrorDefaults.componentStack;
        expect(exceptionData.message).toBe(formattedMessage);
        expect(console.error).toBeCalledWith(error);
      });

      test('can safely process the same error multiple times', () => {
        const error = new ReferenceError('Some error happened');
        // Copy all the data we care about before any possible mutation.
        const {message} = error;
        const componentStacks = [
          '\n  in A\n  in B\n  in C',
          '\n  in X\n  in Y\n  in Z',
        ];
        for (const componentStack of componentStacks) {
          nativeReportException.mockClear();
          logBoxAddException.mockClear();
          logBoxAddConsoleLog.mockClear();
          const formattedMessage =
            'ReferenceError: ' +
            message +
            '\n\n' +
            'This error is located at:' +
            componentStack;
          const logToConsoleInReact = ReactFiberErrorDialog.showErrorDialog({
            ...capturedErrorDefaults,
            componentStack,
            error,
          });

          let exceptionData;

          if (__DEV__) {
            expect(logBoxAddConsoleLog).not.toBeCalled();
            expect(nativeReportException).not.toBeCalled();
            expect(logBoxAddException).toBeCalledTimes(1);
            exceptionData = logBoxAddException.mock.calls[0][0];
          } else {
            expect(logBoxAddConsoleLog).not.toBeCalled();
            expect(logBoxAddException).not.toBeCalled();
            expect(nativeReportException).toBeCalledTimes(1);
            exceptionData = nativeReportException.mock.calls[0][0];
          }
          expect(exceptionData.message).toBe(formattedMessage);
          expect(exceptionData.originalMessage).toBe(message);
          expect(exceptionData.componentStack).toBe(componentStack);
          expect(getLineFromFrame(exceptionData.stack[0])).toBe(
            "const error = new ReferenceError('Some error happened');",
          );
          expect(exceptionData.isFatal).toBe(false);
          expect(logToConsoleInReact).toBe(false);
          expect(console.error).toBeCalledWith(error);
        }
      });
    });

    describe('console.error handler', () => {
      let mockError: JestMockFn<$FlowFixMe, void>;
      beforeEach(() => {
        // NOTE: We initialise a fresh mock every time using spyOn, above.
        // We can't use `console._errorOriginal` for this, because that's a bound
        // (=wrapped) version of the mock and Jest does not approve.
        // $FlowFixMe[incompatible-type]
        mockError = console.error;
        ExceptionsManager.installConsoleErrorReporter();
      });

      afterEach(() => {
        // There is no uninstallConsoleErrorReporter. Do this so the next install
        // works.
        // $FlowFixMe[cannot-write]
        // $FlowFixMe[prop-missing]
        console.error = console._errorOriginal;
        // $FlowFixMe[prop-missing]
        delete console._errorOriginal;
        // $FlowFixMe[prop-missing]
        delete console.reportErrorsAsExceptions;
      });

      test('logging an Error', () => {
        const error = new Error('Some error happened');
        const {message, name} = error;

        console.error(error);

        let exceptionData;

        if (__DEV__) {
          // In DEV we only send the raw arguments to LogBox.
          // We do not include the the additional metadata.
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddConsoleLog).toBeCalledTimes(1);
          expect(logBoxAddConsoleLog.mock.calls[0][0]).toBe('error');
          expect(logBoxAddConsoleLog.mock.calls[0][1]).toBe(error);
        } else {
          expect(logBoxAddException).not.toBeCalled();
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
          exceptionData = nativeReportException.mock.calls[0][0];
          const formattedMessage = 'Error: ' + message;
          expect(exceptionData.message).toBe(formattedMessage);
          expect(exceptionData.originalMessage).toBe(message);
          expect(exceptionData.name).toBe(name);
          expect(getLineFromFrame(exceptionData.stack[0])).toBe(
            "const error = new Error('Some error happened');",
          );
          expect(exceptionData.isFatal).toBe(false);
        }

        expect(mockError.mock.calls[0]).toHaveLength(1);
        expect(mockError.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(mockError.mock.calls[0][0].toString()).toBe('Error: ' + message);
      });

      test('logging a string', () => {
        const message = 'Some error happened';

        console.error(message);

        let exceptionData;

        if (__DEV__) {
          // In DEV we only send the raw arguments to LogBox.
          // We do not include the the additional metadata.
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddConsoleLog).toBeCalledTimes(1);
          expect(logBoxAddConsoleLog.mock.calls[0][0]).toBe('error');
          expect(logBoxAddConsoleLog.mock.calls[0][1]).toBe(message);
        } else {
          expect(logBoxAddException).not.toBeCalled();
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
          exceptionData = nativeReportException.mock.calls[0][0];
          expect(exceptionData.message).toBe(
            'console.error: Some error happened',
          );
          expect(exceptionData.originalMessage).toBe('Some error happened');
          expect(exceptionData.name).toBe('console.error');
          expect(
            getLineFromFrame(getFirstFrameInThisFile(exceptionData.stack)),
          ).toBe('console.error(message);');
          expect(exceptionData.isFatal).toBe(false);
        }
        expect(mockError.mock.calls[0]).toEqual([message]);
      });

      test('logging arbitrary arguments', () => {
        const args = [42, true, Symbol(), {x: undefined, y: null}];

        console.error(...args);

        if (__DEV__) {
          // In DEV we only send the raw arguments to LogBox.
          // We do not include the the additional metadata.
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddConsoleLog).toBeCalledTimes(1);
          expect(logBoxAddConsoleLog.mock.calls[0][0]).toBe('error');
          // $FlowFixMe[incompatible-type]
          expect(logBoxAddConsoleLog.mock.calls[0][1]).toBe(...args);
        } else {
          expect(logBoxAddException).not.toBeCalled();
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
          const exceptionData = nativeReportException.mock.calls[0][0];
          expect(exceptionData.message).toBe(
            'console.error: 42 true ["symbol" failed to stringify] {"y":null}',
          );
          expect(exceptionData.originalMessage).toBe(
            '42 true ["symbol" failed to stringify] {"y":null}',
          );
          expect(exceptionData.name).toBe('console.error');
          expect(
            getLineFromFrame(getFirstFrameInThisFile(exceptionData.stack)),
          ).toBe('console.error(...args);');
          expect(exceptionData.isFatal).toBe(false);
        }

        expect(mockError).toBeCalledTimes(1);
        // Shallowly compare the mock call arguments with `args`
        expect(mockError.mock.calls[0]).toHaveLength(args.length);
        for (let i = 0; i < args.length; ++i) {
          expect(mockError.mock.calls[0][i]).toBe(args[i]);
        }
      });

      test('logging a warning', () => {
        const message = 'Warning: Some mild issue happened';

        console.error(message);

        if (__DEV__) {
          expect(logBoxAddException).not.toBeCalled();
          expect(logBoxAddConsoleLog).toBeCalledTimes(1);
          expect(logBoxAddConsoleLog.mock.calls[0][0]).toBe('error');
          expect(logBoxAddConsoleLog.mock.calls[0][1]).toBe(
            'Warning: Some mild issue happened',
          );
          expect(nativeReportException).not.toBeCalled();
          expect(mockError.mock.calls[0]).toEqual([message]);
        } else {
          expect(logBoxAddException).not.toBeCalled();
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(mockError.mock.calls[0]).toEqual([message]);
        }
      });

      test('logging a warning with more arguments', () => {
        const args = ['Warning: Some mild issue happened', 42];

        console.error(...args);

        if (__DEV__) {
          expect(logBoxAddException).not.toBeCalled();
          expect(logBoxAddConsoleLog).toBeCalledTimes(1);
          expect(logBoxAddConsoleLog.mock.calls[0][0]).toBe('error');
          expect(logBoxAddConsoleLog.mock.calls[0][1]).toBe(
            'Warning: Some mild issue happened',
          );
          expect(nativeReportException).not.toBeCalled();
          expect(mockError.mock.calls[0]).toEqual(args);
        } else {
          expect(logBoxAddException).not.toBeCalled();
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(mockError.mock.calls[0]).toEqual(args);
        }
      });

      test('logging a warning-looking object', () => {
        // Forces `strignifySafe` to invoke `toString()`.
        const object = {
          toString: () => 'Warning: Some error may have happened',
        };
        // $FlowFixMe[prop-missing]
        object.cycle = object;

        const args = [object];

        console.error(...args);

        if (__DEV__) {
          // In DEV we only send the raw arguments to LogBox.
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddConsoleLog).toBeCalledTimes(1);
          expect(logBoxAddConsoleLog.mock.calls[0][0]).toBe('error');
          expect(logBoxAddConsoleLog.mock.calls[0][1]).toBe(...args);
        } else {
          expect(logBoxAddException).not.toBeCalled();
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
        }
      });

      test('does not log "warn"-type errors', () => {
        const error = new Error('This is a warning.');
        // $FlowFixMe[prop-missing]
        error.type = 'warn';

        console.error(error);

        if (__DEV__) {
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddConsoleLog).toBeCalledTimes(1);
          expect(logBoxAddConsoleLog.mock.calls[0][0]).toBe('error');
          expect(logBoxAddConsoleLog.mock.calls[0][1]).toBe(error);
        } else {
          expect(logBoxAddException).not.toBeCalled();
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
        }
      });

      test('reportErrorsAsExceptions = false', () => {
        // $FlowFixMe[prop-missing]
        console.reportErrorsAsExceptions = false;
        const message = 'Some error happened';

        console.error(message);

        expect(logBoxAddException).not.toBeCalled();
        expect(logBoxAddConsoleLog).not.toBeCalled();
        expect(nativeReportException).not.toBeCalled();
        expect(mockError.mock.calls[0]).toEqual([message]);
      });

      test('does not pop frames off the stack with framesToPop', () => {
        function createError() {
          const error = new Error('Some error happened');
          // $FlowFixMe[prop-missing]
          error.framesToPop = 1;
          return error;
        }
        const error = createError();

        console.error(error);

        let exceptionData;

        if (__DEV__) {
          // In DEV we only send the raw arguments to LogBox.
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddConsoleLog).toBeCalledTimes(1);
          expect(logBoxAddConsoleLog.mock.calls[0][0]).toBe('error');
          expect(logBoxAddConsoleLog.mock.calls[0][1]).toBe(error);
        } else {
          expect(logBoxAddException).not.toBeCalled();
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException.mock.calls.length).toBe(1);
          exceptionData = nativeReportException.mock.calls[0][0];
          expect(getLineFromFrame(exceptionData.stack[0])).toBe(
            "const error = new Error('Some error happened');",
          );
        }
        expect(mockError.mock.calls[0][0]).toEqual(error);
      });
    });

    describe('handleException', () => {
      test('handling a fatal Error', () => {
        const error = new Error('Some error happened');
        const {message} = error;

        ExceptionsManager.handleException(error, true);

        let exceptionData;

        if (__DEV__) {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddException).toBeCalledTimes(1);
          exceptionData = logBoxAddException.mock.calls[0][0];
        } else {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
          exceptionData = nativeReportException.mock.calls[0][0];
        }
        const formattedMessage = 'Error: ' + message;
        expect(exceptionData.message).toBe(formattedMessage);
        expect(exceptionData.originalMessage).toBe(message);
        expect(exceptionData.name).toBe('Error');
        expect(getLineFromFrame(exceptionData.stack[0])).toBe(
          "const error = new Error('Some error happened');",
        );
        expect(exceptionData.isFatal).toBe(true);
        // $FlowFixMe[prop-missing]
        expect(console.error.mock.calls[0]).toHaveLength(1);
        // $FlowFixMe[prop-missing]
        expect(console.error.mock.calls[0][0]).toBe(error);
      });

      test('handling a non-fatal Error', () => {
        const error = new Error('Some error happened');
        const {message} = error;

        ExceptionsManager.handleException(error, false);

        let exceptionData;

        if (__DEV__) {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddException).toBeCalledTimes(1);
          exceptionData = logBoxAddException.mock.calls[0][0];
        } else {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
          exceptionData = nativeReportException.mock.calls[0][0];
        }
        const formattedMessage = 'Error: ' + message;
        expect(exceptionData.message).toBe(formattedMessage);
        expect(exceptionData.originalMessage).toBe(message);
        expect(exceptionData.name).toBe('Error');
        expect(getLineFromFrame(exceptionData.stack[0])).toBe(
          "const error = new Error('Some error happened');",
        );
        expect(exceptionData.isFatal).toBe(false);
        // $FlowFixMe[prop-missing]
        expect(console.error.mock.calls[0]).toHaveLength(1);
        // $FlowFixMe[prop-missing]
        expect(console.error.mock.calls[0][0]).toBe(error);
      });

      test('handling a thrown string', () => {
        const message = 'Some error happened';

        ExceptionsManager.handleException(message, true);

        let exceptionData;

        if (__DEV__) {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddException).toBeCalledTimes(1);
          exceptionData = logBoxAddException.mock.calls[0][0];
        } else {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
          exceptionData = nativeReportException.mock.calls[0][0];
        }
        expect(exceptionData.message).toBe(message);
        expect(exceptionData.originalMessage).toBe(null);
        expect(exceptionData.name).toBe(null);
        expect(exceptionData.stack[0].file).toMatch(/ExceptionsManager\.js$/);
        expect(exceptionData.isFatal).toBe(true);
        // $FlowFixMe[prop-missing]
        expect(console.error.mock.calls[0]).toHaveLength(1);
        // $FlowFixMe[prop-missing]
        expect(console.error.mock.calls[0][0]).toBeInstanceOf(
          ExceptionsManager.SyntheticError,
        );
        // $FlowFixMe[prop-missing]
        expect(console.error.mock.calls[0][0].toString()).toBe(message);
      });

      test('does not pop frames off the stack with framesToPop', () => {
        function createError() {
          const error = new Error('Some error happened');
          // $FlowFixMe[prop-missing]
          error.framesToPop = 1;
          return error;
        }
        const error = createError();

        ExceptionsManager.handleException(error, true);

        let exceptionData;

        if (__DEV__) {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddException).toBeCalledTimes(1);
          exceptionData = logBoxAddException.mock.calls[0][0];
        } else {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
          exceptionData = nativeReportException.mock.calls[0][0];
        }
        expect(getLineFromFrame(exceptionData.stack[0])).toBe(
          "const error = new Error('Some error happened');",
        );
        // $FlowFixMe[prop-missing]
        expect(console.error.mock.calls[0]).toHaveLength(1);
        // $FlowFixMe[prop-missing]
        expect(console.error.mock.calls[0][0]).toBe(error);
      });

      test('logs fatal "warn"-type errors', () => {
        const error = new Error('This is a fatal... warning?');
        // $FlowFixMe[prop-missing]
        error.type = 'warn';

        ExceptionsManager.handleException(error, true);

        if (__DEV__) {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddException).toBeCalledTimes(1);
        } else {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
        }
        // $FlowFixMe[prop-missing]
        expect(console.error.mock.calls[0]).toHaveLength(1);
        // $FlowFixMe[prop-missing]
        expect(console.error.mock.calls[0][0]).toBe(error);
      });
    });

    describe('unstable_setExceptionDecorator', () => {
      let mockConsoleError;
      beforeEach(() => {
        // NOTE: We initialise a fresh mock every time using spyOn, above.
        // We can't use `console._errorOriginal` for this, because that's a bound
        // (=wrapped) version of the mock and Jest does not approve.
        mockConsoleError = console.error;
        ExceptionsManager.installConsoleErrorReporter();
      });

      afterEach(() => {
        // There is no uninstallConsoleErrorReporter. Do this so the next install
        // works.
        // $FlowFixMe[cannot-write]
        // $FlowFixMe[prop-missing]
        console.error = console._errorOriginal;
        // $FlowFixMe[prop-missing]
        delete console._errorOriginal;
        // $FlowFixMe[prop-missing]
        delete console.reportErrorsAsExceptions;
      });

      test('modifying the exception data', () => {
        const error = new Error('Some error happened');
        const decorator = jest.fn().mockImplementation(data => ({
          ...data,
          message: 'decorated: ' + data.message,
        }));

        // Report the same exception with and without the decorator
        ExceptionsManager.handleException(error, true);
        ExceptionsManager.unstable_setExceptionDecorator(decorator);
        ExceptionsManager.handleException(error, true);

        expect(decorator.mock.calls.length).toBe(1);
        const beforeDecorator = decorator.mock.calls[0][0];

        let withoutDecoratorInstalled;
        let afterDecorator;

        if (__DEV__) {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddException).toBeCalledTimes(2);
          withoutDecoratorInstalled = logBoxAddException.mock.calls[0][0];
          afterDecorator = logBoxAddException.mock.calls[1][0];
        } else {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(2);
          withoutDecoratorInstalled = nativeReportException.mock.calls[0][0];
          afterDecorator = nativeReportException.mock.calls[1][0];
        }

        expect(afterDecorator.id).toEqual(beforeDecorator.id);

        // id will change between successive exceptions
        // $FlowFixMe[incompatible-type]
        delete withoutDecoratorInstalled.id;
        delete beforeDecorator.id;
        // $FlowFixMe[incompatible-type]
        delete afterDecorator.id;
        // $FlowFixMe[prop-missing]
        delete withoutDecoratorInstalled.isComponentError;
        // $FlowFixMe[prop-missing]
        delete afterDecorator.isComponentError;

        expect(withoutDecoratorInstalled).toEqual(beforeDecorator);
        expect(afterDecorator).toEqual({
          ...beforeDecorator,
          message: 'decorated: ' + beforeDecorator.message,
        });
        expect(mockConsoleError).toBeCalledTimes(2);
        // $FlowFixMe[prop-missing]
        expect(mockConsoleError.mock.calls[0][0]).toBe(error);
        // $FlowFixMe[prop-missing]
        expect(mockConsoleError.mock.calls[1][0]).toBe(error);
      });

      test('clearing a decorator', () => {
        const error = new Error('Some error happened');
        const decorator = jest.fn().mockImplementation(data => ({
          ...data,
          message: 'decorated: ' + data.message,
        }));

        ExceptionsManager.unstable_setExceptionDecorator(decorator);
        ExceptionsManager.unstable_setExceptionDecorator(null);
        ExceptionsManager.handleException(error, true);

        expect(decorator).not.toBeCalled();
        if (__DEV__) {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddException).toBeCalledTimes(1);
        } else {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
        }
        expect(mockConsoleError).toBeCalledTimes(1);
        // $FlowFixMe[prop-missing]
        expect(mockConsoleError.mock.calls[0][0]).toBe(error);
      });

      test('prevents decorator recursion from error handler', () => {
        const error = new Error('Some error happened');
        const decorator = jest.fn().mockImplementation(data => {
          console.error('Logging an error within the decorator');
          return {
            ...data,
            message: 'decorated: ' + data.message,
          };
        });

        ExceptionsManager.unstable_setExceptionDecorator(decorator);
        ExceptionsManager.handleException(error, true);

        if (__DEV__) {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddException).toBeCalledTimes(1);
          expect(logBoxAddException.mock.calls[0][0].message).toMatch(
            /decorated: .*Some error happened/,
          );
        } else {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
          expect(nativeReportException.mock.calls[0][0].message).toMatch(
            /decorated: .*Some error happened/,
          );
        }
        expect(mockConsoleError).toBeCalledTimes(2);
        // $FlowFixMe[prop-missing]
        expect(mockConsoleError.mock.calls[0][0]).toMatch(
          /Logging an error within the decorator/,
        );
        // $FlowFixMe[prop-missing]
        expect(mockConsoleError.mock.calls[1][0]).toBe(error);
      });

      test('prevents decorator recursion from console.error', () => {
        const error = new Error('Some error happened');
        const decorator = jest.fn().mockImplementation(data => {
          console.error('Logging an error within the decorator');
          return {
            ...data,
            message: 'decorated: ' + data.message,
          };
        });

        ExceptionsManager.unstable_setExceptionDecorator(decorator);
        console.error(error);

        if (__DEV__) {
          // In DEV we only send the raw arguments to LogBox.
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddConsoleLog).toBeCalledTimes(2);
          expect(logBoxAddConsoleLog.mock.calls[0][0]).toBe('error');
          expect(logBoxAddConsoleLog.mock.calls[0][1]).toBe(error);
          expect(logBoxAddConsoleLog.mock.calls[1][0]).toBe('error');
          expect(logBoxAddConsoleLog.mock.calls[1][1]).toBe(
            'Logging an error within the decorator',
          );
        } else {
          expect(logBoxAddException).not.toBeCalled();
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(2);
          expect(nativeReportException.mock.calls[0][0].message).toMatch(
            /Logging an error within the decorator/,
          );
          expect(nativeReportException.mock.calls[1][0].message).toMatch(
            /decorated: .*Some error happened/,
          );
        }
        expect(mockConsoleError).toBeCalledTimes(2);
        // console.error calls are chained without exception pre-processing, so decorator doesn't apply
        // $FlowFixMe[prop-missing]
        expect(mockConsoleError.mock.calls[0][0].toString()).toMatch(
          /Error: Some error happened/,
        );
        // $FlowFixMe[prop-missing]
        expect(mockConsoleError.mock.calls[1][0]).toMatch(
          /Logging an error within the decorator/,
        );
      });

      test('can handle throwing decorators recursion when exception is thrown', () => {
        const error = new Error('Some error happened');
        const decorator = jest.fn().mockImplementation(data => {
          throw new Error('Throwing an error within the decorator');
        });

        ExceptionsManager.unstable_setExceptionDecorator(decorator);
        ExceptionsManager.handleException(error, true);

        if (__DEV__) {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddException).toBeCalledTimes(1);
          // Exceptions in decorators are ignored and the decorator is not applied
          expect(logBoxAddException.mock.calls[0][0].message).toMatch(
            /Error: Some error happened/,
          );
        } else {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
          // Exceptions in decorators are ignored and the decorator is not applied
          expect(nativeReportException.mock.calls[0][0].message).toMatch(
            /Error: Some error happened/,
          );
        }
        expect(mockConsoleError).toBeCalledTimes(1);
        // $FlowFixMe[prop-missing]
        expect(mockConsoleError.mock.calls[0][0]).toBe(error);
      });

      test('can handle throwing decorators recursion when exception is logged', () => {
        const error = new Error('Some error happened');
        const decorator = jest.fn().mockImplementation(data => {
          throw new Error('Throwing an error within the decorator');
        });

        ExceptionsManager.unstable_setExceptionDecorator(decorator);
        console.error(error);

        if (__DEV__) {
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddConsoleLog).toBeCalledTimes(1);
          // Exceptions in decorators are ignored and the decorator is not applied
          expect(logBoxAddConsoleLog.mock.calls[0][0]).toBe('error');
          expect(logBoxAddConsoleLog.mock.calls[0][1]).toEqual(error);
        } else {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
          // Exceptions in decorators are ignored and the decorator is not applied
          expect(nativeReportException.mock.calls[0][0].message).toMatch(
            /Error: Some error happened/,
          );
        }
        expect(mockConsoleError).toBeCalledTimes(1);
        // $FlowFixMe[prop-missing]
        expect(mockConsoleError.mock.calls[0][0].toString()).toMatch(
          /Error: Some error happened/,
        );
      });
    });
    describe('Errors with custom extraData', () => {
      test('ExtendedErrors may pass custom extraData using the decoratedExtraDataKey symbol', () => {
        const error = new Error('Some error happened');
        // Annotates the error with some custom extra data.
        // $FlowFixMe[prop-missing]
        error[ExceptionsManager.decoratedExtraDataKey] = {foo: 'bar'};
        ExceptionsManager.handleException(error, true);

        if (__DEV__) {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(nativeReportException).not.toBeCalled();
          expect(logBoxAddException).toBeCalledTimes(1);
          expect(logBoxAddException.mock.calls[0][0].extraData?.foo).toBe(
            'bar',
          );
        } else {
          expect(logBoxAddConsoleLog).not.toBeCalled();
          expect(logBoxAddException).not.toBeCalled();
          expect(nativeReportException).toBeCalledTimes(1);
          expect(nativeReportException.mock.calls[0][0].extraData?.foo).toBe(
            'bar',
          );
        }
      });
    });
  });
}
const linesByFile = new Map<string, ReadonlyArray<string>>();

function getLineFromFrame({lineNumber /* 1-based */, file}: $FlowFixMe) {
  if (file == null) {
    return null;
  }
  const cleanedFile = cleanFileName(file);
  const lines =
    linesByFile.get(cleanedFile) ||
    fs.readFileSync(cleanedFile, 'utf8').split('\n');
  if (!linesByFile.has(cleanedFile)) {
    linesByFile.set(cleanedFile, lines);
  }
  return (lines[lineNumber - 1] || '').trim();
}

function getFirstFrameInThisFile(stack: $FlowFixMe) {
  return stack.find(({file}) => file.endsWith(path.basename(module.filename)));
}

// Works around a parseErrorStack bug involving `new X` stack frames.
function cleanFileName(file: string) {
  return file.replace(/^.+? \((?=\/)/, '');
}
