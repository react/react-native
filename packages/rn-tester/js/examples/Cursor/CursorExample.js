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
import {Pressable, StyleSheet, Text, View} from 'react-native';

const styles = StyleSheet.create({
  invisibleBox: {
    width: 100,
    height: 100,
  },
  box: {
    width: 100,
    height: 100,
    borderWidth: 2,
  },
  circle: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderRadius: 100,
  },
  halfcircle: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderTopStartRadius: 100,
    borderBottomStartRadius: 100,
  },
  solid: {
    backgroundColor: 'blue',
  },
  pointer: {
    cursor: 'pointer',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

function CursorExampleAuto(): React.Node {
  return (
    <View style={styles.row}>
      <View style={styles.box} />
      <View style={styles.circle} />
      <View style={styles.halfcircle} />
      <View style={[styles.box, styles.solid]} />
      <View style={[styles.circle, styles.solid]} />
      <View style={[styles.halfcircle, styles.solid]} />
    </View>
  );
}

function CursorExamplePointer(): React.Node {
  return (
    <View style={styles.row}>
      <View style={[styles.box, styles.pointer]} />
      <View style={[styles.circle, styles.pointer]} />
      <View style={[styles.halfcircle, styles.pointer]} />
      <View style={[styles.box, styles.solid, styles.pointer]} />
      <View style={[styles.circle, styles.solid, styles.pointer]} />
      <View style={[styles.halfcircle, styles.solid, styles.pointer]} />
    </View>
  );
}

function CursorExampleViewFlattening(): React.Node {
  return (
    <View style={styles.row}>
      <View style={[styles.invisibleBox, styles.centerContent, styles.pointer]}>
        <Text>pointer</Text>
      </View>
    </View>
  );
}

function CursorExampleMounting(): React.Node {
  const [visible, setVisible] = React.useState(true);

  return (
    <View collapsable={false}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setVisible(value => !value)}
        style={[styles.box, styles.centerContent, styles.pointer]}>
        <Text>Toggle sibling</Text>
      </Pressable>
      {visible && <Text>Removable sibling</Text>}
      <Text>This should always be last.</Text>
    </View>
  );
}

exports.title = 'Cursor';
exports.category = 'UI';
exports.description =
  'Demonstrates setting a cursor, which affects the appearance when a pointer is over the View.';
exports.examples = [
  {
    title: 'Default',
    description: "Cursor: 'auto' or no cursor set ",
    render: CursorExampleAuto,
  },
  {
    title: 'Pointer',
    description: 'cursor: pointer',
    render: CursorExamplePointer,
  },
  {
    title: 'View flattening',
    description: 'Views with a cursor do not get flattened',
    render: CursorExampleViewFlattening,
  },
  {
    title: 'Mount and unmount while hovering',
    description:
      'Hover over the button with a pointer or Apple Pencil, then press repeatedly. The sibling should toggle without crashing or changing the text order. In the iOS Simulator, enable Send Pointer to Device.',
    render: CursorExampleMounting,
  },
] as Array<RNTesterModuleExample>;
