/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const MockNativeMethods = {
  measure: jest.fn(),
  measureInWindow: jest.fn(),
  measureLayout: jest.fn(),
  setNativeProps: jest.fn(),
  focus: jest.fn(),
  blur: jest.fn(),
} as {
  measure: () => void,
  measureInWindow: () => void,
  measureLayout: () => void,
  setNativeProps: () => void,
  focus: () => void,
  blur: () => void,
};

export default MockNativeMethods;
