/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {ExtendedError} from '../../Core/ExtendedError';
import type {LogLevel} from './LogBoxLog';
import type {Stack} from './LogBoxSymbolication';
import type {Category, ExtendedExceptionData, Message} from './parseLogBoxLog';

import DebuggerSessionObserver from '../../../src/private/devsupport/rndevtools/FuseboxSessionObserver';
import TracingStateObserver from '../../../src/private/devsupport/rndevtools/TracingStateObserver';
import toExtendedError from '../../../src/private/utilities/toExtendedError';
import parseErrorStack from '../../Core/Devtools/parseErrorStack';
import NativeLogBox from '../../NativeModules/specs/NativeLogBox';
import LogBoxLog from './LogBoxLog';
import {parseLogBoxException} from './parseLogBoxLog';
import * as React from 'react';

export type LogBoxLogs = Set<LogBoxLog>;
export type LogData = Readonly<{
  level: LogLevel,
  message: Message,
  category: Category,
  componentStack: Stack,
  stack?: string,
}>;

export type Observer = (
  Readonly<{
    logs: LogBoxLogs,
    isDisabled: boolean,
    selectedLogIndex: number,
  }>,
) => void;

export type IgnorePattern = string | RegExp;

export type Subscription = Readonly<{
  unsubscribe: () => void,
}>;

export type WarningInfo = {
  finalFormat: string,
  forceDialogImmediately: boolean,
  suppressDialog_LEGACY: boolean,
  suppressCompletely: boolean,
  monitorEvent: string | null,
  monitorListVersion: number,
  monitorSampleRate: number,
};

export type WarningFilter = (format: string) => WarningInfo;

type AppInfo = Readonly<{
  appVersion: string,
  engine: string,
  onPress?: ?() => void,
}>;

const observers: Set<{observer: Observer, ...}> = new Set();
const ignorePatterns: Set<IgnorePattern> = new Set();
let appInfo: ?() => AppInfo = null;
let logs: LogBoxLogs = new Set();
let updateTimeout: $FlowFixMe | null = null;
let _isDisabled = false;
let _selectedIndex = -1;
let hasShownFuseboxWarningsMigrationMessage = false;
let hostTargetSessionObserverSubscription = null;
let tracingStateObserverSubscription = null;

let warningFilter: WarningFilter = function (format) {
  return {
    finalFormat: format,
    forceDialogImmediately: false,
    suppressDialog_LEGACY: false,
    suppressCompletely: false,
    monitorEvent: 'warning_unhandled',
    monitorListVersion: 0,
    monitorSampleRate: 1,
  };
};

const LOGBOX_ERROR_MESSAGE =
  'An error was thrown when attempting to render log messages via LogBox.';

function getNextState() {
  return {
    logs,
    isDisabled: _isDisabled,
    selectedLogIndex: _selectedIndex,
  };
}

export function reportLogBoxError(
  error: ExtendedError,
  componentStack?: string,
): void {
  const ExceptionsManager = require('../../Core/ExceptionsManager').default;

  error.message = `${LOGBOX_ERROR_MESSAGE}\n\n${error.message}`;
  if (componentStack != null) {
    error.componentStack = componentStack;
  }
  ExceptionsManager.handleException(error, /* isFatal */ true);
}

export function isLogBoxErrorMessage(message: string): boolean {
  return typeof message === 'string' && message.includes(LOGBOX_ERROR_MESSAGE);
}

export function isMessageIgnored(message: string): boolean {
  for (const pattern of ignorePatterns) {
    if (
      (pattern instanceof RegExp && pattern.test(message)) ||
      (typeof pattern === 'string' && message.includes(pattern))
    ) {
      return true;
    }
  }
  return false;
}

function handleUpdate(): void {
  if (updateTimeout == null) {
    updateTimeout = setImmediate(() => {
      updateTimeout = null;
      const nextState = getNextState();
      observers.forEach(({observer}) => observer(nextState));
    });
  }
}

function appendNewLog(newLog: LogBoxLog) {
  // Don't want store these logs because they trigger a
  // state update when we add them to the store.
  if (isMessageIgnored(newLog.message.content)) {
    return;
  }

  // If the next log has the same category as the previous one
  // then roll it up into the last log in the list by incrementing
  // the count (similar to how Chrome does it).
  const lastLog = Array.from(logs).pop();
  if (lastLog && lastLog.category === newLog.category) {
    lastLog.incrementCount();
    handleUpdate();
    return;
  }

  if (newLog.level === 'fatal') {
    // If possible, to avoid jank, we don't want to open the error before
    // it's symbolicated. To do that, we optimistically wait for
    // symbolication for up to a second before adding the log.
    const OPTIMISTIC_WAIT_TIME = 1000;

    let addPendingLog: ?() => void = () => {
      logs.add(newLog);
      if (_selectedIndex < 0) {
        setSelectedLog(logs.size - 1);
      } else {
        handleUpdate();
      }
      addPendingLog = null;
    };

    const optimisticTimeout = setTimeout(() => {
      if (addPendingLog) {
        addPendingLog();
      }
    }, OPTIMISTIC_WAIT_TIME);

    newLog.symbolicate(status => {
      if (addPendingLog && status !== 'PENDING') {
        addPendingLog();
        clearTimeout(optimisticTimeout);
      } else if (status !== 'PENDING') {
        // The log has already been added but we need to trigger a render.
        handleUpdate();
      }
    });
  } else if (newLog.level === 'syntax') {
    logs.add(newLog);
    setSelectedLog(logs.size - 1);
  } else {
    logs.add(newLog);
    handleUpdate();
  }
}

