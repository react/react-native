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
import {Animated, StyleSheet, Text, View} from 'react-native';
import * as ReactNativeFeatureFlags from 'react-native/src/private/featureflags/ReactNativeFeatureFlags';

const optimizedAnimatedPropUpdatesEnabled =
  ReactNativeFeatureFlags.optimizedAnimatedPropUpdates();

function FlagIndicator(): React.Node {
  return (
    <View style={styles.flagRow}>
      <Text style={styles.flagLabel}>optimizedAnimatedPropUpdates:</Text>
      <Text
        style={[
          styles.flagValue,
          optimizedAnimatedPropUpdatesEnabled ? styles.flagOn : styles.flagOff,
        ]}>
        {optimizedAnimatedPropUpdatesEnabled ? 'ON' : 'OFF'}
      </Text>
    </View>
  );
}

const ROWS = 20;
const COLS = 10;
const SIZE = 35;

function PerformanceTest() {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['red', 'lime'],
  });

  const borderRadius = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 25],
  });

  // Approximation of Math.pow(2, sv * 3 + 4.5) with piecewise linear interpolation
  const perspective = animatedValue.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [22.63, 38.05, 64, 107.63, 181.02],
  });

  const animatedStyle = {
    borderRadius,
    backgroundColor,
    transform: [{perspective}, {rotateY: '45deg'}],
  };

  return (
    <View style={styles.container}>
      <FlagIndicator />
      {new Array<void>(ROWS).fill().map((_row, i) => (
        <View key={i} style={styles.row}>
          {new Array<void>(COLS).fill().map((_col, j) => (
            <Animated.View key={j} style={[styles.box, animatedStyle]} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  box: {
    backgroundColor: 'navy',
    borderColor: 'pink',
    borderWidth: 1,
    width: SIZE,
    height: SIZE,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  flagLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  flagValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  flagOn: {
    color: '#16a34a',
  },
  flagOff: {
    color: '#dc2626',
  },
});

export default {
  title: 'Performance Test',
  name: 'performance-test',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <PerformanceTest />,
} as RNTesterModuleExample;
