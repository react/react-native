/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import useAppState from '../useAppState';

describe('useAppState', () => {
  it('should return a mocked active state by default', () => {
    expect(jest.isMockFunction(useAppState)).toBe(true);
    // $FlowFixMe[react-rule-hook]
    expect(useAppState()).toBe('active');
  });

  it('should have console.error when not using mock', () => {
    const useAppStateActual = jest.requireActual<{
      default: typeof useAppState,
    }>('../useAppState').default;
    const spy = jest.spyOn(console, 'error').mockImplementationOnce(() => {
      throw new Error('console.error() was called');
    });

    expect(() => {
      // $FlowFixMe[react-rule-hook]
      useAppStateActual();
    }).toThrow();

    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(
        /Invalid hook call. Hooks can only be called inside of the body of a function component./,
      ),
    );
  });
});
