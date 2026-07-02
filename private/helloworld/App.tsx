/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
import {ScrollView, StatusBar, StyleSheet, Text} from 'react-native';

function App(): React.ReactNode {
  return (
    <>
      <StatusBar barStyle="auto" />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Text style={styles.title}>Hello, World!</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
});

export default App;
