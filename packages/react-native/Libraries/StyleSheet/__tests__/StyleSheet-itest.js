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
import StyleSheet from '../StyleSheet';

const setStyleAttributePreprocessor = StyleSheet.setStyleAttributePreprocessor;

describe('setStyleAttributePreprocessor', () => {
  const originalConsoleWarn = console.warn;

  afterEach(() => {
    // $FlowExpectedError[cannot-write]
    console.warn = originalConsoleWarn;
  });

  it('should not show warning when set preprocessor first time', () => {
    const mockConsoleWarn = jest.fn();
    // $FlowExpectedError[cannot-write]
    console.warn = mockConsoleWarn;

    setStyleAttributePreprocessor(
      'fontFamily',
      (fontFamily: string) => fontFamily,
    );
    expect(mockConsoleWarn).not.toHaveBeenCalled();
  });

  it('should show warning when overwrite the preprocessor', () => {
    const mockConsoleWarn = jest.fn();
    // $FlowExpectedError[cannot-write]
    console.warn = mockConsoleWarn;

    setStyleAttributePreprocessor(
      'fontFamily',
      (fontFamily: string) => fontFamily,
    );
    setStyleAttributePreprocessor(
      'fontFamily',
      (fontFamily: string) => `Scoped-${fontFamily}`,
    );
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'Overwriting fontFamily style attribute preprocessor',
    );
  });
});
