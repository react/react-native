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
  getBoundingClientRect: jest.fn(function () {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  }),
} as {
  measure: () => void,
  measureInWindow: () => void,
  measureLayout: () => void,
  setNativeProps: () => void,
  focus: () => void,
  blur: () => void,
  getBoundingClientRect: () => {
    x: number,
    y: number,
    width: number,
    height: number,
    top: number,
    left: number,
    right: number,
    bottom: number,
  },
};

export default MockNativeMethods;
