/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

const Platform = require('../../../../Libraries/Utilities/Platform').default;

export type StackFrame = {
  column: ?number,
  file: ?string,
  lineNumber: ?number,
  methodName: string,
  collapse?: boolean,
};
export type ExceptionData = {
  message: string,
  originalMessage: ?string,
  name: ?string,
  componentStack: ?string,
  stack: Array<StackFrame>,
  id: number,
  isFatal: boolean,
  // flowlint-next-line unclear-type:off
  extraData?: Object,
  ...
};
export interface Spec extends TurboModule {
  // Deprecated: Use `reportException`
  readonly reportFatalException: (
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) => void;
  // Deprecated: Use `reportException`
  readonly reportSoftException: (
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) => void;
  readonly reportException?: (data: ExceptionData) => void;
  // TODO(T53311281): This is a noop on iOS now. Implement it.
  readonly dismissRedbox?: () => void;
}

const NativeModule =
  TurboModuleRegistry.getEnforcing<Spec>('ExceptionsManager');

const ExceptionsManager = {
  reportFatalException(
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) {
    NativeModule.reportFatalException(message, stack, exceptionId);
  },
  reportSoftException(
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) {
    NativeModule.reportSoftException(message, stack, exceptionId);
  },
  dismissRedbox(): void {
    if (Platform.OS !== 'ios' && NativeModule.dismissRedbox) {
      // TODO(T53311281): This is a noop on iOS now. Implement it.
      NativeModule.dismissRedbox();
    }
  },
  reportException(data: ExceptionData): void {
    if (NativeModule.reportException) {
      NativeModule.reportException(data);
      return;
    }
    if (data.isFatal) {
      ExceptionsManager.reportFatalException(data.message, data.stack, data.id);
    } else {
      ExceptionsManager.reportSoftException(data.message, data.stack, data.id);
    }
  },
};

export default ExceptionsManager;
