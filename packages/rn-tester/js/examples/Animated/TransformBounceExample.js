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
import {Animated, StyleSheet, Text, View} from 'react-native';

const styles = StyleSheet.create({
  content: {
    backgroundColor: 'deepskyblue',
    borderWidth: 1,
    borderColor: 'dodgerblue',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
});

component TransformBounceView(useNativeDriver: boolean) {
  const anim = new Animated.Value(0);
  const bounceAnimation = Animated.spring(anim, {
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
          bounceAnimation.start();
        }}>
        Press to Fling it!
      </RNTesterButton>
      <Animated.View
        style={[
          styles.content,
          {
            transform: [
              // Array order matters
              {
                scale: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 4],
                }),
              },
              {
                translateX: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 500],
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
        ]}>
        <Text>Transforms!</Text>
      </Animated.View>
    </>
  );
}

component TransformBounceExample() {
  const [useNativeDriver, setUseNativeDriver] = useState(false);

  return (
    <View>
      <RNTConfigurationBlock>
        <ToggleNativeDriver
          value={useNativeDriver}
          onValueChange={setUseNativeDriver}
        />
      </RNTConfigurationBlock>
      <TransformBounceView
        key={`transform-bounce-view-${
          useNativeDriver ? 'native' : 'js'
        }-driver`}
        useNativeDriver={useNativeDriver}
      />
    </View>
  );
}

export default {
  title: 'Transform Bounce',
  name: 'transformBounce',
  expect: 'Transform animation on rotation, translation, scale of View',
  description: ('One `Animated.Value` is driven by a ' +
    'spring with custom constants and mapped to an ' +
    'ordered set of transforms.  Each transform has ' +
    'an interpolation to convert the value into the ' +
    'right range and units.') as string,
  render: () => <TransformBounceExample />,
} as RNTesterModuleExample;
