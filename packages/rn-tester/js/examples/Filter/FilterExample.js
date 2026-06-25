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

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

import * as React from 'react';
import {useState} from 'react';
import {
  Animated,
  Button,
  Image,
  StyleSheet,
  Text,
  View,
  useAnimatedValue,
} from 'react-native';

const alphaHotdog = require('../../assets/alpha-hotdog.png');
const hotdog = require('../../assets/hotdog.jpg');

type Props = Readonly<{
  style?: ViewStyleProp,
  testID?: string,
  imageSource?: number,
}>;

function StaticViewAndImage(props: Props): React.Node {
  return (
    <View style={styles.verticalContainer} testID={props.testID}>
      <View style={[props.style, styles.commonView]}>
        <View style={styles.subview}>
          <View style={styles.subsubview} />
          <Text>Hello world!</Text>
        </View>
      </View>
      {/* $FlowFixMe[incompatible-use] - ImageStyle is not compatible with ViewStyle */}
      <Image
        source={props.imageSource ?? hotdog}
        style={[props.style, styles.commonImage]}
        resizeMode="contain"
      />
    </View>
  );
}

function StaticViewAndImageComparison(props: Props): React.Node {
  return (
    <View style={styles.container} testID={props.testID}>
      <StaticViewAndImage imageSource={props.imageSource} style={props.style} />
      <StaticViewAndImage imageSource={props.imageSource} />
    </View>
  );
}

function StaticViewAndImageWithState(props: Props): React.Node {
  const [s, setS] = useState(true);
  setTimeout(() => setS(!s), 5000);

  return (
    <StaticViewAndImageComparison
      style={s ? [props.style] : null}
      testID={props.testID}
    />
  );
}

