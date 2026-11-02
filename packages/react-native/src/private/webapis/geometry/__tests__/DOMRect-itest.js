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

import DOMRect from '../DOMRect';
import DOMRectReadOnly from '../DOMRectReadOnly';

describe('DOMRect', () => {
  it('preserves NaN and signed zero constructor values', () => {
    const rect = new DOMRectReadOnly(-0, NaN, -0, NaN);

    expect(Object.is(rect.x, -0)).toBe(true);
    expect(Number.isNaN(rect.y)).toBe(true);
    expect(Object.is(rect.width, -0)).toBe(true);
    expect(Number.isNaN(rect.height)).toBe(true);
  });

  it('preserves NaN and signed zero assigned values', () => {
    const rect = new DOMRect();

    rect.x = -0;
    rect.y = NaN;
    rect.width = -0;
    rect.height = NaN;

    expect(Object.is(rect.x, -0)).toBe(true);
    expect(Number.isNaN(rect.y)).toBe(true);
    expect(Object.is(rect.width, -0)).toBe(true);
    expect(Number.isNaN(rect.height)).toBe(true);
  });
});
