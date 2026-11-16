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
import {StyleSheet, Text, TextInput, View} from 'react-native';

// https://github.com/react/react-native/issues/60013
// Change the OS text size while the app runs (Settings > Accessibility >
// Display & Text Size > Larger Text, or
// `xcrun simctl ui booted content_size accessibility-large`), then go back.
// Expected: "word" stays red and in Courier in both inputs.
// Actual on iOS: the single-line input draws all of its text in the default
// color and font.
function Playground() {
  return (
    <View style={styles.container}>
      <RNTesterText>
        Change the OS text size (Settings &gt; Accessibility &gt; Display &amp;
        Text Size &gt; Larger Text), then come back. &quot;word&quot; must stay
        red and in Courier in both inputs.
      </RNTesterText>
      <RNTesterText>Single-line</RNTesterText>
      <TextInput testID="playground-singleline" style={styles.input}>
        <Text>
          plain <Text style={styles.word}>word</Text> end
        </Text>
      </TextInput>
      <RNTesterText>Multiline</RNTesterText>
      <TextInput
        testID="playground-multiline"
        multiline={true}
        style={styles.input}>
        <Text>
          plain <Text style={styles.word}>word</Text> end
        </Text>
      </TextInput>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 10,
  },
  input: {
    borderWidth: 1,
    fontSize: 18,
    padding: 8,
  },
  word: {
    color: 'red',
    fontFamily: 'Courier',
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