export function addLog(log: LogData): void {
  if (hostTargetSessionObserverSubscription == null) {
    hostTargetSessionObserverSubscription = DebuggerSessionObserver.subscribe(
      hasActiveSession => {
        if (hasActiveSession) {
          clearWarnings();
        } else {
          // Reset the flag so that we can show the message again if new warning was emitted
          hasShownFuseboxWarningsMigrationMessage = false;
        }
      },
    );
  }

  if (tracingStateObserverSubscription == null) {
    tracingStateObserverSubscription = TracingStateObserver.subscribe(
      isTracing => {
        if (isTracing) {
          clear();
        }
      },
    );
  }

  if (TracingStateObserver.isTracing()) {
    return;
  }

  // If Host has Fusebox support
  if (log.level === 'warn' && global.__FUSEBOX_HAS_FULL_CONSOLE_SUPPORT__) {
    // And there is no active debugging session
    if (!DebuggerSessionObserver.hasActiveSession()) {
      showFuseboxWarningsMigrationMessageOnce();
    }

    // Don't show LogBox warnings when Host has active debugging session
    return;
  }

  const errorForStackTrace = new Error();

  // Parsing logs are expensive so we schedule this
  // otherwise spammy logs would pause rendering.
  setImmediate(() => {
    try {
      const stack = parseErrorStack(log.stack ?? errorForStackTrace?.stack);

      appendNewLog(
        new LogBoxLog({
          level: log.level,
          message: log.message,
          isComponentError: false,
          stack,
          category: log.category,
          componentStack: log.componentStack,
        }),
      );
    } catch (error: unknown) {
      reportLogBoxError(toExtendedError(error));
    }
  });
}

export function addException(error: ExtendedExceptionData): void {
  if (TracingStateObserver.isTracing()) {
    return;
  }

  // Parsing logs are expensive so we schedule this
  // otherwise spammy logs would pause rendering.
  setImmediate(() => {
    try {
      appendNewLog(new LogBoxLog(parseLogBoxException(error)));
    } catch (loggingError: unknown) {
      reportLogBoxError(toExtendedError(loggingError));
    }
  });
}

export function symbolicateLogNow(log: LogBoxLog) {
  log.symbolicate(() => {
    handleUpdate();
  });
}

export function retrySymbolicateLogNow(log: LogBoxLog) {
  log.retrySymbolicate(() => {
    handleUpdate();
  });
}

export function symbolicateLogLazy(log: LogBoxLog) {
  log.symbolicate();
}

export function clear(): void {
  if (logs.size > 0) {
    logs = new Set();
    setSelectedLog(-1);
  }
}

export function setSelectedLog(proposedNewIndex: number): void {
  const oldIndex = _selectedIndex;
  let newIndex = proposedNewIndex;

  const logArray = Array.from(logs);
  let index = logArray.length - 1;
  while (index >= 0) {
    // The latest syntax error is selected and displayed before all other logs.
    if (logArray[index].level === 'syntax') {
      newIndex = index;
      break;
    }
    index -= 1;
  }
  _selectedIndex = newIndex;
  handleUpdate();
  if (NativeLogBox) {
    setTimeout(() => {
      if (oldIndex < 0 && newIndex >= 0) {
        NativeLogBox.show();
      } else if (oldIndex >= 0 && newIndex < 0) {
        NativeLogBox.hide();
      }
    }, 0);
  }
}

export function clearWarnings(): void {
  const newLogs = Array.from(logs).filter(log => log.level !== 'warn');
  if (newLogs.length !== logs.size) {
    logs = new Set(newLogs);
    setSelectedLog(-1);
    handleUpdate();
  }
}

export function clearErrors(): void {
  const newLogs = Array.from(logs).filter(
    log => log.level !== 'error' && log.level !== 'fatal',
  );
  if (newLogs.length !== logs.size) {
    logs = new Set(newLogs);
    setSelectedLog(-1);
  }
}

export function dismiss(log: LogBoxLog): void {
  if (logs.has(log)) {
    logs.delete(log);
    handleUpdate();
  }
}

export function setWarningFilter(filter: WarningFilter): void {
  warningFilter = filter;
}

export function setAppInfo(info: () => AppInfo): void {
  appInfo = info;
}

export function getAppInfo(): ?AppInfo {
  return appInfo != null ? appInfo() : null;
}

export function checkWarningFilter(format: string): WarningInfo {
  return warningFilter(format);
}

export function getIgnorePatterns(): ReadonlyArray<IgnorePattern> {
  return Array.from(ignorePatterns);
}

