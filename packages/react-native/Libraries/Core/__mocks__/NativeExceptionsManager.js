/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import typeof NativeExceptionsManager from '../NativeExceptionsManager';

export default {
  reportFatalException: jest.fn(),
  reportSoftException: jest.fn(),
  dismissRedbox: jest.fn(),
  reportException: jest.fn(),
} as NativeExceptionsManager;
