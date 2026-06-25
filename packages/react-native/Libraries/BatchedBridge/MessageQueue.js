/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @deprecated
 */

'use strict';

const Systrace = require('../Performance/Systrace');
const deepFreezeAndThrowOnMutationInDev =
  require('../Utilities/deepFreezeAndThrowOnMutationInDev').default;
const stringifySafe = require('../Utilities/stringifySafe').default;
const warnOnce = require('../Utilities/warnOnce').default;
const ErrorUtils = require('../vendor/core/ErrorUtils').default;
const invariant = require('invariant');

export type SpyData = {
  type: number,
  module: ?string,
  method: string | number,
  args: unknown[],
  ...
};

const TO_JS = 0;
const TO_NATIVE = 1;

const MODULE_IDS = 0;
const METHOD_IDS = 1;
const PARAMS = 2;
const MIN_TIME_BETWEEN_FLUSHES_MS = 5;

// eslint-disable-next-line no-bitwise
const TRACE_TAG_REACT = 1 << 13;

const DEBUG_INFO_LIMIT = 32;

class MessageQueue {
  _lazyCallableModules: {[key: string]: (void) => {...}, ...};
  _queue: [number[], number[], unknown[], number];
  _successCallbacks: Map<number, ?(...unknown[]) => void>;
  _failureCallbacks: Map<number, ?(...unknown[]) => void>;
  _callID: number;
  _lastFlush: number;
  _eventLoopStartTime: number;
  _reactNativeMicrotasksCallback: ?() => void;

  _debugInfo: {[number]: [number, number], ...};
  _remoteModuleTable: {[number]: string, ...};
  _remoteMethodTable: {[number]: ReadonlyArray<string>, ...};

  __spy: ?(data: SpyData) => void;

  constructor() {
    this._lazyCallableModules = {};
    this._queue = [[], [], [], 0];
    this._successCallbacks = new Map();
    this._failureCallbacks = new Map();
    this._callID = 0;
    this._lastFlush = 0;
    this._eventLoopStartTime = Date.now();
    this._reactNativeMicrotasksCallback = null;

    if (__DEV__) {
      this._debugInfo = {};
      this._remoteModuleTable = {};
      this._remoteMethodTable = {};
    }

    // $FlowFixMe[cannot-write]
    this.callFunctionReturnFlushedQueue =
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      this.callFunctionReturnFlushedQueue.bind(this);
    // $FlowFixMe[cannot-write]
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    this.flushedQueue = this.flushedQueue.bind(this);

    // $FlowFixMe[cannot-write]
    this.invokeCallbackAndReturnFlushedQueue =
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      this.invokeCallbackAndReturnFlushedQueue.bind(this);
  }

  /**
   * Public APIs
   */

  static spy(spyOrToggle: boolean | ((data: SpyData) => void)) {
    if (spyOrToggle === true) {
      MessageQueue.prototype.__spy = info => {
        console.log(
          `${info.type === TO_JS ? 'N->JS' : 'JS->N'} : ` +
            `${info.module != null ? info.module + '.' : ''}${info.method}` +
            `(${JSON.stringify(info.args)})`,
        );
      };
    } else if (spyOrToggle === false) {
      MessageQueue.prototype.__spy = null;
    } else {
      MessageQueue.prototype.__spy = spyOrToggle;
    }
  }

  callFunctionReturnFlushedQueue(
    module: string,
    method: string,
    args: unknown[],
  ): null | [Array<number>, Array<number>, Array<unknown>, number] {
    this.__guard(() => {
      this.__callFunction(module, method, args);
    });

    return this.flushedQueue();
  }

  invokeCallbackAndReturnFlushedQueue(
    cbID: number,
    args: unknown[],
  ): null | [Array<number>, Array<number>, Array<unknown>, number] {
    this.__guard(() => {
      this.__invokeCallback(cbID, args);
    });

    return this.flushedQueue();
  }

