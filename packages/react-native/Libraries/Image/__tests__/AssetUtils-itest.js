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

import {getUrlCacheBreaker, setUrlCacheBreaker} from '../AssetUtils';

const originalConsoleWarn = console.warn;

describe('AssetUtils', () => {
  afterEach(() => {
    // $FlowFixMe[cannot-write]
    console.warn = originalConsoleWarn;
    // $FlowFixMe[cannot-write]
    global.__DEV__ = true;
  });

  it('should return empty string and warn once if no cacheBreaker set (DEV)', () => {
    const mockWarn = jest.fn();
    // $FlowFixMe[cannot-write]
    console.warn = mockWarn;
    // $FlowFixMe[cannot-write]
    global.__DEV__ = true;
    expect(getUrlCacheBreaker()).toEqual('');
    expect(getUrlCacheBreaker()).toEqual('');
    expect(mockWarn).toHaveBeenCalledTimes(1);
  });

  it('should return empty string if no cacheBreaker set in prod', () => {
    const mockWarn = jest.fn();
    // $FlowFixMe[cannot-write]
    console.warn = mockWarn;
    // $FlowFixMe[cannot-write]
    global.__DEV__ = false;
    expect(getUrlCacheBreaker()).toEqual('');
    expect(mockWarn).not.toHaveBeenCalled();
  });

  it('should return set cacheBreaker value', () => {
    setUrlCacheBreaker('my-cache-breaker-value');
    expect(getUrlCacheBreaker()).toEqual('my-cache-breaker-value');
  });
});
