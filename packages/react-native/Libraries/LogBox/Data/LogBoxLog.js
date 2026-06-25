/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {Stack} from './LogBoxSymbolication';
import type {Category, CodeFrame, Message} from './parseLogBoxLog';

import * as LogBoxSymbolication from './LogBoxSymbolication';

type SymbolicationStatus = 'NONE' | 'PENDING' | 'COMPLETE' | 'FAILED';

type SymbolicationState =
  | Readonly<{error: null, stack: null, status: 'NONE'}>
  | Readonly<{error: null, stack: null, status: 'PENDING'}>
  | Readonly<{error: null, stack: Stack, status: 'COMPLETE'}>
  | Readonly<{error: Error, stack: null, status: 'FAILED'}>;

export type LogLevel = 'warn' | 'error' | 'fatal' | 'syntax';

export type LogBoxLogData = Readonly<{
  level: LogLevel,
  type?: ?string,
  message: Message,
  stack: Stack,
  category: string,
  componentStack: Stack,
  codeFrame?: ?CodeFrame,
  isComponentError: boolean,
  extraData?: unknown,
  onNotificationPress?: ?() => void,
}>;

class LogBoxLog {
  message: Message;
  type: ?string;
  category: Category;
  componentStack: Stack;
  stack: Stack;
  count: number;
  level: LogLevel;
  codeFrame: ?CodeFrame;
  componentCodeFrame: ?CodeFrame;
  isComponentError: boolean;
  extraData: unknown | void;
  symbolicated: SymbolicationState = {
    error: null,
    stack: null,
    status: 'NONE',
  };
  symbolicatedComponentStack: SymbolicationState = {
    error: null,
    stack: null,
    status: 'NONE',
  };
  onNotificationPress: ?() => void;

  constructor(data: LogBoxLogData) {
    this.level = data.level;
    this.type = data.type;
    this.message = data.message;
    this.stack = data.stack;
    this.category = data.category;
    this.componentStack = data.componentStack;
    this.codeFrame = data.codeFrame;
    this.isComponentError = data.isComponentError;
    this.extraData = data.extraData;
    this.count = 1;
    this.onNotificationPress = data.onNotificationPress;
  }

  incrementCount(): void {
    this.count += 1;
  }

  getAvailableStack(): Stack {
    return this.symbolicated.status === 'COMPLETE'
      ? this.symbolicated.stack
      : this.stack;
  }

  getAvailableComponentStack(): Stack {
    return this.symbolicatedComponentStack.status === 'COMPLETE'
      ? this.symbolicatedComponentStack.stack
      : this.componentStack;
  }

  retrySymbolicate(callback?: (status: SymbolicationStatus) => void): void {
    let retry = false;
    if (this.symbolicated.status !== 'COMPLETE') {
      LogBoxSymbolication.deleteStack(this.stack);
      retry = true;
    }
    if (this.symbolicatedComponentStack.status !== 'COMPLETE') {
      LogBoxSymbolication.deleteStack(this.componentStack);
      retry = true;
    }
    if (retry) {
      this.handleSymbolicate(callback);
    }
  }

  symbolicate(callback?: (status: SymbolicationStatus) => void): void {
    if (this.symbolicated.status === 'NONE') {
      this.handleSymbolicate(callback);
    }
  }

  handleSymbolicate(callback?: (status: SymbolicationStatus) => void): void {
    if (
      this.symbolicated.status !== 'PENDING' &&
      this.symbolicated.status !== 'COMPLETE'
    ) {
      this.updateStatus(null, null, null, callback);
      LogBoxSymbolication.symbolicate(this.stack, this.extraData).then(
        data => {
          this.updateStatus(null, data?.stack, data?.codeFrame, callback);
        },
        error => {
          this.updateStatus(error, null, null, callback);
        },
      );
    }
    if (
      this.componentStack != null &&
      this.componentStack.length > 0 &&
      this.symbolicatedComponentStack.status !== 'PENDING' &&
      this.symbolicatedComponentStack.status !== 'COMPLETE'
    ) {
      this.updateComponentStackStatus(null, null, null, callback);
      LogBoxSymbolication.symbolicate(this.componentStack, []).then(
        data => {
          this.updateComponentStackStatus(
            null,
            data.stack,
            data?.codeFrame,
            callback,
          );
        },
        error => {
          this.updateComponentStackStatus(error, null, null, callback);
        },
      );
    }
  }

  updateStatus(
    error: ?Error,
    stack: ?Stack,
    codeFrame: ?CodeFrame,
    callback?: (status: SymbolicationStatus) => void,
  ): void {
    const lastStatus = this.symbolicated.status;
    this.symbolicated = this._computeSymbolicationState(error, stack);
    if (stack != null && codeFrame) {
      this.codeFrame = codeFrame;
    }
    if (callback && lastStatus !== this.symbolicated.status) {
      callback(this.symbolicated.status);
    }
  }

  updateComponentStackStatus(
    error: ?Error,
    stack: ?Stack,
    codeFrame: ?CodeFrame,
    callback?: (status: SymbolicationStatus) => void,
  ): void {
    const lastStatus = this.symbolicatedComponentStack.status;
    this.symbolicatedComponentStack = this._computeSymbolicationState(
      error,
      stack,
    );
    if (stack != null && codeFrame) {
      this.componentCodeFrame = codeFrame;
    }
    if (callback && lastStatus !== this.symbolicatedComponentStack.status) {
      callback(this.symbolicatedComponentStack.status);
    }
  }

  _computeSymbolicationState(error: ?Error, stack: ?Stack): SymbolicationState {
    if (error != null) {
      return {
        error,
        stack: null,
        status: 'FAILED',
      };
    } else if (stack != null) {
      return {
        error: null,
        stack,
        status: 'COMPLETE',
      };
    } else {
      return {
        error: null,
        stack: null,
        status: 'PENDING',
      };
    }
  }
}

export default LogBoxLog;
