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
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

import * as React from 'react';
import {useState} from 'react';
import {Image, ImageBackground, StyleSheet, Text, View} from 'react-native';

type Props = Readonly<{
  style: ViewStyleProp,
  testID?: string,
}>;

function LayeredView(props: Props) {
  return (
    <>
      <View style={styles.container}>
        <View style={[styles.backdrop, {height: 110, backgroundColor: 'red'}]}>
          <View
            style={[
              styles.backdrop,
              {isolation: 'isolate', height: 65, backgroundColor: 'blue'},
            ]}>
            <View style={[styles.commonView, props.style]}>
              <View style={styles.nestedView} />
              <Text>Hello, World!</Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );
}

function LayeredImage(props: Props) {
  return (
    <>
      <View style={styles.container}>
        <ImageBackground
          source={require('../../assets/rainbow.jpeg')}
          style={[styles.backdrop, {width: 200}]}>
          {/* $FlowFixMe[incompatible-use] - ImageStyle is not compatible with ViewStyle */}
          <Image
            source={require('../../assets/alpha-hotdog.png')}
            style={[styles.commonImage, props.style]}
          />
        </ImageBackground>
      </View>
    </>
  );
}

function LayeredViewWithState(props: Props): React.Node {
  const [s, setS] = useState(true);
  setTimeout(() => setS(!s), 5000);

  return <LayeredView style={s ? [props.style] : null} testID={props.testID} />;
}

function LayeredImageWithState(props: Props): React.Node {
  const [s, setS] = useState(true);
  setTimeout(() => setS(!s), 5000);

  return (
    <LayeredImage style={s ? [props.style] : null} testID={props.testID} />
  );
}

const styles = StyleSheet.create({
  commonImage: {
    width: 200,
    height: 100,
    marginLeft: 3,
    marginTop: 3,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  duckContainer: {
    alignSelf: 'center',
    width: 150,
    height: 165,
    backgroundColor: 'lime',
  },
  duck: {
    width: '100%',
    height: '100%',
  },
  backdrop: {
    height: 110,
    width: 110,
  },
  commonView: {
    backgroundColor: 'cyan',
    height: 100,
    width: 100,
    marginTop: 5,
    marginLeft: 5,
  },
  nestedView: {
    backgroundColor: 'purple',
    height: 50,
    width: 50,
  },
});

const mixBlendModes = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
  'plus-lighter',
] as const;

const examples: Array<RNTesterModuleExample> = mixBlendModes.map(mode => ({
  title: mode,
  description: `mix-blend-mode: ${mode}`,
  name: mode,
  render(): React.Node {
    return (
      <View style={styles.container} testID={`mix-blend-mode-test-${mode}`}>
        <LayeredView style={{mixBlendMode: mode}} />
        <LayeredImage style={{mixBlendMode: mode}} />
      </View>
    );
  },
}));

examples.push(
  {
    title: 'Text mix-blend-mode',
    description: 'mix-blend-mode: Text mix-blend-mode',
    name: 'text',
    render(): React.Node {
      return (
        <ImageBackground
          style={[
            styles.duckContainer,
            {backgroundColor: 'orange', padding: 10, height: 100},
          ]}
          testID="mix-blend-mode-test-text">
          <Text
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: 'red',
              mixBlendMode: 'overlay',
            }}>
            'OVERLAY' BLENDING ON TEXT
          </Text>
        </ImageBackground>
      );
    },
  },
  {
    title: 'Spec Example 1',
    description: 'mix-blend-mode: Spec Example 1',
    name: 'spec-example-1',
    render(): React.Node {
      return (
        <View
          style={styles.duckContainer}
          testID="mix-blend-mode-test-spec-example-1">
          <Image
            style={[styles.duck, {mixBlendMode: 'multiply'}]}
            source={require('../../assets/rubber-ducky.png')}
          />
        </View>
      );
    },
  },
  {
    title: 'Spec Example 2',
    description: 'mix-blend-mode: Spec Example 2',
    name: 'spec-example-2',
    render(): React.Node {
      return (
        <View
          style={{alignSelf: 'center'}}
          testID="mix-blend-mode-test-spec-example-2">
          <View style={{width: 120, height: 120}}>
            <View
              style={{
                width: 80,
                height: 80,
                backgroundColor: 'red',
                borderRadius: '100%',
                position: 'absolute',
                isolation: 'isolate',
              }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: 'lime',
                  borderRadius: '100%',
                  position: 'absolute',
                  left: 55,
                  mixBlendMode: 'difference',
                }}
              />
              <View
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: 'blue',
                  borderRadius: '100%',
                  position: 'absolute',
                  top: 40,
                  left: 26,
                  mixBlendMode: 'screen',
                }}
              />
            </View>
          </View>
        </View>
      );
    },
  },
  {
    title: 'Spec Example 3',
    description: 'mix-blend-mode: Spec Example 3',
    name: 'spec-example-3',
    render(): React.Node {
      return (
        <View
          style={styles.duckContainer}
          testID="mix-blend-mode-test-spec-example-3">
          <View
            style={[
              {width: '50%', backgroundColor: 'red', isolation: 'isolate'},
            ]}>
            <Image
              style={[
                styles.duck,
                {
                  mixBlendMode: 'difference',
                  width: 150,
                  height: 165,
                },
              ]}
              source={require('../../assets/rubber-ducky.png')}
            />
          </View>
        </View>
      );
    },
  },
  {
    title: 'mix-blend-mode with state updates',
    description: 'Turn mix-blend-mode difference on and off every 5 seconds',
    render(): React.Node {
      return (
        <View style={styles.container}>
          <LayeredViewWithState style={{mixBlendMode: 'difference'}} />
          <LayeredImageWithState style={{mixBlendMode: 'difference'}} />
        </View>
      );
    },
  },
  {
    title: 'mix-blend-mode & filter',
    description: 'mix-blend-mode & filter',
    name: 'mix-blend-mode-filter',
    render(): React.Node {
      return (
        <View style={styles.container} testID="mix-blend-mode-test-filter">
          <LayeredView
            style={{
              mixBlendMode: 'luminosity',
              filter: 'blur(3px)',
            }}
          />
          <LayeredImage
            style={{
              mixBlendMode: 'difference',
              filter: 'hue-rotate(90deg)',
            }}
          />
        </View>
      );
    },
  },
);

exports.title = 'MixBlendMode';
exports.category = 'UI';
exports.description =
  'A set of graphical effects that can be applied to a view.';
exports.examples = examples;
