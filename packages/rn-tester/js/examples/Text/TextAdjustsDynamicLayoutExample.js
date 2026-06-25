/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';
import {useState} from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';

export default component TextAdjustsDynamicLayoutExample() {
  const [height, setHeight] = useState(20);

  return (
    <>
      <View>
        <View style={[styles.subjectContainer, {height}]}>
          <Text
            testID="adjusting-text"
            adjustsFontSizeToFit={true}
            numberOfLines={1}
            style={styles.subjectText}>
            This is adjusting text.
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <Button
          testID="set-height-20"
          onPress={() => setHeight(20)}
          title="Set Height to 20"
        />
      </View>
      <View style={styles.row}>
        <Button
          testID="set-height-40"
          onPress={() => setHeight(40)}
          title="Set Height to 40"
        />
      </View>
      <View style={styles.row}>
        <Button
          testID="set-height-60"
          onPress={() => setHeight(60)}
          title="Set Height to 60"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  subjectContainer: {
    backgroundColor: 'rgba(254, 255, 0, 0.75)',
    justifyContent: 'center',
  },
  subjectText: {
    fontSize: 40,
    textAlign: 'center',
  },
  row: {
    marginTop: 10,
  },
});
