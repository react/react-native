/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {ExtendedError} from './ExtendedError';
import type {ExceptionData} from './NativeExceptionsManager';

export class SyntheticError extends Error {
  name: string = '';
}

type ExceptionDecorator = ExceptionData => ExceptionData;

let userExceptionDecorator: ?ExceptionDecorator;
let inUserExceptionDecorator = false;

// This string is used to decorate an ExtendedError with extra data in select usecases.
// Note that data passed using this method should be strictly contained,
// as data that's not serializable/too large may cause issues with passing the error to the native code.
// TODO(T204185517): We should use a Symbol for this, but jsi through jsc doesn't support it yet.
const decoratedExtraDataKey = 'RN$ErrorExtraDataKey';

/**
 * Allows the app to add information to the exception report before it is sent
 * to native. This API is not final.
 */

function unstable_setExceptionDecorator(
  exceptionDecorator: ?ExceptionDecorator,
) {
  userExceptionDecorator = exceptionDecorator;
}

function preprocessException(data: ExceptionData): ExceptionData {
  if (userExceptionDecorator && !inUserExceptionDecorator) {
    inUserExceptionDecorator = true;
    try {
      return userExceptionDecorator(data);
    } catch {
      // Fall through
    } finally {
      inUserExceptionDecorator = false;
    }
  }
  return data;
}

/**
 * Handles the developer-visible aspect of errors and exceptions
 */
let exceptionID = 0;
function reportException(
  e: ExtendedError,
  isFatal: boolean,
  reportToConsole: boolean, // only true when coming from handleException; the error has not yet been logged
) {
  const parseErrorStack = require('./Devtools/parseErrorStack').default;
  const stack = parseErrorStack(e?.stack);
  const currentExceptionID = ++exceptionID;
  const originalMessage = e.message || '';
  let message = originalMessage;
  if (e.componentStack != null) {
    message += `\n\nThis error is located at:${e.componentStack}`;
  }
  const namePrefix = e.name == null || e.name === '' ? '' : `${e.name}: `;

  if (!message.startsWith(namePrefix)) {
    message = namePrefix + message;
  }

  // $FlowFixMe[unclear-type]
  const extraData: Object = {
    // $FlowFixMe[incompatible-use] we can't define a type with a Symbol-keyed field in flow
    ...e[decoratedExtraDataKey],
    jsEngine: e.jsEngine,
    rawStack: e.stack,
  };
  if (e.cause != null && typeof e.cause === 'object') {
    extraData.stackSymbols = e.cause.stackSymbols;
    extraData.stackReturnAddresses = e.cause.stackReturnAddresses;
    extraData.stackElements = e.cause.stackElements;
  }

  const data = preprocessException({
    message,
    originalMessage: message === originalMessage ? null : originalMessage,
    name: e.name == null || e.name === '' ? null : e.name,
    componentStack:
      typeof e.componentStack === 'string' ? e.componentStack : null,
    stack,
    id: currentExceptionID,
    isFatal,
    extraData,
  });

  if (reportToConsole) {
    // we feed back into console.error, to make sure any methods that are
    // monkey patched on top of console.error are called when coming from
    // handleException
    console.error(e);
  }

  if (__DEV__) {
    // reportToConsole is only true when coming from handleException,
    // and the error has not yet been logged. If it's false, then it was
    // reported to LogBox in reactConsoleErrorHandler, and we don't need to.
    if (reportToConsole) {
      const LogBox = require('../LogBox/LogBox').default;
      LogBox.addException({
        ...data,
        isComponentError: !!e.isComponentError,
      });
    }
  } else if (isFatal || e.type !== 'warn') {
    const NativeExceptionsManager =
      require('./NativeExceptionsManager').default;
    if (NativeExceptionsManager) {
      if (isFatal) {
        if (global.RN$hasHandledFatalException?.()) {
          return;
        }
        global.RN$notifyOfFatalException?.();
      }
      NativeExceptionsManager.reportException(data);
    }
  }
}

declare var console: {
  error: (...data: ReadonlyArray<unknown>) => void,
  _errorOriginal: (...data: ReadonlyArray<unknown>) => void,
  reportErrorsAsExceptions?: boolean,
  ...
};

// If we trigger console.error _from_ handleException,
// we do want to make sure that console.error doesn't trigger error reporting again
let inExceptionHandler = false;

/**
 * Logs exceptions to the (native) console and displays them
 */
