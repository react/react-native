/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import AnExBobble from './AnExBobble';
import AnExChained from './AnExChained';
import AnExScroll from './AnExScroll';
import AnExTilt from './AnExTilt';
import * as React from 'react';
import {useState} from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
  useAnimatedValue,
} from 'react-native';

const randColor = () => {
  const colors = [0, 1, 2].map(() => Math.floor(Math.random() * 150 + 100));
  return `rgb(${colors.join(',')})`;
};

type AnExSetProps = Readonly<{
  openVal: Animated.Value,
  containerLayout: {width: number, height: number},
  id: string,
  isActive: boolean,
  onDismiss: (velocity: number) => void,
}>;

const AnExSet = ({
  openVal,
  containerLayout,
  id,
  isActive,
  onDismiss,
}: AnExSetProps): React.Node => {
  const [closeColor] = useState(randColor());
  const [openColor] = useState(randColor());
  const dismissY = useAnimatedValue(0);

  const dismissResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => isActive,
    onPanResponderGrant: () => {
      Animated.spring(openVal, {
        // Animated value passed in.
        toValue: dismissY.interpolate({
          // Track dismiss gesture
          inputRange: [0, 300], // and interpolate pixel distance
          outputRange: [1, 0], // to a fraction.
        }),
        useNativeDriver: false,
      }).start();
    },
    onPanResponderMove: Animated.event(
      [null, {dy: dismissY}], // track pan gesture
      {useNativeDriver: false},
    ),
    onPanResponderRelease: (e, gestureState) => {
      if (gestureState.dy > 100) {
        onDismiss(gestureState.vy); // delegates dismiss action to parent
      } else {
        Animated.spring(openVal, {
          // animate back open if released early
          toValue: 1,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const backgroundColor = openVal
    ? openVal.interpolate({
        inputRange: [0, 1],
        outputRange: [
          closeColor, // interpolates color strings
          openColor,
        ],
      })
    : closeColor;

  const panelWidth = (containerLayout && containerLayout.width) || 320;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.header, {backgroundColor}]}
        {...dismissResponder.panHandlers}>
        <Text style={[styles.text, styles.headerText]}>{id}</Text>
      </Animated.View>
      {isActive && (
        <View style={styles.stream}>
          <View style={styles.card}>
            <Text style={styles.text}>July 2nd</Text>
            <AnExTilt isActive={isActive} />
            <AnExBobble />
          </View>
          <AnExScroll panelWidth={panelWidth} />
          <AnExChained />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 18,
    height: 90,
  },
  stream: {
    flex: 1,
    backgroundColor: 'rgb(230, 230, 230)',
  },
  card: {
    margin: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'white',
    shadowRadius: 2,
    shadowColor: 'black',
    shadowOpacity: 0.2,
    shadowOffset: {height: 0.5},
  },
  text: {
    padding: 4,
    paddingBottom: 10,
    fontWeight: 'bold',
    fontSize: 18,
    backgroundColor: 'transparent',
  },
  headerText: {
    fontSize: 25,
    color: 'white',
    textShadowRadius: 3,
    textShadowColor: 'rgba(0, 0, 0, 1.0)',
    textShadowOffset: {height: 1, width: 0},
  },
});

export default AnExSet;