export function addIgnorePatterns(
  patterns: ReadonlyArray<IgnorePattern>,
): void {
  const existingSize = ignorePatterns.size;
  // The same pattern may be added multiple times, but adding a new pattern
  // can be expensive so let's find only the ones that are new.
  patterns.forEach((pattern: IgnorePattern) => {
    if (pattern instanceof RegExp) {
      for (const existingPattern of ignorePatterns) {
        if (
          existingPattern instanceof RegExp &&
          existingPattern.toString() === pattern.toString()
        ) {
          return;
        }
      }
      ignorePatterns.add(pattern);
    }
    ignorePatterns.add(pattern);
  });
  if (ignorePatterns.size === existingSize) {
    return;
  }
  // We need to recheck all of the existing logs.
  // This allows adding an ignore pattern anywhere in the codebase.
  // Without this, if you ignore a pattern after the a log is created,
  // then we would keep showing the log.
  logs = new Set(
    Array.from(logs).filter(log => !isMessageIgnored(log.message.content)),
  );
  handleUpdate();
}

export function setDisabled(value: boolean): void {
  if (value === _isDisabled) {
    return;
  }
  _isDisabled = value;
  handleUpdate();
}

export function isDisabled(): boolean {
  return _isDisabled;
}

export function observe(observer: Observer): Subscription {
  const subscription = {observer};
  observers.add(subscription);

  observer(getNextState());

  return {
    unsubscribe(): void {
      observers.delete(subscription);
    },
  };
}

/**
 * Same as observe(), but doesn't call notify observer sync at the time of subscription.
 * Expected to be used only in LogBoxStateSubscription.
 */
function observeNext(observer: Observer): Subscription {
  const subscription = {observer};
  observers.add(subscription);

  return {
    unsubscribe(): void {
      observers.delete(subscription);
    },
  };
}

type LogBoxStateSubscriptionProps = Readonly<{}>;
type LogBoxStateSubscriptionState = Readonly<{
  logs: LogBoxLogs,
  isDisabled: boolean,
  hasError: boolean,
  selectedLogIndex: number,
}>;

type SubscribedComponent = React.ComponentType<
  Readonly<{
    logs: ReadonlyArray<LogBoxLog>,
    isDisabled: boolean,
    selectedLogIndex: number,
  }>,
>;

export function withSubscription(
  WrappedComponent: SubscribedComponent,
): React.ComponentType<{}> {
  class LogBoxStateSubscription extends React.Component<
    LogBoxStateSubscriptionProps,
    LogBoxStateSubscriptionState,
  > {
    static getDerivedStateFromError(): {hasError: boolean} {
      return {hasError: true};
    }

    componentDidCatch(err: Error, errorInfo: {componentStack: string, ...}) {
      /* $FlowFixMe[class-object-subtyping] added when improving typing for
       * this parameters */
      // $FlowFixMe[incompatible-type]
      reportLogBoxError(err, errorInfo.componentStack);
    }

    _subscription: ?Subscription;
    _updateStateOnMountTimeoutId: ?TimeoutID;

    state: LogBoxStateSubscriptionState = {
      hasError: false,
      ...getNextState(),
    };

    render(): React.Node {
      if (this.state.hasError) {
        // This happens when the component failed to render, in which case we delegate to the native redbox.
        // We can't show anyback fallback UI here, because the error may be with <View> or <Text>.
        return null;
      }

      return (
        <WrappedComponent
          logs={Array.from(this.state.logs)}
          isDisabled={this.state.isDisabled}
          selectedLogIndex={this.state.selectedLogIndex}
        />
      );
    }

    componentDidMount(): void {
      this._subscription = observeNext(data => {
        this.setState(data);
      });

      /**
       * This should cover the case when the state changes in between the first render and mount effect.
       * We defer the state update to next task to avoid cascading update.
       */
      this._updateStateOnMountTimeoutId = setTimeout(() => {
        this._updateStateOnMountTimeoutId = null;
        this.setState(getNextState());
      }, 0);
    }

    componentWillUnmount(): void {
      if (this._updateStateOnMountTimeoutId != null) {
        clearTimeout(this._updateStateOnMountTimeoutId);
      }

      if (this._subscription != null) {
        this._subscription.unsubscribe();
      }
    }
  }

  return LogBoxStateSubscription;
}

function showFuseboxWarningsMigrationMessageOnce() {
  if (hasShownFuseboxWarningsMigrationMessage) {
    return;
  }
  hasShownFuseboxWarningsMigrationMessage = true;

  const NativeDevSettings =
    require('../../NativeModules/specs/NativeDevSettings').default;

  appendNewLog(
    new LogBoxLog({
      level: 'warn',
      message: {
        content: 'Open debugger to view warnings.',
        substitutions: [],
      },
      isComponentError: false,
      stack: [],
      category: 'fusebox-warnings-migration',
      componentStack: [],
      onNotificationPress: () => {
        if (NativeDevSettings.openDebugger) {
          NativeDevSettings.openDebugger();
        }
      },
    }),
  );
}
