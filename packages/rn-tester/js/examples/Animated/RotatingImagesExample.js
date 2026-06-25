/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTConfigurationBlock from '../../components/RNTConfigurationBlock';
import RNTesterButton from '../../components/RNTesterButton';
import ToggleNativeDriver from './utils/ToggleNativeDriver';
import * as React from 'react';
import {useState} from 'react';
import {Animated, StyleSheet, View} from 'react-native';

const styles = StyleSheet.create({
  rotatingImage: {
    width: 70,
    height: 70,
  },
});

component RotatingImagesView(useNativeDriver: boolean) {
  const anim = new Animated.Value(0);
  const rotatingAnimation = Animated.spring(anim, {
    // Returns to the start
    toValue: 0,

    // Velocity makes it move
    velocity: 3,

    // Slow
    tension: -10,

    // Oscillate a lot
    friction: 1,
    useNativeDriver,
  });

  return (
    <>
      <RNTesterButton
        onPress={() => {
          rotatingAnimation.start();
        }}>
        Press to Spin it!
      </RNTesterButton>
      <Animated.Image
        source={require('../../assets/bunny.png')}
        style={[
          styles.rotatingImage,
          {
            transform: [
              {
                scale: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 10],
                }),
              },
              {
                translateX: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 100],
                }),
              },
              {
                rotate: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [
                    '0deg',
                    '360deg', // 'deg' or 'rad'
                  ],
                }),
              },
            ],
          },
        ]}
      />
    </>
  );
}

component RotatingImagesExample() {
  const [useNativeDriver, setUseNativeDriver] = useState(false);

  return (
    <View>
      <RNTConfigurationBlock>
        <ToggleNativeDriver
          value={useNativeDriver}
          onValueChange={setUseNativeDriver}
        />
      </RNTConfigurationBlock>
      <RotatingImagesView
        key={`rotating-images-view-${useNativeDriver ? 'native' : 'js'}-driver`}
        useNativeDriver={useNativeDriver}
      />
    </View>
  );
}

export default {
  title: 'Rotating Images',
  name: 'rotatingImages',
  description: 'Simple Animated.Image rotation.',
  expect:
    'Transform animation on image in scale, rotation, and translation. JS driver will ignore any calls to `start` on running animation. Native driver will re-start the animation.',
  render: RotatingImagesExample,
} as RNTesterModuleExample;
