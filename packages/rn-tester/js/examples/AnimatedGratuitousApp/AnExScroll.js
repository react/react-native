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
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

class AnExScroll extends React.Component<$FlowFixMe, any> {
  state: any = {scrollX: new Animated.Value(0)};

  render(): React.Node {
    const width = this.props.panelWidth;
    return (
      <View style={styles.container}>
        <ScrollView
          automaticallyAdjustContentInsets={false}
          scrollEventThrottle={16 /* get all events */}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {x: this.state.scrollX}}}], // nested event mapping
            {useNativeDriver: false},
          )}
          contentContainerStyle={{flex: 1, padding: 10}}
          pagingEnabled={true}
          horizontal={true}>
          <View style={[styles.page, {width}]}>
            <Image style={{width: 180, height: 180}} source={HAWK_PIC} />
            <Text style={styles.text}>
              {"I'll find something to put here."}
            </Text>
          </View>
          <View style={[styles.page, {width}]}>
            <Text style={styles.text}>{'And here.'}</Text>
          </View>
          <View style={[styles.page, {width}]}>
            <Text>{'But not here.'}</Text>
          </View>
        </ScrollView>
        <Animated.Image
          pointerEvents="none"
          style={[
            styles.bunny,
            {
              transform: [
                {
                  translateX: this.state.scrollX.interpolate({
                    inputRange: [0, width, 2 * width],
                    outputRange: [0, 0, width / 3],
                    extrapolate: 'clamp',
                  }),
                },
                {
                  translateY: this.state.scrollX.interpolate({
                    inputRange: [0, width, 2 * width],
                    outputRange: [0, -200, -260],
                    extrapolate: 'clamp',
                  }),
                },
                {
                  scale: this.state.scrollX.interpolate({
                    inputRange: [0, width, 2 * width],
                    outputRange: [0.5, 0.5, 2],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
          source={BUNNY_PIC}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  text: {
    padding: 4,
    paddingBottom: 10,
    fontWeight: 'bold',
    fontSize: 18,
    backgroundColor: 'transparent',
  },
  bunny: {
    backgroundColor: 'transparent',
    position: 'absolute',
    height: 160,
    width: 160,
  },
  page: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});

const HAWK_PIC = {
  uri: 'https://scontent-sea1-1.xx.fbcdn.net/hphotos-xfa1/t39.1997-6/10734304_1562225620659674_837511701_n.png',
};
const BUNNY_PIC = {
  uri: 'https://scontent-sea1-1.xx.fbcdn.net/hphotos-xaf1/t39.1997-6/851564_531111380292237_1898871086_n.png',
};

export default AnExScroll;
