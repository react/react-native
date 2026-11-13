/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import MockNativeMethods from '../MockNativeMethods';

describe('MockNativeMethods', () => {
  test('provides mock for measure', () => {
    expect(jest.isMockFunction(MockNativeMethods.measure)).toBe(true);
  });

  test('provides mock for measureInWindow', () => {
    expect(jest.isMockFunction(MockNativeMethods.measureInWindow)).toBe(true);
  });

  test('provides mock for measureLayout', () => {
    expect(jest.isMockFunction(MockNativeMethods.measureLayout)).toBe(true);
  });

  test('provides mock for setNativeProps', () => {
    expect(jest.isMockFunction(MockNativeMethods.setNativeProps)).toBe(true);
  });

  test('provides mock for focus', () => {
    expect(jest.isMockFunction(MockNativeMethods.focus)).toBe(true);
  });

  test('provides mock for blur', () => {
    expect(jest.isMockFunction(MockNativeMethods.blur)).toBe(true);
  });

  test('provides mock for getBoundingClientRect', () => {
    expect(jest.isMockFunction(MockNativeMethods.getBoundingClientRect)).toBe(
      true,
    );
  });

  test('getBoundingClientRect returns a DOMRect-like object with zero values', () => {
    const rect = MockNativeMethods.getBoundingClientRect();
    expect(rect).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    });
  });
});
