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

const React = require('react');
const ReactNative = require('react-native');

const {Component} = React;
const {StyleSheet, Text, View, Animated, Easing, TouchableOpacity, Dimensions} =
  ReactNative;

class ScrollViewAnimatedExample extends Component<{...}> {
  _scrollViewPos: Animated.Value = new Animated.Value(0);

  startAnimation: () => void = () => {
    this._scrollViewPos.setValue(0);
    Animated.timing(this._scrollViewPos, {
      toValue: 100,
      duration: 10000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  render(): React.Node {
    const interpolated = this._scrollViewPos.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.1],
    });
    const interpolated2 = this._scrollViewPos.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '1deg'],
    });
    return (
      <View style={styles.container}>
        <Animated.View
          style={{
            width: 100,
            height: 100,
            backgroundColor: 'black',
            transform: [{translateX: interpolated}, {rotate: interpolated2}],
          }}
        />
        <Animated.ScrollView
          horizontal
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {x: this._scrollViewPos}}}],
            {useNativeDriver: true},
          )}>
          <TouchableOpacity onPress={this.startAnimation}>
            <View style={styles.button}>
              <Text>Scroll me horizontally</Text>
            </View>
          </TouchableOpacity>
        </Animated.ScrollView>
      </View>
    );
  }
}

const {width, height} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  button: {
    margin: 50,
    width: width,
    marginRight: width,
    height: height / 2,
  },
});

exports.title = 'ScrollViewAnimated';
exports.category = 'Basic';
exports.description = 'Component that is animated when ScrollView is offset.';

exports.examples = [
  {
    title: 'Animated by scroll view',
    render(): React.MixedElement {
      return <ScrollViewAnimatedExample />;
    },
  },
] as Array<RNTesterModuleExample>;
