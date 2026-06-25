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

if (global.RN$useAlwaysAvailableJSErrorHandling !== true) {
  /**
   * Sets up the console and exception handling (redbox) for React Native.
   * You can use this module directly, or just require InitializeCore.
   */
  const ExceptionsManager = require('./ExceptionsManager').default;
  const toError = require('../../src/private/utilities/toError').default;
  ExceptionsManager.installConsoleErrorReporter();

  // Set up error handler
  if (!global.__fbDisableExceptionsManager) {
    const handleError = (e: unknown, isFatal: boolean) => {
      try {
        ExceptionsManager.handleException(e, isFatal);
      } catch (ee: unknown) {
        const error = toError(ee);
        console.log('Failed to print error: ', error.message);
        throw e;
      }
    };

    const ErrorUtils = require('../vendor/core/ErrorUtils').default;
    ErrorUtils.setGlobalHandler(handleError);
  }
}
