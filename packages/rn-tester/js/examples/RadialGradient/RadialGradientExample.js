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

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {Platform, PlatformColor, StyleSheet, View} from 'react-native';

type Props = Readonly<{
  style: ViewStyleProp,
  testID?: string,
  children?: React.Node,
}>;

function GradientBox(props: Props): React.Node {
  return (
    <View style={[styles.box, props.style]} testID={props.testID}>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});

exports.title = 'Radial Gradient';
exports.category = 'UI';
exports.description = 'Examples of radial gradients applied to views.';
exports.examples = [
  {
    title: 'Basic Radial Gradient',
    description: 'Basic radial gradient with default settings',
    name: 'radial-gradient-1',
    render(): React.Node {
      return (
        <GradientBox
          style={{
            backgroundImage: 'radial-gradient(#e66465, #9198e5)',
          }}
          testID="radial-gradient-basic">
          <RNTesterText style={styles.text}>Radial Gradient</RNTesterText>
        </GradientBox>
      );
    },
  },
  {
    title: 'Radial Gradient with position',
    description: 'Radial gradient at a specific position',
    name: 'radial-gradient-2',
    render(): React.Node {
      return (
        <GradientBox
          style={{
            backgroundImage: 'radial-gradient(at 70% 30%, red, blue)',
          }}
          testID="radial-gradient-position"
        />
      );
    },
  },
  {
    title: 'Radial Gradient with size',
    description: 'Radial gradient with different sizes',
    name: 'radial-gradient-3',
    render(): React.Node {
      return (
        <GradientBox
          style={{
            backgroundImage:
              'radial-gradient(circle closest-side, yellow, green)',
          }}
          testID="radial-gradient-size"
        />
      );
    },
  },
  {
    title: 'Multiple Color Stops',
    name: 'radial-gradient-4',
    render(): React.Node {
      return (
        <GradientBox
          testID="radial-gradient-color-stops"
          style={{
            backgroundImage:
              'radial-gradient(red 0%, yellow 30%, green 60%, blue 100%)',
          }}
        />
      );
    },
  },
  {
    title: 'Radial gradient with object style syntax',
    name: 'radial-gradient-5',
    render(): React.Node {
      return (
        <GradientBox
          testID="radial-gradient-object-style-syntax"
          style={{
            backgroundImage: [
              {
                type: 'radial-gradient',
                shape: 'circle',
                position: {top: 0, right: 0},
                size: 'farthest-corner',
                colorStops: [
                  {color: 'purple', positions: ['0%']},
                  {color: 'orange', positions: ['100%']},
                ],
              },
            ],
          }}
        />
      );
    },
  },
  {
    title: 'Radial Gradient with uniform border style',
    name: 'radial-gradient-6',
    render(): React.Node {
      return (
        <GradientBox
          testID="radial-gradient-with-uniform-borders"
          style={{
            backgroundImage: 'radial-gradient(circle at center, yellow, green)',
            borderRadius: 16,
          }}
        />
      );
    },
  },
  {
    title: 'Radial Gradient with non uniform border style',
    name: 'radial-gradient-7',
    render(): React.Node {
      return (
        <GradientBox
          testID="radial-gradient-with-non-uniform-borders"
          style={{
            backgroundImage: `radial-gradient(
              circle at 70% 30%,
              #8a2be2 0%,
              #4b0082 50%,
              #191970 100%
            )`,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 16,
          }}
        />
      );
    },
  },
  {
    title: 'Elliptical Radial Gradient',
    name: 'elliptical',
    render(): React.Node {
      return (
        <GradientBox
          testID="radial-gradient-elliptical"
          style={{
            backgroundImage:
              'radial-gradient(ellipse farthest-corner at 30% 40%, red, blue)',
          }}
        />
      );
    },
  },
  {
    title: 'Radial Gradient with Platform colors',
    name: 'platform-colors',
    render(): React.Node {
      return (
        <GradientBox
          testID="radial-gradient-platform-colors"
          style={{
            backgroundImage: [
              {
                type: 'radial-gradient',
                shape: 'circle',
                position: {top: '50%', left: '50%'},
                size: 'farthest-corner',
                colorStops: [
                  {
                    color: Platform.select({
                      ios: PlatformColor('systemBlueColor'),
                      android: PlatformColor('@android:color/holo_blue_dark'),
                      default: 'blue',
                    }),
                  },
                  {color: 'green'},
                ],
              },
            ],
          }}
        />
      );
    },
  },
  {
    title: 'Transition hint with percentages',
    name: 'transition-hint',
    render(): React.Node {
      return (
        <GradientBox
          style={{
            backgroundImage: 'radial-gradient(red, 40%, blue)',
          }}
          testID="radial-gradient-transition-hint"
        />
      );
    },
  },
  {
    title: 'Multiple radial gradients',
    name: 'multiple',
    render(): React.Node {
      return (
        <GradientBox
          testID="radial-gradient-multiple"
          style={{
            backgroundImage: `
                  radial-gradient(circle at top 20% right 20%, rgba(238, 64, 53, 0.8), rgba(238, 64, 53, 0) 70%),
                  radial-gradient(circle at 50% 50%, rgba(243, 119, 54, 0.8), rgba(243, 119, 54, 0) 70%),
                  radial-gradient(circle at 80% 80%, rgba(123, 192, 67, 0.8), rgba(123, 192, 67, 0) 70%)
            `,
            borderRadius: 16,
          }}
        />
      );
    },
  },
  {
    title: 'Radial gradient with non-square bounds',
    name: 'non-square-bounds',
    render(): React.Node {
      return (
        <GradientBox
          testID="radial-gradient-non-square-bounds"
          style={{
            backgroundImage: 'radial-gradient(red, blue)',
            width: 200,
            height: 100,
          }}
        />
      );
    },
  },
  {
    title: 'Radial gradient with non-square bounds. height > width',
    name: 'non-square-bounds-height-gt-width',
    render(): React.Node {
      return (
        <GradientBox
          testID="radial-gradient-non-square-bounds-height-gt-width"
          style={{
            backgroundImage: 'radial-gradient(red, blue)',
            width: 100,
            height: 300,
          }}
        />
      );
    },
  },
] as Array<RNTesterModuleExample>;
