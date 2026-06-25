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

jest.mock('../../../Core/Devtools/parseErrorStack', () => {
  return {__esModule: true, default: jest.fn(() => [])};
});

jest.mock('../../../Core/ExceptionsManager');

const ExceptionsManager: any =
  require('../../../Core/ExceptionsManager').default;
const LogBoxData = require('../LogBoxData');

const registry = () => {
  const observer = jest.fn();
  LogBoxData.observe(observer).unsubscribe();
  return Array.from(observer.mock.calls[0][0].logs);
};

const filteredRegistry = () => {
  const observer = jest.fn();
  LogBoxData.observe(observer).unsubscribe();
  return Array.from(observer.mock.calls[0][0].logs);
};

const disabledState = () => {
  const observer = jest.fn();
  LogBoxData.observe(observer).unsubscribe();
  return observer.mock.calls[0][0].isDisabled;
};

const selectedLogIndex = () => {
  const observer = jest.fn();
  LogBoxData.observe(observer).unsubscribe();
  return observer.mock.calls[0][0].selectedLogIndex;
};

const observe = () => {
  const observer = jest.fn();
  return {
    observer,
    subscription: LogBoxData.observe(observer),
  };
};

const addLogs = (logs: Array<string>, options: void | {flush: boolean}) => {
  logs.forEach(message => {
    LogBoxData.addLog({
      level: 'warn',
      message: {
        content: message,
        substitutions: [],
      },
      category: message,
      componentStack: [],
    });
    if (options == null || options.flush !== false) {
      jest.runOnlyPendingTimers();
    }
  });
};

const addSoftErrors = (
  errors: Array<string>,
  options: void | {flush: boolean},
) => {
  errors.forEach(error => {
    LogBoxData.addException({
      message: '',
      isComponentError: false,
      originalMessage: '',
      name: 'console.error',
      componentStack: '',
      stack: [],
      id: 0,
      isFatal: false,
      ...(typeof error === 'string'
        ? {message: error, originalMessage: error}
        : error),
    });
    if (options == null || options.flush !== false) {
      jest.runOnlyPendingTimers();
    }
  });
};

const addFatalErrors = (
  errors: Array<$FlowFixMe>,
  options: void | {flush: boolean},
) => {
  errors.forEach(error => {
    LogBoxData.addException({
      message: '',
      isComponentError: false,
      originalMessage: '',
      name: 'console.error',
      componentStack: '',
      stack: [],
      id: 0,
      isFatal: true,
      ...(typeof error === 'string'
        ? {message: error, originalMessage: error}
        : error),
    });
    if (options == null || options.flush !== false) {
      // Errors include two timers, the second is for optimistic symbolication.
      jest.runOnlyPendingTimers();
      jest.runOnlyPendingTimers();
    }
  });
};

const addSyntaxError = (options: $FlowFixMe) => {
  addFatalErrors(
    [
      {
        message: `
  197 | });
  198 |
> 199 | export default CrashReactApp;
      | ^
  200 |`,
        originalMessage: `TransformError SyntaxError: /path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js: 'import' and 'export' may only appear at the top level (199:0)
  197 | });
  198 |
> 199 | export default CrashReactApp;
      | ^
  200 |`,
      },
    ],
    options,
  );
};

const flushToObservers = () => {
  // Observer updates are debounced and need to advance timers to flush.
  jest.runOnlyPendingTimers();
};

