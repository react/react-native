/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';
import logError from '../logError';

describe('logError', () => {
  const originalConsoleError = console.error;

  afterEach(() => {
    // $FlowFixMe[cannot-write]
    console.error = originalConsoleError;
  });

  it('logs error messages to the console', () => {
    const mockConsoleError = jest.fn();
    // $FlowFixMe[cannot-write]
    console.error = mockConsoleError;

    logError('This is a log message');

    expect(mockConsoleError).toHaveBeenCalledWith('This is a log message');
  });

  it('logs error messages with multiple arguments to the console', () => {
    const mockConsoleError = jest.fn();
    // $FlowFixMe[cannot-write]
    console.error = mockConsoleError;

    const data = 'log';
    logError('This is a', data, 'message');

    expect(mockConsoleError).toHaveBeenCalledWith(
      'This is a',
      'log',
      'message',
    );
  });

  it('logs errors to the console', () => {
    const mockConsoleError = jest.fn();
    // $FlowFixMe[cannot-write]
    console.error = mockConsoleError;

    logError(new Error('The error message'));

    expect(mockConsoleError.mock.calls[0][0]).toContain(
      'Error: "The error message".  Stack:',
    );
  });
});
