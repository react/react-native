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
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const LOCAL_MASK = require('../../assets/imageMask.png');

const REMOTE_MASK = 'https://reactnative.dev/img/tiny_logo.png';

function MaskBox({
  style,
  children,
  testID,
}: {
  style?: ViewStyleProp,
  children?: React.Node,
  testID: string,
}) {
  return (
    <View style={[styles.box, style]} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 200,
    height: 100,
    backgroundColor: '#4ecdc4',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  square: {
    width: 150,
    height: 150,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  image: {
    width: 150,
    height: 150,
  },
  textInput: {
    width: 200,
    borderWidth: 1,
    borderColor: '#999',
    padding: 8,
    marginVertical: 10,
  },
  scrollView: {
    width: 200,
    height: 160,
    borderWidth: 1,
    borderColor: '#999',
    marginVertical: 10,
  },
  scrollRow: {
    padding: 8,
    fontSize: 18,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
  },
});

exports.title = 'Mask';
exports.category = 'UI';
exports.description =
  'Examples of the mask-image, mask-size, mask-position and mask-repeat styles.';
exports.examples = [
  {
    title: 'Linear gradient mask',
    description: 'Fades the view out towards its right edge.',
    name: 'linear-gradient',
    render(): React.Node {
      return (
        <MaskBox
          style={{
            maskImage: 'linear-gradient(to right, black, transparent)',
          }}
          testID="mask-linear-gradient">
          <Text style={styles.text}>Fade</Text>
        </MaskBox>
      );
    },
  },
  {
    title: 'Radial gradient mask',
    description: 'Reveals the view through a circular hole.',
    name: 'radial-gradient',
    render(): React.Node {
      return (
        <MaskBox
          style={[
            styles.square,
            {maskImage: 'radial-gradient(circle, black 40%, transparent 70%)'},
          ]}
          testID="mask-radial-gradient"
        />
      );
    },
  },
  {
    title: 'Gradient stops',
    description:
      'Multiple colour stops punch a transparent band out of the middle.',
    name: 'gradient-stops',
    render(): React.Node {
      return (
        <MaskBox
          style={{
            maskImage:
              'linear-gradient(115deg, black 10%, transparent 30% 70%, black 90%)',
          }}
          testID="mask-gradient-stops"
        />
      );
    },
  },
  {
    title: 'Local image mask',
    description:
      'A bundled PNG with an alpha channel, stretched over the whole view.',
    name: 'local-image',
    render(): React.Node {
      return (
        <MaskBox
          style={[
            styles.square,
            {
              maskImage: [{type: 'url', uri: LOCAL_MASK}],
              maskRepeat: 'no-repeat',
              maskSize: '100% 100%',
            },
          ]}
          testID="mask-local-image"
        />
      );
    },
  },
  {
    title: 'Remote image mask',
    description:
      'A mask loaded over the network, centred without repeating. The view is ' +
      'unmasked until the image arrives.',
    name: 'remote-image',
    render(): React.Node {
      return (
        <MaskBox
          style={[
            styles.square,
            {
              maskImage: `url(${REMOTE_MASK})`,
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              maskSize: '100px 100px',
            },
          ]}
          testID="mask-remote-image"
        />
      );
    },
  },
  {
    title: 'mask-repeat',
    description: 'The same image tiled across the view.',
    name: 'repeat',
    render(): React.Node {
      return (
        <View style={styles.row}>
          <MaskBox
            style={[
              styles.square,
              {
                maskImage: [{type: 'url', uri: LOCAL_MASK}],
                maskSize: '50px 50px',
                maskRepeat: 'repeat',
              },
            ]}
            testID="mask-repeat-repeat"
          />
          <MaskBox
            style={[
              styles.square,
              {
                maskImage: [{type: 'url', uri: LOCAL_MASK}],
                maskSize: '50px 50px',
                maskRepeat: 'repeat-x',
              },
            ]}
            testID="mask-repeat-repeat-x"
          />
        </View>
      );
    },
  },
  {
    title: 'mask-size and mask-position',
    description: 'A single tile sized and placed in the bottom right corner.',
    name: 'size-position',
    render(): React.Node {
      return (
        <MaskBox
          style={[
            styles.square,
            {
              maskImage: [{type: 'url', uri: LOCAL_MASK}],
              maskRepeat: 'no-repeat',
              maskSize: '60px 60px',
              maskPosition: 'right bottom',
            },
          ]}
          testID="mask-size-position"
        />
      );
    },
  },
  {
    title: 'Multiple mask layers',
    description:
      'Two gradients composite together, so the view shows through where either is opaque.',
    name: 'multiple-layers',
    render(): React.Node {
      return (
        <MaskBox
          style={[
            styles.square,
            {
              maskImage: [
                'radial-gradient(circle at 30% 30%, black 25%, transparent 30%)',
                'radial-gradient(circle at 70% 70%, black 25%, transparent 30%)',
              ].join(', '),
            },
          ]}
          testID="mask-multiple-layers"
        />
      );
    },
  },
  {
    title: 'Mask with border radius',
    description:
      'The mask is clipped by the border box, so rounded corners still apply.',
    name: 'border-radius',
    render(): React.Node {
      return (
        <MaskBox
          style={[
            styles.square,
            {
              borderRadius: 40,
              overflow: 'hidden',
              maskImage: 'linear-gradient(to bottom, black, transparent)',
            },
          ]}
          testID="mask-border-radius"
        />
      );
    },
  },
  {
    title: 'Masked children',
    description:
      'The mask applies to the whole subtree, not just the background.',
    name: 'children',
    render(): React.Node {
      return (
        <MaskBox
          style={[
            styles.square,
            {maskImage: 'linear-gradient(to bottom, black, transparent)'},
          ]}
          testID="mask-children">
          <Image
            source={require('../../assets/bunny.png')}
            style={styles.image}
          />
        </MaskBox>
      );
    },
  },
  {
    title: 'Masked scroll view',
    description:
      'A gradient mask fades the top and bottom edges of a <ScrollView>.',
    name: 'scroll-view',
    render(): React.Node {
      return (
        <ScrollView
          style={[
            styles.scrollView,
            {
              maskImage:
                'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
            },
          ]}
          testID="mask-scroll-view">
          {Array.from({length: 12}, (_, i) => (
            <Text key={i} style={styles.scrollRow}>
              Row {i + 1}
            </Text>
          ))}
        </ScrollView>
      );
    },
  },
  {
    title: 'Masked text',
    description: 'A gradient mask applied to a <Text> component.',
    name: 'text',
    render(): React.Node {
      return (
        <Text
          style={[
            styles.text,
            {
              color: '#333',
              fontSize: 40,
              maskImage: 'linear-gradient(to right, black, transparent)',
            },
          ]}
          testID="mask-text">
          Masked text
        </Text>
      );
    },
  },
  {
    title: 'Masked image',
    description: 'A gradient mask applied to an <Image> component.',
    name: 'image',
    render(): React.Node {
      return (
        <Image
          source={require('../../assets/bunny.png')}
          style={[
            styles.image,
            {maskImage: 'linear-gradient(to right, black, transparent)'},
          ]}
          testID="mask-image"
        />
      );
    },
  },
  {
    title: 'Masked text input',
    description: 'A gradient mask applied to a <TextInput> component.',
    name: 'text-input',
    render(): React.Node {
      return (
        <TextInput
          defaultValue="Masked text input"
          style={[
            styles.textInput,
            {maskImage: 'linear-gradient(to right, black, transparent)'},
          ]}
          testID="mask-text-input"
        />
      );
    },
  },
] as Array<RNTesterModuleExample>;