function handleException(e: unknown, isFatal: boolean) {
  // TODO(T196834299): We should really use a c++ turbomodule for this
  const reportToConsole = true;
  if (
    !global.RN$handleException ||
    !global.RN$handleException(e, isFatal, reportToConsole)
  ) {
    let error: Error;
    if (e instanceof Error) {
      error = e;
    } else {
      // Workaround for reporting errors caused by `throw 'some string'`
      // Unfortunately there is no way to figure out the stacktrace in this
      // case, so if you ended up here trying to trace an error, look for
      // `throw '<error message>'` somewhere in your codebase.
      error = new SyntheticError(e);
    }
    try {
      inExceptionHandler = true;
      /* $FlowFixMe[class-object-subtyping] added when improving typing for this
       * parameters */
      // $FlowFixMe[incompatible-type]
      reportException(error, isFatal, reportToConsole);
    } finally {
      inExceptionHandler = false;
    }
  }
}

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
function reactConsoleErrorHandler(...args) {
  // bubble up to any original handlers
  console._errorOriginal(...args);
  if (console.reportErrorsAsExceptions === false) {
    return;
  }
  if (inExceptionHandler || global.RN$inExceptionHandler?.()) {
    // The fundamental trick here is that are multiple entry point to logging errors:
    // (see D19743075 for more background)
    //
    // 1. An uncaught exception being caught by the global handler
    // 2. An error being logged throw console.error
    //
    // However, console.error is monkey patched multiple times: by this module, and by the
    // DevTools setup that sends messages to Metro.
    // The patching order cannot be relied upon.
    //
    // So, some scenarios that are handled by this flag:
    //
    // Logging an error:
    // 1. console.error called from user code
    // 2. (possibly) arrives _first_ at DevTool handler, send to Metro
    // 3. Bubbles to here
    // 4. goes into report Exception.
    // 5. should not trigger console.error again, to avoid looping / logging twice
    // 6. should still bubble up to original console
    //    (which might either be console.log, or the DevTools handler in case it patched _earlier_ and (2) didn't happen)
    //
    // Throwing an uncaught exception:
    // 1. exception thrown
    // 2. picked up by handleException
    // 3. should be sent to console.error (not console._errorOriginal, as DevTools might have patched _later_ and it needs to send it to Metro)
    // 4. that _might_ bubble again to the `reactConsoleErrorHandle` defined here
    //    -> should not handle exception _again_, to avoid looping / showing twice (this code branch)
    // 5. should still bubble up to original console (which might either be console.log, or the DevTools handler in case that one patched _earlier_)
    return;
  }

  let error;

  const firstArg = args[0];
  if (firstArg?.stack) {
    // reportException will console.error this with high enough fidelity.
    error = firstArg;
  } else {
    const stringifySafe = require('../Utilities/stringifySafe').default;
    const message = args
      .map(arg => (typeof arg === 'string' ? arg : stringifySafe(arg)))
      .join(' ');

    error = new SyntheticError(message);
    error.name = 'console.error';
  }

  const isFatal = false;
  const reportToConsole = false;
  if (
    !global.RN$handleException ||
    !global.RN$handleException(error, isFatal, reportToConsole)
  ) {
    if (__DEV__) {
      // If we're not reporting to the console in reportException,
      // we need to report it as a console.error here.
      /* $FlowFixMe[constant-condition] Error discovered during Constant
       * Condition roll out. See https://fburl.com/workplace/1v97vimq. */
      if (!reportToConsole) {
        require('../LogBox/LogBox').default.addConsoleLog('error', ...args);
      }
    }
    if (error.message.startsWith('Warning: ')) {
      // React warnings use console.error so that a stack trace is shown, but
      // we don't (currently) want these to report to native.
      // Note: We can probably remove this, but would be a breaking change
      // if the warning module is still used somewhere.
      // Logic duplicated in polyfills/console.js
      return;
    }
    reportException(
      /* $FlowFixMe[class-object-subtyping] added when improving typing for this
       * parameters */
      // $FlowFixMe[incompatible-type]
      error,
      isFatal,
      reportToConsole,
    );
  }
}

/**
 * Shows a redbox with stacktrace for all console.error messages.  Disable by
 * setting `console.reportErrorsAsExceptions = false;` in your app.
 */
function installConsoleErrorReporter() {
  if (console._errorOriginal) {
    return; // already installed
  }
  // Flow doesn't like it when you set arbitrary values on a global object
  console._errorOriginal = console.error.bind(console);
  console.error = reactConsoleErrorHandler;
}

const ExceptionsManager = {
  decoratedExtraDataKey,
  handleException,
  installConsoleErrorReporter,
  SyntheticError, // <- for backwards compatibility
  unstable_setExceptionDecorator,
};

export default ExceptionsManager;