  flushedQueue():
    | null
    | [Array<number>, Array<number>, Array<unknown>, number] {
    this.__guard(() => {
      this.__callReactNativeMicrotasks();
    });

    const queue = this._queue;
    this._queue = [[], [], [], this._callID];
    return queue[0].length ? queue : null;
  }

  getEventLoopRunningTime(): number {
    return Date.now() - this._eventLoopStartTime;
  }

  registerCallableModule(name: string, module: {...}) {
    this._lazyCallableModules[name] = () => module;
  }

  registerLazyCallableModule(name: string, factory: void => interface {}) {
    let module: interface {};
    let getValue: ?(void) => interface {} = factory;
    this._lazyCallableModules[name] = () => {
      if (getValue) {
        module = getValue();
        getValue = null;
      }
      /* $FlowFixMe[class-object-subtyping] added when improving typing for
       * this parameters */
      return module;
    };
  }

  getCallableModule(name: string): {...} | null {
    const getValue = this._lazyCallableModules[name];
    /* $FlowFixMe[constant-condition] Error discovered during Constant
     * Condition roll out. See https://fburl.com/workplace/1v97vimq. */
    return getValue ? getValue() : null;
  }

  callNativeSyncHook(
    moduleID: number,
    methodID: number,
    params: unknown[],
    onFail: ?(...unknown[]) => void,
    onSucc: ?(...unknown[]) => void,
  ): unknown {
    if (__DEV__) {
      invariant(
        global.nativeCallSyncHook,
        'Calling synchronous methods on native ' +
          'modules is not supported in Chrome.\n\n Consider providing alternative ' +
          'methods to expose this method in debug mode, e.g. by exposing constants ' +
          'ahead-of-time.',
      );
    }
    this.processCallbacks(moduleID, methodID, params, onFail, onSucc);
    return global.nativeCallSyncHook(moduleID, methodID, params);
  }

  processCallbacks(
    moduleID: number,
    methodID: number,
    params: unknown[],
    onFail: ?(...unknown[]) => void,
    onSucc: ?(...unknown[]) => void,
  ): void {
    if (onFail || onSucc) {
      if (__DEV__) {
        this._debugInfo[this._callID] = [moduleID, methodID];
        if (this._callID > DEBUG_INFO_LIMIT) {
          delete this._debugInfo[this._callID - DEBUG_INFO_LIMIT];
        }
        if (this._successCallbacks.size > 500) {
          const info: {[number]: {method: string, module: string}} = {};
          this._successCallbacks.forEach((_, callID) => {
            const debug = this._debugInfo[callID];
            const module = debug && this._remoteModuleTable[debug[0]];
            const method = debug && this._remoteMethodTable[debug[0]][debug[1]];
            info[callID] = {module, method};
          });
          warnOnce(
            'excessive-number-of-pending-callbacks',
            `Excessive number of pending callbacks: ${
              this._successCallbacks.size
            }. Some pending callbacks that might have leaked by never being called from native code: ${stringifySafe(
              info,
            )}`,
          );
        }
      }
      // Encode callIDs into pairs of callback identifiers by shifting left and using the rightmost bit
      // to indicate fail (0) or success (1)
      // eslint-disable-next-line no-bitwise
      onFail && params.push(this._callID << 1);
      // eslint-disable-next-line no-bitwise
      onSucc && params.push((this._callID << 1) | 1);
      this._successCallbacks.set(this._callID, onSucc);
      this._failureCallbacks.set(this._callID, onFail);
    }
    if (__DEV__) {
      global.nativeTraceBeginAsyncFlow &&
        global.nativeTraceBeginAsyncFlow(
          TRACE_TAG_REACT,
          'native',
          this._callID,
        );
    }
    this._callID++;
  }

