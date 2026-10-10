/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import invariant from 'invariant';
import {BatchedBridge} from 'react-native/react-private-interface';

const LoggingTestModule = {
  logToConsole(message: string): void {
    console.log(message);
  },
  logToConsoleAfterWait(message: string, delay: number): void {
    setTimeout(function () {
      console.log(message);
    }, delay);
  },
  warning(message: string): void {
    console.warn(message);
  },
  invariant(message: string): void {
    invariant(false, message);
  },
  logErrorToConsole(message: string): void {
    console.error(message);
  },
  throwError(message: string): void {
    throw new Error(message);
  },
};

BatchedBridge.registerCallableModule('LoggingTestModule', LoggingTestModule);
