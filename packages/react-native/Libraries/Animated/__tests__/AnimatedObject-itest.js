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

import Animated from '../Animated';
import AnimatedObject from '../nodes/AnimatedObject';
import nullthrows from 'nullthrows';

describe('AnimatedObject', () => {
  it('should get the proper value', () => {
    const anim = new Animated.Value(0);
    const translateAnim = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 200],
    });

    const node = nullthrows(
      AnimatedObject.from([
        {
          translate: [translateAnim, translateAnim],
        },
        {
          translateX: translateAnim,
        },
        {scale: anim},
      ]),
    );

    expect(node.__getValue()).toEqual([
      {translate: [100, 100]},
      {translateX: 100},
      {scale: 0},
    ]);
  });

  it('should make all AnimatedNodes native', () => {
    const anim = new Animated.Value(0);
    const translateAnim = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 200],
    });

    const node = nullthrows(
      AnimatedObject.from([
        {
          translate: [translateAnim, translateAnim],
        },
        {
          translateX: translateAnim,
        },
        {scale: anim},
      ]),
    );

    node.__makeNative();

    expect(node.__isNative).toBe(true);
    expect(anim.__isNative).toBe(true);
    expect(translateAnim.__isNative).toBe(true);
  });

  it('detects animated nodes', () => {
    expect(AnimatedObject.from(10)).toBe(null);

    const anim = new Animated.Value(0);
    expect(AnimatedObject.from(anim)).not.toBe(null);

    const event = Animated.event([{}], {useNativeDriver: true});
    expect(AnimatedObject.from(event)).toBe(null);

    expect(AnimatedObject.from([10, 10])).toBe(null);
    expect(AnimatedObject.from([10, anim])).not.toBe(null);

    expect(AnimatedObject.from({a: 10, b: 10})).toBe(null);
    expect(AnimatedObject.from({a: 10, b: anim})).not.toBe(null);

    expect(AnimatedObject.from({a: 10, b: {ba: 10, bb: 10}})).toBe(null);
    expect(AnimatedObject.from({a: 10, b: {ba: 10, bb: anim}})).not.toBe(null);
    expect(AnimatedObject.from({a: 10, b: [10, 10]})).toBe(null);
    expect(AnimatedObject.from({a: 10, b: [10, anim]})).not.toBe(null);
  });
});
