/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @polyfill
 */

let _inGuard = 0;

type ErrorHandler = (error: unknown, isFatal: boolean) => void;
type Fn<Args, Return> = (...Args) => Return;

/**
 * This is the error handler that is called when we encounter an exception
 * when loading a module. This will report any errors encountered before
 * ExceptionsManager is configured.
 */
let _globalHandler: ErrorHandler =
  global.RN$useAlwaysAvailableJSErrorHandling === true
    ? global.RN$handleException
    : (e: unknown, isFatal: boolean) => {
        throw e;
      };

/**
 * The particular require runtime that we are using looks for a global
 * `ErrorUtils` object and if it exists, then it requires modules with the
 * error handler specified via ErrorUtils.setGlobalHandler by calling the
 * require function with applyWithGuard. Since the require module is loaded
 * before any of the modules, this ErrorUtils must be defined (and the handler
 * set) globally before requiring anything.
 */
const ErrorUtils = {
  setGlobalHandler(fun: ErrorHandler): void {
    _globalHandler = fun;
  },
  getGlobalHandler(): ErrorHandler {
    return _globalHandler;
  },
  reportError(error: unknown): void {
    /* $FlowFixMe[constant-condition] Error discovered during Constant
     * Condition roll out. See https://fburl.com/workplace/1v97vimq. */
    _globalHandler && _globalHandler(error, false);
  },
  reportFatalError(error: unknown): void {
    // NOTE: This has an untyped call site in Metro.
    /* $FlowFixMe[constant-condition] Error discovered during Constant
     * Condition roll out. See https://fburl.com/workplace/1v97vimq. */
    _globalHandler && _globalHandler(error, true);
  },
  applyWithGuard<TArgs extends ReadonlyArray<unknown>, TOut>(
    fun: Fn<TArgs, TOut>,
    context?: ?unknown,
    args?: ?TArgs,
    // Unused, but some code synced from www sets it to null.
    unused_onError?: null,
    // Some callers pass a name here, which we ignore.
    unused_name?: ?string,
  ): ?TOut {
    try {
      _inGuard++;
      /* $FlowFixMe[incompatible-type] : TODO T48204745 (1) apply(context,
       * null) is fine. (2) array -> rest array should work */
      /* $FlowFixMe[incompatible-type] : TODO T48204745 (1) apply(context,
       * null) is fine. (2) array -> rest array should work */
      return fun.apply(context, args);
    } catch (e) {
      ErrorUtils.reportError(e);
    } finally {
      _inGuard--;
    }
    return null;
  },
  applyWithGuardIfNeeded<TArgs extends ReadonlyArray<unknown>, TOut>(
    fun: Fn<TArgs, TOut>,
    context?: ?unknown,
    args?: ?TArgs,
  ): ?TOut {
    if (ErrorUtils.inGuard()) {
      /* $FlowFixMe[incompatible-type] : TODO T48204745 (1) apply(context,
       * null) is fine. (2) array -> rest array should work */
      /* $FlowFixMe[incompatible-type] : TODO T48204745 (1) apply(context,
       * null) is fine. (2) array -> rest array should work */
      return fun.apply(context, args);
    } else {
      ErrorUtils.applyWithGuard(fun, context, args);
    }
    return null;
  },
  inGuard(): boolean {
    return !!_inGuard;
  },
  guard<TArgs extends ReadonlyArray<unknown>, TOut>(
    fun: Fn<TArgs, TOut>,
    name?: ?string,
    context?: ?unknown,
  ): ?(...TArgs) => ?TOut {
    // TODO: (moti) T48204753 Make sure this warning is never hit and remove it - types
    // should be sufficient.
    if (typeof fun !== 'function') {
      console.warn('A function must be passed to ErrorUtils.guard, got ', fun);
      return null;
    }
    const guardName = name ?? fun.name ?? '<generated guard>';
    /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
     * Flow's LTI update could not be added via codemod */
    function guarded(...args: TArgs): ?TOut {
      return ErrorUtils.applyWithGuard(
        fun,
        context ?? this,
        args,
        null,
        guardName,
      );
    }

    return guarded;
  },
};

global.ErrorUtils = ErrorUtils;

export type ErrorUtilsT = typeof ErrorUtils;
