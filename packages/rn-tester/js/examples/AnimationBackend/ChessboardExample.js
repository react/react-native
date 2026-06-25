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

import * as React from 'react';
import {useMemo} from 'react';
import {Animated, StyleSheet, Text, View, useAnimatedValue} from 'react-native';
import {allowStyleProp} from 'react-native/Libraries/Animated/NativeAnimatedAllowlist';

allowStyleProp('width');
allowStyleProp('height');
const colors = ['lime', 'green'];

function useLoop() {
  const animatedValue = useAnimatedValue(0);

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [animatedValue]);

  return animatedValue;
}

const N = 12;
const STATE_MAX = 30;

function ChessboardExample() {
  const [state, setState] = React.useState(0);

  const animatedValue = useLoop();

  React.useEffect(() => {
    const id = setInterval(() => {
      setState(s => (s + 1) % STATE_MAX);
    }, 10);
    return () => {
      clearInterval(id);
    };
  }, []);

  const animatedStyle = useMemo(() => {
    return {
      width: animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [10, 30],
      }),
      height: animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [10, 30],
      }),
    };
  }, [animatedValue]);

  return (
    <View style={styles.workaround} collapsable={false}>
      <Text style={styles.text}>{state}</Text>
      <View style={styles.chessboard}>
        <View style={styles.border}>
          {[...Array(N).keys()].map(i => (
            <View style={styles.row} key={i}>
              {[...Array(N).keys()].map(j => (
                <Animated.View
                  key={j}
                  style={[
                    {
                      opacity: 0.3 + (state / STATE_MAX) * 0.7,
                      backgroundColor: colors[(i + j) % 2],
                    },
                    animatedStyle,
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  workaround: {
    height: 400,
  },
  chessboard: {
    alignItems: 'flex-start',
  },
  border: {
    borderWidth: 10,
    borderColor: 'red',
  },
  row: {
    flexDirection: 'row',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 10,
  },
});

export default {
  title: 'Chessboard',
  name: 'chessboard',
  description: 'Combine animating layout with state updates',
  render: (): React.Node => <ChessboardExample />,
} as RNTesterModuleExample;
