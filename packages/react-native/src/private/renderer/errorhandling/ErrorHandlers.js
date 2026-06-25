/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {ExtendedError} from '../../../../Libraries/Core/ExtendedError';

import ExceptionsManager, {
  SyntheticError,
} from '../../../../Libraries/Core/ExceptionsManager';
import * as React from 'react';

type ErrorInfo = {
  readonly componentStack?: ?string,
  // $FlowFixMe[unclear-type] unknown props and state.
  readonly errorBoundary?: ?React.Component<any, any>,
};

function getExtendedError(
  errorValue: unknown,
  errorInfo: ErrorInfo,
): ExtendedError {
  let error;

  // Typically, `errorValue` should be an error. However, other values such as
  // strings (or even null) are sometimes thrown.
  if (errorValue instanceof Error) {
    /* $FlowFixMe[class-object-subtyping] added when improving typing for
     * this parameters */
    // $FlowFixMe[incompatible-type]
    error = errorValue as ExtendedError;
  } else if (typeof errorValue === 'string') {
    /* $FlowFixMe[class-object-subtyping] added when improving typing for
     * this parameters */
    // $FlowFixMe[incompatible-type]
    error = new SyntheticError(errorValue) as ExtendedError;
  } else {
    /* $FlowFixMe[class-object-subtyping] added when improving typing for
     * this parameters */
    // $FlowFixMe[incompatible-type]
    error = new SyntheticError('Unspecified error') as ExtendedError;
  }
  try {
    // $FlowFixMe[incompatible-use] this is in try/catch.
    error.componentStack = errorInfo.componentStack;
    error.isComponentError = true;
  } catch {
    // Ignored.
  }

  return error;
}

export function onUncaughtError(
  errorValue: unknown,
  errorInfo: ErrorInfo,
): void {
  const error = getExtendedError(errorValue, errorInfo);

  // Uncaught errors are fatal.
  ExceptionsManager.handleException(error, true);
}

export function onCaughtError(errorValue: unknown, errorInfo: ErrorInfo): void {
  const error = getExtendedError(errorValue, errorInfo);

  // Caught errors are not fatal.
  ExceptionsManager.handleException(error, false);
}

export function onRecoverableError(
  errorValue: unknown,
  errorInfo: ErrorInfo,
): void {
  const error = getExtendedError(errorValue, errorInfo);

  // Recoverable errors should only be warnings.
  // This will make it a soft error in LogBox.
  // TODO: improve the logging for recoverable errors in prod.
  console.warn(error);
}
