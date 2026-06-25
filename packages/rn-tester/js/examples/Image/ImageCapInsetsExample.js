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

const React = require('react');
const ReactNative = require('react-native');
const nativeImageSource =
  require('react-native/Libraries/Image/nativeImageSource').default;

const {Image, StyleSheet, Text, View} = ReactNative;

type Props = Readonly<{}>;
class ImageCapInsetsExample extends React.Component<Props> {
  render(): React.Node {
    return (
      <View>
        <View style={styles.background}>
          <Text>capInsets: none</Text>
          <Image
            source={nativeImageSource({
              ios: 'story-background',
              width: 60,
              height: 60,
            })}
            style={styles.storyBackground}
            resizeMode="stretch"
            capInsets={{left: 0, right: 0, bottom: 0, top: 0}}
          />
        </View>
        <View style={[styles.background, {paddingTop: 10}]}>
          <Text>capInsets: 15</Text>
          <Image
            source={nativeImageSource({
              ios: 'story-background',
              width: 60,
              height: 60,
            })}
            style={styles.storyBackground}
            resizeMode="stretch"
            capInsets={{left: 15, right: 15, bottom: 15, top: 15}}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#F6F6F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyBackground: {
    width: 250,
    height: 150,
    borderWidth: 1,
  },
});

module.exports = ImageCapInsetsExample;
