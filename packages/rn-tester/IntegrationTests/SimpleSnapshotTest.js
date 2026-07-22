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

import * as React from 'react';
import {useEffect} from 'react';
import {NativeModules, StyleSheet, View} from 'react-native';

const {TestModule} = NativeModules;

function SimpleSnapshotTest(): React.Node {
  const done = (success: boolean) => {
    TestModule.markTestPassed(success);
  };
  useEffect(() => {
    if (!TestModule.verifySnapshot) {
      throw new Error('TestModule.verifySnapshot not defined.');
    }
    requestAnimationFrame(() => TestModule.verifySnapshot(done));
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.box1} />
      <View style={styles.box2} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 100,
  },
  box1: {
    width: 80,
    height: 50,
    backgroundColor: 'red',
  },
  box2: {
    top: -10,
    left: 20,
    width: 70,
    height: 90,
    backgroundColor: 'blue',
  },
});

export default SimpleSnapshotTest;
