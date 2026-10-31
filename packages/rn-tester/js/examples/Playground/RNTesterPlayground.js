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

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useEffect, useMemo, useState} from 'react';
import {
  Animated,
  BackHandler,
  Platform,
  PredictiveBackAnimatedView,
  StyleSheet,
  View,
  useAnimatedValue,
} from 'react-native';

function Playground() {
  const [events, setEvents] = useState<$ReadOnlyArray<string>>([]);
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

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        const line = `${new Date().toISOString()} hardwareBackPress`;
        console.log('[PredictiveBack]', line);
        setEvents(current => [line, ...current].slice(0, 8));
        // Let RNTester's root handler pop this example. Return true only
        // if you want to consume and stay here.
        return false;
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <RNTesterText style={styles.title}>Predictive back</RNTesterText>
      <RNTesterText>
        The blue box is driven by PredictiveBackAnimatedView + Animated.event
        (native driver). Swipe from the edge: the box should shrink.
      </RNTesterText>
      {Platform.OS === 'android' ? (
        <PredictiveBackAnimatedView onProgress={onProgress} />
      ) : null}
      <Animated.View style={boxStyle} />
      <RNTesterText style={styles.logTitle}>JS events</RNTesterText>
      {events.length === 0 ? (
        <RNTesterText variant="caption">
          None yet. Watch Metro if the app closes too quickly to read this.
        </RNTesterText>
      ) : (
        events.map(event => (
          <RNTesterText key={event} variant="caption">
            {event}
          </RNTesterText>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    gap: 8,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  logTitle: {
    fontWeight: '700',
    marginTop: 12,
  },
  box: {
    marginTop: 16,
    width: 120,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
