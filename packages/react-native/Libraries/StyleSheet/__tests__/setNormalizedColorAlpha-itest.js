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
import normalizeColor from '../normalizeColor';
import setNormalizedColorAlpha from '../setNormalizedColorAlpha';

describe('setNormalizedColorAlpha', () => {
  it('should adjust the alpha of the color passed in', () => {
    expect(setNormalizedColorAlpha(0xffffffff, 0.4)).toBe(0xffffff66);
    expect(setNormalizedColorAlpha(0x204080ff, 0.6)).toBe(0x20408099);
  });

  it('should clamp invalid input', () => {
    expect(setNormalizedColorAlpha(0xffffffff, 1.5)).toBe(0xffffffff);
    expect(setNormalizedColorAlpha(0xffffffff, -1)).toBe(0xffffff00);
  });

  it("should ignore the color's original alpha", () => {
    expect(setNormalizedColorAlpha(0x204080aa, 0.8)).toBe(0x204080cc);
  });

  it('should return the original color when alpha is unchanged', () => {
    const originalColor = normalizeColor('blue');
    // $FlowFixMe[incompatible-type]
    expect(setNormalizedColorAlpha(originalColor, 1)).toBe(originalColor);
  });
});
