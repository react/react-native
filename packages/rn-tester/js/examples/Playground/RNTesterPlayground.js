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
import {Button, StyleSheet, TextInput, View} from 'react-native';

// Type into each input. Then either change the OS text size while the app
// runs (Settings > Accessibility > Display & Text Size > Larger Text, or
// `xcrun simctl ui booted content_size accessibility-large`) or press
// "Toggle text color".
// Expected: every input keeps the text you typed.
// Actual on iOS: the uncontrolled inputs drop the typed text (to "" or to
// defaultValue). The controlled input keeps it.
function Playground() {
  const [controlledValue, setControlledValue] = useState('');
  const [red, setRed] = useState(false);
  const inputStyle = [styles.input, red && styles.red];
  return (
    <View style={styles.container}>
      <RNTesterText>
        Type into each input, then change the OS text size or press &quot;Toggle
        text color&quot;. Every input must keep its text.
      </RNTesterText>
      <Button
        testID="playground-toggle-color"
        title="Toggle text color"
        onPress={() => setRed(value => !value)}
      />
      <RNTesterText>Uncontrolled single-line</RNTesterText>
      <TextInput testID="playground-uncontrolled" style={inputStyle} />
      <RNTesterText>Uncontrolled multiline</RNTesterText>
      <TextInput
        testID="playground-uncontrolled-multiline"
        multiline={true}
        style={inputStyle}
      />
      <RNTesterText>Uncontrolled with defaultValue</RNTesterText>
      <TextInput
        testID="playground-default-value"
        defaultValue="default"
        style={inputStyle}
      />
      <RNTesterText>Controlled</RNTesterText>
      <TextInput
        testID="playground-controlled"
        value={controlledValue}
        onChangeText={setControlledValue}
        style={inputStyle}
      />
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
  red: {
    color: 'red',
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
