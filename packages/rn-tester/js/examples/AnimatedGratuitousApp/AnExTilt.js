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

import * as React from 'react';
import {useCallback, useEffect} from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  useAnimatedValue,
} from 'react-native';

const AnExTilt = (): React.Node => {
  const panX = useAnimatedValue(0);
  const opacity = useAnimatedValue(1);
  const burns = useAnimatedValue(1.15);

  const tiltPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      Animated.timing(opacity, {
        toValue: panX.interpolate({
          inputRange: [-300, 0, 300], // pan is in pixels
          outputRange: [0, 1, 0], // goes to zero at both edges
        }),

        // direct tracking
        duration: 0,

        useNativeDriver: false,
      }).start();
    },
    onPanResponderMove: Animated.event(
      [null, {dx: panX}], // panX is linked to the gesture
      {useNativeDriver: false},
    ),
    onPanResponderRelease: (e, gestureState) => {
      let toValue = 0;
      if (gestureState.dx > 100) {
        toValue = 500;
      } else if (gestureState.dx < -100) {
        toValue = -500;
      }
      Animated.spring(panX, {
        // animate back to center or off screen
        toValue,

        // maintain gesture velocity
        velocity: gestureState.vx,

        tension: 10,
        friction: 3,
        useNativeDriver: false,
      }).start();

      panX.removeAllListeners();
      const id: any = panX.addListener(({value}) => {
        // listen until offscreen
        if (Math.abs(value) > 400) {
          panX.removeListener(id); // offscreen, so stop listening
          Animated.timing(opacity, {
            // Fade back in. This unlinks it from tracking panX
            toValue: 1,

            useNativeDriver: false,
          }).start();
          panX.setValue(0); // Note: stops the spring animation
          toValue !== 0 && startBurnsZoom();
        }
      });
    },
  });

  const startBurnsZoom = useCallback(() => {
    burns.setValue(1); // reset to beginning
    Animated.decay(burns, {
      // subtle zoom
      velocity: 1,

      // slow decay
      deceleration: 0.9999,

      useNativeDriver: false,
    }).start();
  }, [burns]);

  useEffect(() => {
    startBurnsZoom();
  }, [startBurnsZoom]);

  return (
    <Animated.View
      {...tiltPanResponder.panHandlers}
      style={[
        styles.tilt,
        {
          opacity,
          transform: [
            {
              rotate: panX.interpolate({
                inputRange: [-320, 320],
                outputRange: ['-15deg', '15deg'],
              }),
            }, // interpolate string "shapes"
            {translateX: panX},
          ],
        },
      ]}>
      <Animated.Image
        pointerEvents="none"
        style={{
          flex: 1,
          transform: [
            {
              translateX: panX.interpolate({
                inputRange: [-3, 3], // small range is extended by default
                outputRange: [2, -2],
              }), // parallax
            },
            {
              scale: burns.interpolate({
                inputRange: [1, 3000],
                outputRange: [1, 1.25],
              }), // simple multiplier
            },
          ],
        }}
        source={require('../../assets/trees.jpg')}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tilt: {
    overflow: 'hidden',
    height: 200,
    marginBottom: 4,
    backgroundColor: 'rgb(130, 130, 255)',
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderRadius: 20,
  },
});

export default AnExTilt;
