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
import {Animated, PanResponder, StyleSheet, View} from 'react-native';

const NUM_BOBBLES = 5;
const RAD_EACH = Math.PI / 2 / (NUM_BOBBLES - 2);
const RADIUS = 160;
const BOBBLE_SPOTS = [...Array(NUM_BOBBLES)].map((_, i) => {
  // static positions
  return i === 0
    ? {x: 0, y: 0}
    : {
        // first bobble is the selector
        x: -Math.cos(RAD_EACH * (i - 1)) * RADIUS,
        y: -Math.sin(RAD_EACH * (i - 1)) * RADIUS,
      };
});

class AnExBobble extends React.Component<Object, any> {
  constructor(props: Object) {
    super(props);
    this.state = {};
    // $FlowFixMe[prop-missing]
    this.state.bobbles = BOBBLE_SPOTS.map((_, i) => {
      return new Animated.ValueXY();
    });
    this.state.selectedBobble = null;
    const bobblePanListener = (e: any, gestureState: any) => {
      // async events => change selection
      const newSelected = computeNewSelected(gestureState);
      if (this.state.selectedBobble !== newSelected) {
        if (this.state.selectedBobble !== null) {
          const restSpot = BOBBLE_SPOTS[this.state.selectedBobble];
          Animated.spring(this.state.bobbles[this.state.selectedBobble], {
            // return previously selected bobble to rest position
            toValue: restSpot,

            useNativeDriver: false,
          }).start();
        }
        if (newSelected !== null && newSelected !== 0) {
          Animated.spring(this.state.bobbles[newSelected], {
            // newly selected should track the selector
            toValue: this.state.bobbles[0],

            useNativeDriver: false,
          }).start();
        }
        this.state.selectedBobble = newSelected;
      }
    };
    const releaseBobble = () => {
      this.state.bobbles.forEach((bobble, i) => {
        Animated.spring(bobble, {
          // all bobbles return to zero
          toValue: {x: 0, y: 0},

          useNativeDriver: false,
        }).start();
      });
    };
    this.state.bobbleResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        BOBBLE_SPOTS.forEach((spot, idx) => {
          Animated.spring(this.state.bobbles[idx], {
            // spring each bobble to its spot
            toValue: spot,

            // less friction => bouncier
            friction: 3,

            useNativeDriver: false,
          }).start();
        });
      },
      onPanResponderMove: Animated.event(
        [null, {dx: this.state.bobbles[0].x, dy: this.state.bobbles[0].y}],
        {listener: bobblePanListener, useNativeDriver: false}, // async state changes with arbitrary logic
      ),
      onPanResponderRelease: releaseBobble,
      onPanResponderTerminate: releaseBobble,
    });
  }

  render(): React.Node {
    return (
      <View style={styles.bobbleContainer}>
        {this.state.bobbles.map((_, i) => {
          const j = this.state.bobbles.length - i - 1; // reverse so lead on top
          const handlers = j > 0 ? {} : this.state.bobbleResponder.panHandlers;
          return (
            <Animated.Image
              {...handlers}
              key={i}
              source={{uri: BOBBLE_IMGS[j]}}
              style={[
                styles.circle,
                {
                  backgroundColor: randColor(), // re-renders are obvious
                  transform: this.state.bobbles[j].getTranslateTransform(), // simple conversion
                },
              ]}
            />
          );
        })}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    height: 60,
    width: 60,
    borderRadius: 30,
    borderWidth: 0.5,
  },
  bobbleContainer: {
    top: -68,
    paddingRight: 66,
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
});

function computeNewSelected(gestureState: Object): ?number {
  const {dx, dy} = gestureState;
  let minDist = Infinity;
  let newSelected = null;
  const pointRadius = Math.sqrt(dx * dx + dy * dy);
  if (Math.abs(RADIUS - pointRadius) < 80) {
    BOBBLE_SPOTS.forEach((spot, idx) => {
      const delta = {x: spot.x - dx, y: spot.y - dy};
      const dist = delta.x * delta.x + delta.y * delta.y;
      if (dist < minDist) {
        minDist = dist;
        newSelected = idx;
      }
    });
  }
  return newSelected;
}

function randColor(): string {
  const colors = [0, 1, 2].map(() => Math.floor(Math.random() * 150 + 100));
  return 'rgb(' + colors.join(',') + ')';
}

const BOBBLE_IMGS = [
  'https://scontent-sea1-1.xx.fbcdn.net/hphotos-xpf1/t39.1997-6/10173489_272703316237267_1025826781_n.png',
  'https://scontent-sea1-1.xx.fbcdn.net/hphotos-xaf1/l/t39.1997-6/p240x240/851578_631487400212668_2087073502_n.png',
  'https://scontent-sea1-1.xx.fbcdn.net/hphotos-xaf1/t39.1997-6/p240x240/851583_654446917903722_178118452_n.png',
  'https://scontent-sea1-1.xx.fbcdn.net/hphotos-xaf1/t39.1997-6/p240x240/851565_641023175913294_875343096_n.png',
  'https://scontent-sea1-1.xx.fbcdn.net/hphotos-xaf1/t39.1997-6/851562_575284782557566_1188781517_n.png',
];

export default AnExBobble;
