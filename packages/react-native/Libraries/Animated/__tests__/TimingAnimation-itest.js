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

import TimingAnimation from '../animations/TimingAnimation';

describe('Timing Animation', () => {
  it('should return array of 61 items', () => {
    const timingAnim = new TimingAnimation({
      duration: 1000,
      toValue: 1,
      useNativeDriver: false,
    });
    const config = timingAnim.__getNativeAnimationConfig();

    expect(config.frames.length).toBe(61);
    expect(config.frames[60]).toBe(1);
    expect(config.frames[59]).toBeLessThan(1);
  });

  it('should cope with zero duration', () => {
    const timingAnim = new TimingAnimation({
      duration: 0,
      toValue: 1,
      useNativeDriver: false,
    });
    const config = timingAnim.__getNativeAnimationConfig();

    expect(config.frames.length).toBe(1);
    expect(config.frames[0]).toBe(1);
  });
});
