/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import * as React from 'react';

const NativeExceptionsManager = jest.requireMock(
  'react-native/Libraries/Core/NativeExceptionsManager',
).default;

test('NativeAnimatedHelper is a mock', () => {
  const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  try {
    const NativeAnimatedHelper: {
      assertNativeAnimatedModule: () => void,
      nativeEventEmitter: {addListener: () => void},
      shouldUseNativeDriver: () => boolean,
    } = jest.requireMock(
      'react-native/src/private/animated/NativeAnimatedHelper',
    ).default;

    expect(
      jest.isMockFunction(NativeAnimatedHelper.assertNativeAnimatedModule),
    ).toBe(true);
    expect(NativeAnimatedHelper.nativeEventEmitter).toBeDefined();
    expect(
      jest.isMockFunction(NativeAnimatedHelper.shouldUseNativeDriver),
    ).toBe(false);
    expect(consoleWarn).not.toHaveBeenCalled();
  } finally {
    consoleWarn.mockRestore();
  }
});

test('NativeExceptionsManager is a mock', () => {
  expect(jest.isMockFunction(NativeExceptionsManager.reportException)).toBe(
    true,
  );
});

test('native component mocks work with a partial react-native mock', () => {
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({}));

    expect(() => {
      jest.requireActual<unknown>('../RefreshControlMock');
      jest.requireActual<unknown>('../mocks/RefreshControl');
      jest.requireActual<unknown>('../mocks/ScrollView');
    }).not.toThrow();
  });
});

test('reportError is defined so React does not mistake this for a DOM', () => {
  // `window` is aliased to `global`, so React only avoids constructing and
  // dispatching a DOM `ErrorEvent` (which this environment cannot do) when
  // `reportError` is available.
  // $FlowFixMe[prop-missing] - `reportError` is not in Flow's global defs.
  expect(typeof global.reportError).toBe('function');
});

test('an error thrown in a transition is reported unchanged', () => {
  const error = new Error('Original error');
  const handler = jest.fn();

  process.on('uncaughtException', handler);

  try {
    React.startTransition(() => {
      throw error;
    });
  } finally {
    process.off('uncaughtException', handler);
  }

  expect(handler).toHaveBeenCalledWith(error);
});
