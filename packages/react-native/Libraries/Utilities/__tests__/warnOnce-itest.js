/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';
import warnOnce from '../warnOnce';

describe('warnOnce', () => {
  const originalConsoleWarn = console.warn;

  afterEach(() => {
    // $FlowFixMe[cannot-write]
    console.warn = originalConsoleWarn;
  });

  it('logs warning messages to the console exactly once', () => {
    const mockConsoleWarn = jest.fn();
    // $FlowFixMe[cannot-write]
    console.warn = mockConsoleWarn;

    warnOnce('test-message', 'This is a log message');
    warnOnce('test-message', 'This is a second log message');

    expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
    expect(mockConsoleWarn).toHaveBeenCalledWith('This is a log message');
  });
});
