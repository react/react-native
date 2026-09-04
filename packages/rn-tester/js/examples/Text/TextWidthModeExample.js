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

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

const LABELS = [
  'Comfort: Moderate',
  'Sitting, Standing, Roomscale',
  'Touch Controllers',
];

component TextWidthModeRow(testID: string, textWidthMode?: 'longest-line') {
  return (
    <ScrollView
      contentContainerStyle={styles.row}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      testID={testID}>
      {LABELS.map(label => (
        <View key={label} style={styles.item}>
          <Text style={styles.text} textWidthMode={textWidthMode}>
            {label}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

export default component TextWidthModeExample() {
  return (
    <View
      accessible={true}
      style={styles.example}
      testID="text-width-mode-example">
      <RNTesterText variant="label">Default width</RNTesterText>
      <TextWidthModeRow testID="text-width-mode-default" />
      <RNTesterText variant="label">Longest rendered line</RNTesterText>
      <TextWidthModeRow
        testID="text-width-mode-longest-line"
        textWidthMode="longest-line"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  example: {
    gap: 24,
  },
  item: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexShrink: 1,
    maxWidth: 120,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 16,
  },
  text: {
    backgroundColor: '#ff8a80',
    color: '#111111',
    flexShrink: 1,
    fontSize: 12,
  },
});
