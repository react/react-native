/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// Repro: on iOS (Fabric, RN 0.88), a recycled InputAccessoryView is left
// visible (hidden = NO) on top of its TextInput, so the TextInput can no
// longer be focused.
//
// 1. Tap the field: it focuses and the "Done" accessory bar shows (works).
// 2. Tap "Unmount field", then "Mount field".
// 3. Tap the field again: nothing happens. No caret, no keyboard.

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import * as React from 'react';
import {useState} from 'react';
import {
  Button,
  InputAccessoryView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const ACCESSORY_ID = 'playgroundAccessory';

function Playground() {
  const [visible, setVisible] = useState(true);
  return (
    <View style={styles.container}>
      <Button
        title={visible ? 'Unmount field' : 'Mount field'}
        onPress={() => setVisible(v => !v)}
      />
      {visible ? (
        <View style={styles.field}>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            inputAccessoryViewID={ACCESSORY_ID}
            placeholder="Tap me"
          />
          <InputAccessoryView nativeID={ACCESSORY_ID}>
            <View style={styles.bar}>
              <Text>Done</Text>
            </View>
          </InputAccessoryView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  field: {
    marginTop: 24,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#999',
    paddingHorizontal: 8,
  },
  bar: {
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#eee',
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
