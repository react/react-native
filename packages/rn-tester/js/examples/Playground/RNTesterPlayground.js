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

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {StyleSheet, View} from 'react-native';

// Repro for #57190: on Android + New Architecture, setting `outlineColor`
// crashes with:
//   java.lang.ClassCastException: java.lang.Double cannot be cast to
//   java.lang.Integer
//     at com.facebook.react.uimanager.BaseViewManagerDelegate.setProperty
//
// Root cause: `BaseViewManagerDelegate` casts the outline color prop straight
// to Int (`value as Int?`) while every other color prop (backgroundColor,
// shadowColor) uses `ColorPropConverter.getColor(...)`. Under Fabric, color
// props are always delivered as `Double`, so the cast throws on mount.
//
// Rendering the View below is enough to crash the app on Android.
function Playground() {
  return (
    <View style={styles.container}>
      <RNTesterText>
        #57190: the outlined box below crashes on Android (New Architecture)
      </RNTesterText>
      <View style={styles.outlined} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    gap: 10,
  },
  outlined: {
    width: 100,
    height: 100,
    outlineColor: '#007AFF',
    outlineWidth: 2,
    outlineStyle: 'solid',
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
