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
import {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

// Repro for a recycled RCTViewComponentView keeping its custom container (iOS).
// Tap four times:
// 1. unmounts a view with overflow: 'hidden' + boxShadow; its native view is recycled.
// 2. mounts the bordered view, which dequeues that recycled view and mounts its
//    children through the stale container.
// 3. replaces the second child: it lands BEHIND the first (green square hidden).
// 4. replaces it again; removing the old one asserts in debug builds:
//    "Attempt to unmount a view which has a different index".
// Without the boxShadow on the first view, all four steps behave correctly.
function Playground() {
  const [step, setStep] = useState(0);
  return (
    <View style={styles.container}>
      <Pressable onPress={() => setStep(s => s + 1)} style={styles.button}>
        <RNTesterText>{`Step ${step}: tap to advance`}</RNTesterText>
      </Pressable>
      {step === 0 && <View style={styles.shadowClip} />}
      {step >= 2 && (
        <View collapsable={false} style={styles.bordered}>
          <View style={styles.back} />
          <View key={step} style={styles.front} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    gap: 24,
  },
  button: {
    padding: 12,
    backgroundColor: '#ddd',
  },
  shadowClip: {
    width: 120,
    height: 120,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0,0,0,0.4)',
    backgroundColor: 'white',
  },
  bordered: {
    width: 200,
    height: 120,
    borderTopWidth: 2,
    borderTopColor: 'black',
  },
  back: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'tomato',
  },
  front: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 80,
    height: 80,
    backgroundColor: 'seagreen',
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