const styles = StyleSheet.create({
  blurWithShadow: {
    filter: [{blur: 10 as string | number}],
    boxShadow: '0 0 10px 10px black',
    overflow: 'hidden',
    backgroundColor: 'pink',
    height: 100,
    width: 100,
  },
  commonView: {
    width: 150,
    height: 150,
    backgroundColor: '#275752',
  },
  commonImage: {
    width: 150,
    height: 90,
  },
  subview: {
    width: 75,
    height: 75,
    backgroundColor: '#8d2b8f',
  },
  subsubview: {
    width: 38.5,
    height: 38.5,
    backgroundColor: '#32a840',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  verticalContainer: {
    justifyContent: 'space-around',
  },
});

exports.title = 'Filter';
exports.category = 'UI';
exports.description =
  'A set of graphical effects that can be applied to a view.';
exports.examples = [
  {
    title: 'Brightness',
    description: 'brightness(1.5)',
    name: 'brightness',
    render(): React.Node {
      return (
        <StaticViewAndImageComparison
          style={{filter: [{brightness: 1.5}]}}
          testID="filter-test-brightness"
        />
      );
    },
  },
  {
    title: 'Opacity',
    description: 'opacity(0.5)',
    name: 'opacity',
    render(): React.Node {
      return (
        <StaticViewAndImageComparison
          style={{filter: [{opacity: 0.5}]}}
          testID="filter-test-opacity"
        />
      );
    },
  },
  {
    title: 'Contrast',
    description: 'contrast(0.5)',
    name: 'contrast',
    render(): React.Node {
      return (
        <StaticViewAndImageComparison
          style={{filter: [{contrast: 0.5}]}}
          testID="filter-test-contrast"
        />
      );
    },
  },
  {
    title: 'Sepia',
    description: 'sepia(0.5)',
    name: 'sepia',
    platform: 'android',
    render(): React.Node {
      return (
        <StaticViewAndImageComparison
          style={{filter: [{sepia: 0.5}]}}
          testID="filter-test-sepia"
        />
      );
    },
  },
  {
    title: 'Grayscale',
    description: 'grayscale(0.5)',
    name: 'grayscale',
    render(): React.Node {
      return (
        <StaticViewAndImageComparison
          style={{filter: [{grayscale: 0.5}]}}
          testID="filter-test-grayscale"
        />
      );
    },
  },
  {
    title: 'Saturate',
    description: 'saturate(4)',
    name: 'saturate',
    render(): React.Node {
      return (
        <StaticViewAndImageComparison
          style={{filter: [{saturate: 4}]}}
          testID="filter-test-saturate"
        />
      );
    },
  },
  {
    title: 'Hue Rotate',
    description: 'hueRotate(-90deg)',
    name: 'hueRotate',
    render(): React.Node {
      return (
        <StaticViewAndImageComparison
          style={{filter: [{hueRotate: '-90deg'}]}}
          testID="filter-test-hue-rotate"
        />
      );
    },
  },
  {
    title: 'Invert',
    description: 'invert(0.7)',
    name: 'invert',
    platform: 'android',
    render(): React.Node {
      return (
        <StaticViewAndImageComparison
          style={{filter: [{invert: 0.7}]}}
          testID="filter-test-invert"
        />
      );
    },
  },
  {
    title: 'Blur',
    description: 'blur(10)',
    name: 'blur',
    render(): React.Node {
      return (
        <StaticViewAndImageComparison
          style={{filter: [{blur: 10}]}}
          testID="filter-test-blur"
        />
      );
    },
  },
  {
    title: 'Blur with boxShadow + overflow hidden + outline',
    description: 'This tests container view with blur and outline on iOS',
    name: 'blur-with-overflow',
    render(): React.Node {
      return (
        <View
          style={styles.blurWithShadow}
          testID="filter-test-blur-overflow-hidden"
        />
      );
    },
  },
  {
    title: 'Animated Blur',
    description: 'Animated blur',
    name: 'animated-blur',
    render(): React.Node {
      return <AnimatedBlurExample />;
    },
  },
  {
    title: 'Drop Shadow',
    description: 'drop-shadow(30px 10px 4px #4444dd)',
    name: 'drop-shadow',
    render(): React.Node {
      return (
        <StaticViewAndImageComparison
          style={{
            filter: [{dropShadow: '30px 10px 4px #4444dd'}],
          }}
          testID="filter-test-drop-shadow"
          imageSource={alphaHotdog}
        />
      );
    },
  },
  {
    title: 'Chained filters',
    description: 'brightness(1.5) opacity(0.5)',
    name: 'chained-filters',
    render(): React.Node {
      return (
        <StaticViewAndImageComparison
          style={{filter: [{brightness: 1.5}, {opacity: 0.5}]}}
          testID="filter-test-chain"
        />
      );
    },
  },
  {
    title: 'Filters with state updates',
    description: 'Turn brightness(1.5) on and off every 5 seconds',
    render(): React.Node {
      return (
        <StaticViewAndImageWithState style={{filter: [{brightness: 1.5}]}} />
      );
    },
  },
  {
    title: 'Filters with transforms',
    description: 'Scaling transform with filter',
    name: 'scaling-transforms',
    render(): React.Node {
      return (
        <StaticViewAndImage
          style={{transform: [{scale: 1.2}], filter: [{brightness: 1.5}]}}
          testID="filter-test-transforms"
          imageSource={alphaHotdog}
        />
      );
    },
  },
] as Array<RNTesterModuleExample>;

const AnimatedBlurExample = () => {
  const animatedValue = useAnimatedValue(0);
  const [isBlurred, setIsBlurred] = React.useState(false);

  const onPress = () => {
    Animated.timing(animatedValue, {
      toValue: isBlurred ? 0 : 20,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => setIsBlurred(!isBlurred));
  };

  return (
    <View style={{flexDirection: 'column', alignItems: 'center'}}>
      <Button
        onPress={onPress}
        title={isBlurred ? 'Remove Blur' : 'Animate Blur'}
        testID="animated-blur-button"
      />
      <Animated.View
        testID="animated-blur-view"
        style={[
          {
            filter: [{blur: animatedValue}],
            backgroundColor: 'pink',
            height: 100,
            width: 100,
          },
        ]}
      />
    </View>
  );
};
