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

import * as React from 'react';
import {Image, StyleSheet, View} from 'react-native';

const styles = StyleSheet.create({
  box: {
    width: 100,
    height: 100,
    borderWidth: 2,
  },
  shadow1: {
    shadowOpacity: 0.5,
    shadowRadius: 3,
    shadowOffset: {width: 2, height: 2},
  },
  shadow2: {
    shadowOpacity: 1.0,
    shadowColor: 'red',
    shadowRadius: 0,
    shadowOffset: {width: 3, height: 3},
  },
  shadowShaped: {
    borderRadius: 50,
  },
  shadowImage: {
    borderWidth: 0,
    overflow: 'visible',
  },
  shadowChild: {
    backgroundColor: 'transparent',
  },
  shadowChildBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    margin: 8,
    backgroundColor: 'red',
  },

  elevation1: {
    elevation: 1,
  },
  elevation2: {
    elevation: 3,
  },
  elevation3: {
    elevation: 10,
  },
  shadowColor1: {
    shadowColor: 'red',
  },
  shadowColor2: {
    shadowColor: 'blue',
  },
  shadowColor3: {
    shadowColor: '#00FF0080',
  },
  border: {
    borderWidth: 5,
    borderColor: '#EEE',
  },
});

exports.title = 'Box Shadow';
exports.category = 'UI';
exports.description =
  'Demonstrates some of the shadow styles available to Views.';
exports.examples = [
  {
    title: 'Basic shadow',
    name: 'basic-shadow',
    description: 'shadowOpacity: 0.5, shadowOffset: {2, 2}',
    render(): React.Node {
      return (
        <View testID="box-shadow-basic" style={[styles.box, styles.shadow1]} />
      );
    },
  },
  {
    title: 'Colored shadow',
    name: 'colored-shadow',
    description: "shadowColor: 'red', shadowRadius: 0",
    render(): React.Node {
      return (
        <View
          testID="box-shadow-colored"
          style={[styles.box, styles.shadow2]}
        />
      );
    },
  },
  {
    title: 'Shaped shadow',
    name: 'shaped-shadow',
    description: 'borderRadius: 50',
    render(): React.Node {
      return (
        <View
          testID="box-shadow-shaped"
          style={[styles.box, styles.shadow1, styles.shadowShaped]}
        />
      );
    },
  },
  {
    title: 'Image shadow',
    name: 'image-shadow',
    description: 'Image shadows are derived exactly from the pixels.',
    render(): React.Node {
      return (
        <View testID="box-shadow-image">
          <Image
            source={require('../../assets/hawk.png')}
            style={[styles.box, styles.shadow1, styles.shadowImage]}
          />
        </View>
      );
    },
  },
  {
    title: 'Child shadow',
    name: 'child-shadow',
    description:
      'For views without an opaque background color, shadow will be derived from the subviews.',
    render(): React.Node {
      return (
        <View
          testID="box-shadow-child"
          style={[styles.box, styles.shadow1, styles.shadowChild]}>
          <View style={[styles.box, styles.shadowChildBox]} />
        </View>
      );
    },
  },

  {
    title: 'Basic elevation',
    description: 'elevation: 1, 3, 6',
    platform: 'android' as const,
    render(): React.Node {
      return (
        <View>
          <View style={[styles.box, styles.elevation1]} />
          <View style={[styles.box, styles.elevation2]} />
          <View style={[styles.box, styles.elevation3]} />
        </View>
      );
    },
  },
  {
    title: 'Fractional elevation',
    description: 'elevation: 0.1, 0.5, 1.5',
    platform: 'android' as const,
    render(): React.Node {
      return (
        <View>
          <View style={[styles.box, {elevation: 0.1}]} />
          <View style={[styles.box, {elevation: 0.5}]} />
          <View style={[styles.box, {elevation: 1.5}]} />
        </View>
      );
    },
  },
  {
    title: 'Colored shadow',
    description: "shadowColor: 'red', 'blue', '#00FF0080'",
    platform: 'android' as const,
    render(): React.Node {
      return (
        <View>
          <View style={[styles.box, styles.elevation1, styles.shadowColor1]} />
          <View style={[styles.box, styles.elevation2, styles.shadowColor2]} />
          <View style={[styles.box, styles.elevation3, styles.shadowColor3]} />
        </View>
      );
    },
  },
  {
    title: 'Shaped shadow',
    description: 'borderRadius: 50',
    platform: 'android' as const,
    render(): React.Node {
      return (
        <View>
          <View style={[styles.box, styles.elevation1, styles.shadowShaped]} />
          <View style={[styles.box, styles.elevation2, styles.shadowShaped]} />
          <View style={[styles.box, styles.elevation3, styles.shadowShaped]} />
        </View>
      );
    },
  },
  {
    title: 'Borders',
    description: 'borderWidth: 5',
    platform: 'android' as const,
    render(): React.Node {
      return (
        <View>
          <View style={[styles.box, styles.elevation1, styles.border]} />
          <View style={[styles.box, styles.elevation2, styles.border]} />
          <View style={[styles.box, styles.elevation3, styles.border]} />
        </View>
      );
    },
  },
] as Array<RNTesterModuleExample>;
