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

component AnimatedView(useNativeDriver: boolean) {
  const animations = [];

  const animatedViewStyle = {
    backgroundColor: new Animated.Color('blue'),
    borderColor: new Animated.Color('orange'),
  };
  animations.push(
    Animated.timing(animatedViewStyle.backgroundColor, {
      toValue: new Animated.Color('red'),
      duration: 1000,
      useNativeDriver,
    }),
  );
  animations.push(
    Animated.timing(animatedViewStyle.borderColor, {
      toValue: new Animated.Color('purple'),
      duration: 1000,
      useNativeDriver,
    }),
  );

  const animatedBaseValue = new Animated.Value(0);
  const interpolationAnimatedStyle = {
    backgroundColor: animatedBaseValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['blue', 'red'],
    }),
    borderColor: animatedBaseValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['orange', 'purple'],
    }),
  };
  animations.push(
    Animated.timing(animatedBaseValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver,
    }),
  );

  const animatedFirstSpanTextStyle = {
    color: new Animated.Color('blue'),
  };
  animations.push(
    Animated.timing(animatedFirstSpanTextStyle.color, {
      toValue: new Animated.Color('red'),
      duration: 1000,
      useNativeDriver,
    }),
  );

  const animatedSecondSpanTextStyle = {
    color: new Animated.Color('orange'),
  };
  animations.push(
    Animated.timing(animatedSecondSpanTextStyle.color, {
      toValue: new Animated.Color('purple'),
      duration: 1000,
      useNativeDriver,
    }),
  );

  const animatedImageStyle = {
    tintColor: new Animated.Color('blue'),
  };
  animations.push(
    Animated.timing(animatedImageStyle.tintColor, {
      toValue: new Animated.Color('red'),
      duration: 1000,
      useNativeDriver,
    }),
  );

  const animation = Animated.parallel(animations);

  return (
    <>
      <RNTesterButton
        onPress={() => {
          animation.reset();
          animation.start();
        }}>
        Press to animate
      </RNTesterButton>
      <View style={styles.boxes}>
        <Animated.View style={[styles.animatedView, animatedViewStyle]} />
        <Animated.View
          style={[styles.animatedView, interpolationAnimatedStyle]}
        />
      </View>
      <Text style={styles.animatedText}>
        <Text>The </Text>
        <Animated.Text style={animatedFirstSpanTextStyle}>quick</Animated.Text>
        <Text> brown </Text>
        <Animated.Text style={animatedSecondSpanTextStyle}>fox</Animated.Text>
        <Text> jumps over the lazy dog</Text>
      </Text>
      <Animated.Image
        style={[styles.animatedImage, animatedImageStyle]}
        source={require('../../assets/bunny.png')}
      />
    </>
  );
}

component AnimatedColorStyleExample() {
  const [useNativeDriver, setUseNativeDriver] = useState(false);

  return (
    <View>
      <RNTConfigurationBlock>
        <ToggleNativeDriver
          value={useNativeDriver}
          onValueChange={setUseNativeDriver}
        />
      </RNTConfigurationBlock>
      <AnimatedView
        key={`animated-view-use-${useNativeDriver ? 'native' : 'js'}-driver`}
        useNativeDriver={useNativeDriver}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  animatedView: {
    height: 100,
    width: 100,
    borderWidth: 10,
    marginRight: 10,
  },
  animatedText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  animatedImage: {
    height: 100,
    width: 100,
  },
  boxes: {
    flexDirection: 'row',
  },
});

export default {
  title: 'Color Styles',
  name: 'colorStyles',
  description: 'Animations of color styles.',
  render: () => <AnimatedColorStyleExample />,
} as RNTesterModuleExample;
