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
import type {Numeric} from 'react-native/Libraries/Animated/AnimatedImplementation';

import RNTesterButton from '../../components/RNTesterButton';
import * as React from 'react';
import {useState} from 'react';
import {Animated, StyleSheet, Text, TextInput, View} from 'react-native';

export default {
  title: 'Combine Example',
  name: 'Combine View',
  description:
    'Change the opacity of the view by combining different Animated.Values.',
  render: () => <CombineExample />,
} as RNTesterModuleExample;

component CombineExample() {
  const [aValue, setAValue] = useState('0.4');
  const [bValue, setBValue] = useState('0.5');
  const a = new Animated.Value(parseFloat(aValue));
  const b = new Animated.Value(parseFloat(bValue));
  const add = Animated.add(a, b);
  const subtract = Animated.subtract(b, a);
  const mult = Animated.multiply(a, b);
  const divide =
    parseFloat(aValue) !== 0 ? Animated.divide(b, a) : new Animated.Value(1);
  const mod = Animated.modulo(a, parseFloat(bValue));
  const [animation, setAnimation] = useState<Numeric>(add);

  return (
    <View>
      <TextInput
        style={styles.input}
        value={aValue}
        onChangeText={text => setAValue(text)}
        placeholder="Enter value for a"
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        value={bValue}
        onChangeText={text => setBValue(text)}
        placeholder="Enter value for b"
        keyboardType="numeric"
      />
      <Animated.View style={[styles.content, {opacity: animation}]}>
        <Text>Change Opacity</Text>
      </Animated.View>
      <RNTesterButton onPress={() => setAnimation(add)}>Add</RNTesterButton>
      <RNTesterButton onPress={() => setAnimation(subtract)}>
        Subtract
      </RNTesterButton>
      <RNTesterButton onPress={() => setAnimation(mult)}>
        Multiply
      </RNTesterButton>
      <RNTesterButton onPress={() => setAnimation(divide)}>
        Divide
      </RNTesterButton>
      <RNTesterButton onPress={() => setAnimation(mod)}>Modulo</RNTesterButton>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: 'deepskyblue',
    borderWidth: 1,
    borderColor: 'dodgerblue',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingLeft: 10,
    margin: 10,
    borderRadius: 5,
  },
});