  enqueueNativeCall(
    moduleID: number,
    methodID: number,
    params: unknown[],
    onFail: ?(...unknown[]) => void,
    onSucc: ?(...unknown[]) => void,
  ): void {
    this.processCallbacks(moduleID, methodID, params, onFail, onSucc);

    this._queue[MODULE_IDS].push(moduleID);
    this._queue[METHOD_IDS].push(methodID);

    if (__DEV__) {
      // Validate that parameters passed over the bridge are
      // folly-convertible.  As a special case, if a prop value is a
      // function it is permitted here, and special-cased in the
      // conversion.
      const isValidArgument = (val: unknown): boolean => {
        switch (typeof val) {
          case 'undefined':
          case 'boolean':
          case 'string':
            return true;
          case 'number':
            return isFinite(val);
          case 'object':
            if (val == null) {
              return true;
            }

            if (Array.isArray(val)) {
              return val.every(isValidArgument);
            }

            for (const k in val) {
              if (typeof val[k] !== 'function' && !isValidArgument(val[k])) {
                return false;
              }
            }

            return true;
          case 'function':
            return false;
          default:
            return false;
        }
      };

      // Replacement allows normally non-JSON-convertible values to be
      // seen.  There is ambiguity with string values, but in context,
      // it should at least be a strong hint.
      const replacer = (key: string, val: $FlowFixMe) => {
        const t = typeof val;
        if (t === 'function') {
          return '<<Function ' + val.name + '>>';
        } else if (t === 'number' && !isFinite(val)) {
          return '<<' + val.toString() + '>>';
        } else {
          return val;
        }
      };

      // Note that JSON.stringify
      invariant(
        isValidArgument(params),
        '%s is not usable as a native method argument',
        JSON.stringify(params, replacer),
      );

      // The params object should not be mutated after being queued
      deepFreezeAndThrowOnMutationInDev(params);
    }
    this._queue[PARAMS].push(params);

    const now = Date.now();
    if (
      global.nativeFlushQueueImmediate &&
      now - this._lastFlush >= MIN_TIME_BETWEEN_FLUSHES_MS
    ) {
      const queue = this._queue;
      this._queue = [[], [], [], this._callID];
      this._lastFlush = now;
      global.nativeFlushQueueImmediate(queue);
    }
    Systrace.counterEvent('pending_js_to_native_queue', this._queue[0].length);
    if (__DEV__ && this.__spy && isFinite(moduleID)) {
      // $FlowFixMe[not-a-function]
      this.__spy({
        type: TO_NATIVE,
        module: this._remoteModuleTable[moduleID],
        method: this._remoteMethodTable[moduleID][methodID],
        args: params,
      });
    } else if (this.__spy) {
      this.__spy({
        type: TO_NATIVE,
        module: moduleID + '',
        method: methodID,
        args: params,
      });
    }
  }

  createDebugLookup(
    moduleID: number,
    name: string,
    methods: ?ReadonlyArray<string>,
  ) {
    if (__DEV__) {
      this._remoteModuleTable[moduleID] = name;
      this._remoteMethodTable[moduleID] = methods || [];
    }
  }

  // For JSTimers to register its callback. Otherwise a circular dependency
  // between modules is introduced. Note that only one callback may be
  // registered at a time.
  setReactNativeMicrotasksCallback(fn: () => void) {
    this._reactNativeMicrotasksCallback = fn;
  }

  /**
   * Private methods
   */

  __guard(fn: () => void) {
    if (this.__shouldPauseOnThrow()) {
      fn();
    } else {
      try {
        fn();
      } catch (error: unknown) {
        ErrorUtils.reportFatalError(error);
      }
    }
  }

  // MessageQueue installs a global handler to catch all exceptions where JS users can register their own behavior
  // This handler makes all exceptions to be propagated from inside MessageQueue rather than by the VM at their origin
  // This makes stacktraces to be placed at MessageQueue rather than at where they were launched
  // The parameter DebuggerInternal.shouldPauseOnThrow is used to check before catching all exceptions and
  // can be configured by the VM or any Inspector
  __shouldPauseOnThrow(): boolean {
    return (
      // $FlowFixMe[cannot-resolve-name]
      typeof DebuggerInternal !== 'undefined' &&
      // $FlowFixMe[cannot-resolve-name]
      DebuggerInternal.shouldPauseOnThrow === true
    );
  }