describe('LogBoxData', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
  });

  it('adds and dismisses logs', () => {
    addLogs(['A']);
    addSoftErrors(['B']);
    addFatalErrors(['C']);
    addSyntaxError();

    expect(registry().length).toBe(4);
    expect(registry()[0]).toBeDefined();
    expect(registry()[1]).toBeDefined();

    LogBoxData.dismiss(registry()[0]);
    expect(registry().length).toBe(3);
    LogBoxData.dismiss(registry()[0]);
    expect(registry().length).toBe(2);
    LogBoxData.dismiss(registry()[0]);
    expect(registry().length).toBe(1);
    LogBoxData.dismiss(registry()[0]);
    expect(registry().length).toBe(0);
    expect(registry()[0]).toBeUndefined();
  });

  it('clears all logs', () => {
    addLogs(['A', 'B']);
    addSoftErrors(['C', 'D']);
    addFatalErrors(['E', 'F']);
    addSyntaxError();

    expect(registry().length).toBe(7);
    expect(selectedLogIndex()).toBe(6); // Syntax error index.

    LogBoxData.clear();
    expect(registry().length).toBe(0);
    expect(selectedLogIndex()).toBe(-1); // Reset selected index.
  });

  it('clears only warnings', () => {
    addLogs(['A', 'B']);
    addSoftErrors(['C', 'D', 'E']);
    addSyntaxError();

    expect(registry().length).toBe(6);
    expect(selectedLogIndex()).toBe(5); // Syntax error index.

    LogBoxData.clearWarnings();
    expect(registry().length).toBe(4);
    expect(selectedLogIndex()).toBe(3); // New syntax error index.
  });

  it('clears errors and fatals, but not syntax errors.', () => {
    addLogs(['A', 'B']);
    addSoftErrors(['C', 'D', 'E']);
    addFatalErrors(['F']);
    addSyntaxError();

    expect(registry().length).toBe(7);
    expect(selectedLogIndex()).toBe(6); // Syntax error index.

    LogBoxData.clearErrors();
    expect(registry().length).toBe(3);
    expect(selectedLogIndex()).toBe(2); // New syntax error index.
  });

  it('clears all types except syntax errors', () => {
    addLogs(['A', 'B']);
    addSoftErrors(['C', 'D', 'E']);
    addFatalErrors(['F']);
    addSyntaxError();

    expect(registry().length).toBe(7);
    expect(selectedLogIndex()).toBe(6); // Syntax error index.

    LogBoxData.clearErrors();
    LogBoxData.clearWarnings();
    expect(registry().length).toBe(1);
    expect(selectedLogIndex()).toBe(0); // New syntax error index.
  });

  it('keeps logs in chronological order', () => {
    addLogs(['A'], {flush: false});
    addSoftErrors(['B'], {flush: false});
    addFatalErrors(['C'], {flush: false});

    // Flush logs manually.
    jest.runAllTimers();

    addLogs(['D']);

    let logs = registry();
    expect(logs.length).toBe(4);
    expect(logs[0].category).toEqual('A');
    expect(logs[1].category).toEqual('B');
    expect(logs[2].category).toEqual('C');
    expect(logs[3].category).toEqual('D');

    addLogs(['A']);

    // Expect `A` to be added to the end of the registry.
    logs = registry();
    expect(logs.length).toBe(5);
    expect(logs[0].category).toEqual('A');
    expect(logs[1].category).toEqual('B');
    expect(logs[2].category).toEqual('C');
    expect(logs[3].category).toEqual('D');
    expect(logs[4].category).toEqual('A');
  });

  it('sets the selectedLogIndex', () => {
    expect(selectedLogIndex()).toBe(-1);

    LogBoxData.setSelectedLog(1);

    expect(selectedLogIndex()).toBe(1);
  });

  it('does not set the selectedLogIndex for warnings', () => {
    addLogs(['A']);

    expect(selectedLogIndex()).toBe(-1);
  });

  it('does not set the selectedLogIndex for soft errors', () => {
    addSoftErrors(['A']);

    expect(selectedLogIndex()).toBe(-1);
  });

  it('sets the selectedLogIndex to the first fatal error (after symbolication)', () => {
    addFatalErrors(['A'], {flush: false});

    // Order maters for testing symbolication before timeout.
    jest.runOnlyPendingTimers(); // Trigger appendNewLog.
    jest.advanceTimersByTime(10); // Trigger symbolication but not timeout.
    jest.runAllTimers(); // Flush remaining.

    expect(selectedLogIndex()).toBe(0);

    addLogs(['B'], {flush: false});
    addFatalErrors(['C'], {flush: false});

    // Order maters for testing symbolication before timeout.
    jest.runOnlyPendingTimers(); // Trigger appendNewLogs.
    jest.advanceTimersByTime(10); // Trigger symbolication.
    jest.runAllTimers(); // Flush remaining.

    // This should still be 0 (the first fatal exception)
    // becuase it is the most likely source of the error.
    // If there are more exceptions after this, they
    // are likely caused by this original exception.
    expect(selectedLogIndex()).toBe(0);
  });

  it('sets the selectedLogIndex to the first fatal error (hitting timeout limit)', () => {
    addFatalErrors(['A'], {flush: false});

    // Order maters for testing timeout before symbolication.
    jest.runOnlyPendingTimers(); // Trigger appendNewLog.
    jest.advanceTimersByTime(1001); // Trigger OPTIMISTIC_WAIT_TIME timeout.
    jest.runAllTimers(); // Flush remaining.

    expect(selectedLogIndex()).toBe(0);

    addLogs(['B']);
    addFatalErrors(['C']);

    // Order maters for testing timeout before symbolication.
    jest.runOnlyPendingTimers(); // Trigger appendNewLogs.
    jest.advanceTimersByTime(1001); // Trigger OPTIMISTIC_WAIT_TIME timeout.
    jest.runAllTimers(); // Flush remaining.

    // This should still be 0 (the first fatal exception)
    // becuase it is the most likely source of the error.
    // If there are more exceptions after this, they
    // are likely caused by this original exception.
    expect(selectedLogIndex()).toBe(0);
  });

  it('sets the selectedLogIndex to the last syntax error', () => {
    addSyntaxError();

    expect(selectedLogIndex()).toBe(0);

    addLogs(['B']);
    addSyntaxError();

    expect(selectedLogIndex()).toBe(2);
  });

  it('keeps selectedLogIndex set to the syntax error even when a new fatal is added', () => {
    addSyntaxError();

    expect(selectedLogIndex()).toBe(0);

    addLogs(['B']);
    addFatalErrors(['C']);

    expect(selectedLogIndex()).toBe(0);
  });

  it('keeps selectedLogIndex set to the syntax error even when explicitly changed', () => {
    addSyntaxError();

    expect(selectedLogIndex()).toBe(0);

    LogBoxData.setSelectedLog(1);

    expect(selectedLogIndex()).toBe(0);
  });

  it('increments the count of previous log with matching category (logs)', () => {
    addLogs(['A', 'B']);

    let logs = registry();
    expect(logs.length).toBe(2);
    expect(logs[0].category).toEqual('A');
    expect(logs[0].count).toBe(1);
    expect(logs[1].category).toEqual('B');
    expect(logs[1].count).toBe(1);

    addLogs(['B']);

    // Expect `B` to be rolled into the last log.
    logs = registry();
    expect(logs.length).toBe(2);
    expect(logs[0].category).toEqual('A');
    expect(logs[0].count).toBe(1);
    expect(logs[1].category).toEqual('B');
    expect(logs[1].count).toBe(2);
  });

  it('increments the count of previous log with matching category (errors)', () => {
    addFatalErrors(['A', 'B']);

    let logs = registry();
    expect(logs.length).toBe(2);
    expect(logs[0].category).toEqual('A');
    expect(logs[0].count).toBe(1);
    expect(logs[1].category).toEqual('B');
    expect(logs[1].count).toBe(1);

    addSoftErrors(['B']);

    // Expect `B` to be rolled into the last log.
    logs = registry();
    expect(logs.length).toBe(2);
    expect(logs[0].category).toEqual('A');
    expect(logs[0].count).toBe(1);
    expect(logs[1].category).toEqual('B');
    expect(logs[1].count).toBe(2);
  });

  it('increments the count of previous log with matching category (syntax)', () => {
    addSyntaxError();

    let logs = registry();
    expect(logs.length).toBe(1);
    expect(logs[0].count).toBe(1);

    addSyntaxError();

    logs = registry();
    expect(logs.length).toBe(1);
    expect(logs[0].count).toBe(2);
  });

  it('adding same pattern multiple times', () => {
    expect(LogBoxData.getIgnorePatterns().length).toBe(0);
    LogBoxData.addIgnorePatterns(['abc']);
    expect(LogBoxData.getIgnorePatterns().length).toBe(1);
    LogBoxData.addIgnorePatterns([/abc/]);
    expect(LogBoxData.getIgnorePatterns().length).toBe(2);
    LogBoxData.addIgnorePatterns(['abc']);
    expect(LogBoxData.getIgnorePatterns().length).toBe(2);
    LogBoxData.addIgnorePatterns([/abc/]);
    expect(LogBoxData.getIgnorePatterns().length).toBe(2);
  });

  it('adding duplicated patterns', () => {
    expect(LogBoxData.getIgnorePatterns().length).toBe(0);
    LogBoxData.addIgnorePatterns(['abc', /ab/, /abc/, /abc/, 'abc']);
    expect(LogBoxData.getIgnorePatterns().length).toBe(3);
    LogBoxData.addIgnorePatterns([/ab/, /abc/]);
    expect(LogBoxData.getIgnorePatterns().length).toBe(3);
  });

  it('ignores logs matching patterns (logs)', () => {
    addLogs(['A!', 'B?', 'C!']);

    expect(filteredRegistry().length).toBe(3);

    LogBoxData.addIgnorePatterns(['!']);
    expect(filteredRegistry().length).toBe(1);

    LogBoxData.addIgnorePatterns(['?']);
    expect(filteredRegistry().length).toBe(0);
  });

  it('ignores logs matching patterns (errors)', () => {
    addSoftErrors(['A!', 'B?']);
    addFatalErrors(['C!']);

    expect(filteredRegistry().length).toBe(3);

    LogBoxData.addIgnorePatterns(['!']);
    expect(filteredRegistry().length).toBe(1);

    LogBoxData.addIgnorePatterns(['?']);
    expect(filteredRegistry().length).toBe(0);
  });

  it('ignores matching regexs or pattern (logs)', () => {
    addLogs(['There are 4 dogs', 'There are 3 cats', 'There are H cats']);

    expect(filteredRegistry().length).toBe(3);

    LogBoxData.addIgnorePatterns(['dogs']);
    expect(filteredRegistry().length).toBe(2);

    LogBoxData.addIgnorePatterns([/There are \d+ cats/]);
    expect(filteredRegistry().length).toBe(1);

    LogBoxData.addIgnorePatterns(['cats']);
    expect(filteredRegistry().length).toBe(0);
  });

  it('ignores matching regexs or pattern (errors)', () => {
    addSoftErrors(['There are 4 dogs', 'There are 3 cats']);
    addFatalErrors(['There are H cats']);

    expect(filteredRegistry().length).toBe(3);

    LogBoxData.addIgnorePatterns(['dogs']);
    expect(filteredRegistry().length).toBe(2);

    LogBoxData.addIgnorePatterns([/There are \d+ cats/]);
    expect(filteredRegistry().length).toBe(1);

    LogBoxData.addIgnorePatterns(['cats']);
    expect(filteredRegistry().length).toBe(0);
  });

  it('ignores all logs except fatals when disabled', () => {
    addLogs(['A!']);
    addSoftErrors(['B?']);
    addFatalErrors(['C!']);
    addSyntaxError();

    expect(registry().length).toBe(4);
    expect(disabledState()).toBe(false);

    LogBoxData.setDisabled(true);
    expect(registry().length).toBe(4);
    expect(disabledState()).toBe(true);

    LogBoxData.setDisabled(false);
    expect(registry().length).toBe(4);
    expect(disabledState()).toBe(false);
  });

  it('immediately updates new observers', () => {
    const {observer: observerOne} = observe();

    expect(observerOne.mock.calls.length).toBe(1);

    const observerTwo = jest.fn();
    LogBoxData.observe(observerTwo).unsubscribe();
    expect(observerTwo.mock.calls.length).toBe(1);
    expect(observerOne.mock.calls[0][0]).toEqual(observerTwo.mock.calls[0][0]);
  });

  it('sends batched updates asynchronously', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    addLogs(['A']);
    flushToObservers();
    expect(observer.mock.calls.length).toBe(2);

    // We expect observers to receive the same Set object in sequential updates
    // so that it doesn't break memoization for components observing state.
    expect(observer.mock.calls[0][0].logs).toBe(observer.mock.calls[1][0].logs);
  });

  it('stops sending updates to unsubscribed observers', () => {
    const {observer: observerOne, subscription} = observe();
    subscription.unsubscribe();

    expect(observerOne.mock.calls.length).toBe(1);

    const observerTwo = jest.fn();
    LogBoxData.observe(observerTwo).unsubscribe();
    expect(observerTwo.mock.calls.length).toBe(1);
    expect(observerOne.mock.calls[0][0]).toEqual(observerTwo.mock.calls[0][0]);
  });

  it('updates observers when a log is added or dismissed', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    addLogs(['A']);
    flushToObservers();
    expect(observer.mock.calls.length).toBe(2);

    const lastLog = Array.from(observer.mock.calls[1][0].logs)[0];
    LogBoxData.dismiss(lastLog);
    flushToObservers();
    expect(observer.mock.calls.length).toBe(3);

    // Does nothing when category does not exist.
    LogBoxData.dismiss(lastLog);
    flushToObservers();
    expect(observer.mock.calls.length).toBe(3);
  });

  it('updates observers when cleared', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    addLogs(['A']);
    flushToObservers();
    expect(observer.mock.calls.length).toBe(2);

    LogBoxData.clear();
    flushToObservers();
    expect(observer.mock.calls.length).toBe(3);

    // Does nothing when already empty.
    LogBoxData.clear();
    flushToObservers();
    expect(observer.mock.calls.length).toBe(3);
  });

  it('updates observers when warnings cleared', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    addLogs(['A']);
    flushToObservers();
    addSoftErrors(['B']);
    flushToObservers();
    addFatalErrors(['C']);
    flushToObservers();
    addSyntaxError();
    flushToObservers();
    expect(observer.mock.calls.length).toBe(5);

    LogBoxData.clearWarnings();
    flushToObservers();
    expect(observer.mock.calls.length).toBe(6);

    // Does nothing when already empty.
    LogBoxData.clearWarnings();
    flushToObservers();
    expect(observer.mock.calls.length).toBe(6);
  });

  it('updates observers when errors cleared', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    addLogs(['A']);
    flushToObservers();
    addSoftErrors(['B']);
    flushToObservers();
    addFatalErrors(['C']);
    flushToObservers();
    addSyntaxError();
    flushToObservers();
    expect(observer.mock.calls.length).toBe(5);

    LogBoxData.clearErrors();
    flushToObservers();
    expect(observer.mock.calls.length).toBe(6);

    // Does nothing when already empty.
    LogBoxData.clearErrors();
    flushToObservers();
    expect(observer.mock.calls.length).toBe(6);
  });

  it('updates observers when an ignore pattern is added', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    LogBoxData.addIgnorePatterns(['?']);
    flushToObservers();
    expect(observer.mock.calls.length).toBe(2);

    LogBoxData.addIgnorePatterns(['!']);
    flushToObservers();
    expect(observer.mock.calls.length).toBe(3);

    // Does nothing for an existing ignore pattern.
    LogBoxData.addIgnorePatterns(['!']);
    flushToObservers();
    expect(observer.mock.calls.length).toBe(3);
  });

  it('updates observers when disabled or enabled', () => {
    const {observer} = observe();
    expect(observer.mock.calls.length).toBe(1);

    LogBoxData.setDisabled(true);
    flushToObservers();
    expect(observer.mock.calls.length).toBe(2);

    // Does nothing when already disabled.
    LogBoxData.setDisabled(true);
    flushToObservers();
    expect(observer.mock.calls.length).toBe(2);

    LogBoxData.setDisabled(false);
    flushToObservers();
    expect(observer.mock.calls.length).toBe(3);

    // Does nothing when already enabled.
    LogBoxData.setDisabled(false);
    flushToObservers();
    expect(observer.mock.calls.length).toBe(3);
  });

  it('reportLogBoxError creates a native redbox with a componentStack', () => {
    LogBoxData.reportLogBoxError(
      /* $FlowFixMe[class-object-subtyping] added when improving typing for
       * this parameters */
      // $FlowFixMe[incompatible-type]
      new Error('Simulated Error'),
      '    in Component (file.js:1)',
    );

    const receivedError = ExceptionsManager.handleException.mock.calls[0][0];
    expect(receivedError.componentStack).toBe('    in Component (file.js:1)');
    expect(receivedError.message).toBe(
      'An error was thrown when attempting to render log messages via LogBox.\n\nSimulated Error',
    );
  });

  it('reportLogBoxError creates a native redbox without a componentStack', () => {
    /* $FlowFixMe[class-object-subtyping] added when improving typing for this
     * parameters */
    // $FlowFixMe[incompatible-type]
    LogBoxData.reportLogBoxError(new Error('Simulated Error'));

    const receivedError = ExceptionsManager.handleException.mock.calls[0][0];
    expect(receivedError.componentStack).toBeUndefined();
    expect(receivedError.message).toBe(
      'An error was thrown when attempting to render log messages via LogBox.\n\nSimulated Error',
    );
  });

  it('reportLogBoxError creates an error message that is also ignored', () => {
    /* $FlowFixMe[class-object-subtyping] added when improving typing for this
     * parameters */
    // $FlowFixMe[incompatible-type]
    LogBoxData.reportLogBoxError(new Error('Simulated Error'));

    const receivedErrorMessage =
      ExceptionsManager.handleException.mock.calls[0][0].message;

    expect(LogBoxData.isLogBoxErrorMessage(receivedErrorMessage)).toBe(true);
    expect(LogBoxData.isLogBoxErrorMessage('Some other error')).toBe(false);
  });

  it('getAppInfo returns null without any function registered', () => {
    expect(LogBoxData.getAppInfo()).toBe(null);
  });

  it('getAppInfo returns the registered app info', () => {
    const info = {
      appVersion: 'App Version',
      engine: 'Hermes',
    };

    LogBoxData.setAppInfo(() => info);
    expect(LogBoxData.getAppInfo()).toBe(info);
  });

  describe('Performance tracing suppression', () => {
    let mockIsTracing: () => boolean;
    let mockSubscribeCallback: ((isTracing: boolean) => void) | null = null;

    beforeEach(() => {
      mockIsTracing = jest.fn(() => false);
      mockSubscribeCallback = null;

      jest.doMock(
        '../../../../src/private/devsupport/rndevtools/TracingStateObserver',
        () => ({
          __esModule: true,
          default: {
            isTracing: () => mockIsTracing(),
            subscribe: (callback: (isTracing: boolean) => void) => {
              mockSubscribeCallback = callback;
              return () => {
                mockSubscribeCallback = null;
              };
            },
          },
        }),
      );

      jest.resetModules();
    });

    afterEach(() => {
      jest.unmock(
        '../../../../src/private/devsupport/rndevtools/TracingStateObserver',
      );
    });

    it('suppresses logs when performance tracing is active', () => {
      const LogBoxDataWithMock = require('../LogBoxData');

      LogBoxDataWithMock.addLog({
        level: 'warn',
        message: {content: 'Before tracing', substitutions: []},
        category: 'before-tracing',
        componentStack: [],
      });
      jest.runOnlyPendingTimers();

      const observerBefore = jest.fn();
      LogBoxDataWithMock.observe(observerBefore).unsubscribe();
      expect(Array.from(observerBefore.mock.calls[0][0].logs).length).toBe(1);

      mockIsTracing = jest.fn(() => true);

      LogBoxDataWithMock.addLog({
        level: 'warn',
        message: {content: 'During tracing', substitutions: []},
        category: 'during-tracing',
        componentStack: [],
      });
      jest.runOnlyPendingTimers();

      const observerDuring = jest.fn();
      LogBoxDataWithMock.observe(observerDuring).unsubscribe();
      expect(Array.from(observerDuring.mock.calls[0][0].logs).length).toBe(1);
    });

    it('suppresses exceptions when performance tracing is active', () => {
      const LogBoxDataWithMock = require('../LogBoxData');

      LogBoxDataWithMock.addException({
        message: 'Before tracing exception',
        isComponentError: false,
        originalMessage: 'Before tracing exception',
        name: 'console.error',
        componentStack: '',
        stack: [],
        id: 0,
        isFatal: false,
      });
      jest.runOnlyPendingTimers();

      const observerBefore = jest.fn();
      LogBoxDataWithMock.observe(observerBefore).unsubscribe();
      expect(Array.from(observerBefore.mock.calls[0][0].logs).length).toBe(1);

      mockIsTracing = jest.fn(() => true);

      LogBoxDataWithMock.addException({
        message: 'During tracing exception',
        isComponentError: false,
        originalMessage: 'During tracing exception',
        name: 'console.error',
        componentStack: '',
        stack: [],
        id: 1,
        isFatal: false,
      });
      jest.runOnlyPendingTimers();

      const observerDuring = jest.fn();
      LogBoxDataWithMock.observe(observerDuring).unsubscribe();
      expect(Array.from(observerDuring.mock.calls[0][0].logs).length).toBe(1);
    });

    it('clears logs when tracing starts', () => {
      const LogBoxDataWithMock = require('../LogBoxData');

      LogBoxDataWithMock.addLog({
        level: 'warn',
        message: {content: 'Log 1', substitutions: []},
        category: 'log-1',
        componentStack: [],
      });
      LogBoxDataWithMock.addLog({
        level: 'warn',
        message: {content: 'Log 2', substitutions: []},
        category: 'log-2',
        componentStack: [],
      });
      jest.runOnlyPendingTimers();

      const observerBefore = jest.fn();
      LogBoxDataWithMock.observe(observerBefore).unsubscribe();
      expect(Array.from(observerBefore.mock.calls[0][0].logs).length).toBe(2);

      if (mockSubscribeCallback) {
        mockSubscribeCallback(true);
      }
      jest.runOnlyPendingTimers();

      const observerAfter = jest.fn();
      LogBoxDataWithMock.observe(observerAfter).unsubscribe();
      expect(Array.from(observerAfter.mock.calls[0][0].logs).length).toBe(0);
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });
});
