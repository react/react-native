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

import type {
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';

import * as React from 'react';
import {Animated, PanResponder, StyleSheet, View} from 'react-native';

class AnExChained extends React.Component<Object, any> {
  constructor(props: Object) {
    super(props);
    this.state = {
      stickers: [new Animated.ValueXY()], // 1 leader
    };
    const stickerConfig = {tension: 2, friction: 3}; // soft spring
    for (let i = 0; i < 4; i++) {
      // 4 followers
      const sticker = new Animated.ValueXY();
      Animated.spring(sticker, {
        ...stickerConfig,

        // Animated toValue's are tracked
        toValue: this.state.stickers[i],

        useNativeDriver: false,
      }).start();
      this.state.stickers.push(sticker); // push on the followers
    }
    const releaseChain = (
      e: GestureResponderEvent,
      gestureState: PanResponderGestureState,
    ) => {
      this.state.stickers[0].flattenOffset(); // merges offset into value and resets
      Animated.sequence([
        // spring to start after decay finishes
        Animated.decay(this.state.stickers[0], {
          // coast to a stop
          velocity: {x: gestureState.vx, y: gestureState.vy},

          deceleration: 0.997,
          useNativeDriver: false,
        }),
        Animated.spring(this.state.stickers[0], {
          // return to start
          toValue: {x: 0, y: 0},

          useNativeDriver: false,
        }),
      ]).start();
    };
    this.state.chainResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        this.state.stickers[0].stopAnimation(value => {
          this.state.stickers[0].setOffset(value); // start where sticker animated to
          this.state.stickers[0].setValue({x: 0, y: 0}); // avoid flicker before next event
        });
      },
      onPanResponderMove: Animated.event(
        [null, {dx: this.state.stickers[0].x, dy: this.state.stickers[0].y}], // map gesture to leader
        {useNativeDriver: false},
      ),
      onPanResponderRelease: releaseChain,
      onPanResponderTerminate: releaseChain,
    });
  }

  render(): React.Node {
    return (
      <View style={styles.chained}>
        {this.state.stickers.map((_, i) => {
          const j = this.state.stickers.length - i - 1; // reverse so leader is on top
          const handlers = j === 0 ? this.state.chainResponder.panHandlers : {};
          return (
            <Animated.Image
              {...handlers}
              key={i}
              source={CHAIN_IMGS[j]}
              style={[
                styles.sticker,
                {
                  transform: this.state.stickers[j].getTranslateTransform(), // simple conversion
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
  chained: {
    alignSelf: 'flex-end',
    top: -160,
    right: 126,
  },
  sticker: {
    position: 'absolute',
    height: 120,
    width: 120,
    backgroundColor: 'transparent',
  },
});

const CHAIN_IMGS = [
  require('../../assets/hawk.png'),
  require('../../assets/bunny.png'),
  require('../../assets/relay.png'),
  require('../../assets/hawk.png'),
  require('../../assets/bunny.png'),
];

export default AnExChained;