  __callReactNativeMicrotasks() {
    Systrace.trace('JSTimers.callReactNativeMicrotasks()', () => {
      if (this._reactNativeMicrotasksCallback != null) {
        this._reactNativeMicrotasksCallback();
      }
    });
  }

  __callFunction(module: string, method: string, args: unknown[]): void {
    this._lastFlush = Date.now();
    this._eventLoopStartTime = this._lastFlush;
    Systrace.trace(
      __DEV__ || this.__spy
        ? `${module}.${method}(${stringifySafe(args)})`
        : `${module}.${method}(...)`,
      () => {
        if (this.__spy) {
          this.__spy({type: TO_JS, module, method, args});
        }
        const moduleMethods = this.getCallableModule(module);
        if (!moduleMethods) {
          const callableModuleNames = Object.keys(this._lazyCallableModules);
          const n = callableModuleNames.length;
          const callableModuleNameList = callableModuleNames.join(', ');

          // TODO(T122225939): Remove after investigation: Why are we getting to this line in bridgeless mode?
          const isBridgelessMode =
            global.RN$Bridgeless === true ? 'true' : 'false';
          invariant(
            false,
            `Failed to call into JavaScript module method ${module}.${method}(). Module has not been registered as callable. Bridgeless Mode: ${isBridgelessMode}. Registered callable JavaScript modules (n = ${n}): ${callableModuleNameList}.
          A frequent cause of the error is that the application entry file path is incorrect. This can also happen when the JS bundle is corrupt or there is an early initialization error when loading React Native.`,
          );
        }
        // $FlowFixMe[invalid-computed-prop]
        if (!moduleMethods[method]) {
          invariant(
            false,
            `Failed to call into JavaScript module method ${module}.${method}(). Module exists, but the method is undefined.`,
          );
        }
        moduleMethods[method].apply(moduleMethods, args);
      },
    );
  }

  __invokeCallback(cbID: number, args: unknown[]): void {
    this._lastFlush = Date.now();
    this._eventLoopStartTime = this._lastFlush;

    // The rightmost bit of cbID indicates fail (0) or success (1), the other bits are the callID shifted left.
    // eslint-disable-next-line no-bitwise
    const callID = cbID >>> 1;
    // eslint-disable-next-line no-bitwise
    const isSuccess = cbID & 1;
    const callback = isSuccess
      ? this._successCallbacks.get(callID)
      : this._failureCallbacks.get(callID);

    if (__DEV__) {
      const debug = this._debugInfo[callID];
      const module = debug && this._remoteModuleTable[debug[0]];
      const method = debug && this._remoteMethodTable[debug[0]][debug[1]];
      invariant(
        callback,
        `No callback found with cbID ${cbID} and callID ${callID} for ` +
          (method
            ? ` ${module}.${method} - most likely the callback was already invoked`
            : `module ${module || '<unknown>'}`) +
          `. Args: '${stringifySafe(args)}'`,
      );
      const profileName = debug
        ? '<callback for ' + module + '.' + method + '>'
        : cbID;
      if (this.__spy) {
        this.__spy({type: TO_JS, module: null, method: profileName, args});
      }
      Systrace.trace(
        `MessageQueue.invokeCallback(${profileName}, ${stringifySafe(args)})`,
        () => {
          this._successCallbacks.delete(callID);
          this._failureCallbacks.delete(callID);
          callback(...args);
        },
      );
    } else {
      if (!callback) {
        return;
      }
      this._successCallbacks.delete(callID);
      this._failureCallbacks.delete(callID);
      callback(...args);
    }
  }
}

export default MessageQueue;
