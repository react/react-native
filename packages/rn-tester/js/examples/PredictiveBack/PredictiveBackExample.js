/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useMemo} from 'react';
import {
  Animated,
  Platform,
  PredictiveBackAnimatedView,
  StyleSheet,
  View,
  useAnimatedValue,
} from 'react-native';

function PredictiveBackAnimatedExample(): React.Node {
  const progress = useAnimatedValue(0);
  const onProgress = useMemo(
    () => Animated.event([{nativeEvent: {progress}}], {useNativeDriver: true}),
    [progress],
  );
  const boxStyle = useMemo(
    () => [
      styles.box,
      {
        transform: [
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.82],
            }),
          },
          {
            translateX: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 28],
            }),
          },
        ],
      },
    ],
    [progress],
  );

  return (
    <View style={styles.container}>
      <RNTesterText>
        Swipe from the edge and hold. The box is driven by
        PredictiveBackAnimatedView through Animated.event and the native
        driver.
      </RNTesterText>
      {Platform.OS === 'android' ? (
        <PredictiveBackAnimatedView onProgress={onProgress} />
      ) : null}
      <Animated.View style={boxStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingVertical: 8,
  },
  box: {
    marginTop: 16,
    width: 120,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
  },
});

exports.title = 'PredictiveBack';
exports.category = 'Android';
exports.description =
  'Drive RN Animated from Android predictive-back progress with PredictiveBackAnimatedView and Animated.event.';
exports.examples = [
  {
    title: 'PredictiveBackAnimatedView',
    description:
      'Native-driver progress from the system back gesture. Requires API 34+ gesture navigation.',
    platform: 'android',
    render(): React.Node {
      return <PredictiveBackAnimatedExample />;
    },
  },
] as Array<RNTesterModuleExample>;
