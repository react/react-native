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
import {FlatList, StyleSheet, Switch, Text, View} from 'react-native';

const ROWS: Array<{id: string, label: string}> = Array.from(
  {length: 60},
  (_, i) => ({id: String(i), label: `Row ${i}`}),
);

function Playground() {
  const [inverted, setInverted] = React.useState<boolean>(true);

  // Reproducer for #59731: with `inverted` on, this bare FlatList lays out
  // (correct content size, scroll gestures work, scrollbar visible) but paints
  // nothing at rest on a physical iOS 27 device with Fabric. Toggling the flag
  // off renders the very same list immediately.
  return (
    <View style={styles.container}>
      <RNTesterText>
        {'Issue #59731: with "inverted" on, this FlatList shows nothing at '}
        {'rest (it still scrolls and reports a correct content size). Turn '}
        {'the switch off to render the same list.'}
      </RNTesterText>
      <View style={styles.switchRow}>
        <RNTesterText>inverted</RNTesterText>
        <Switch value={inverted} onValueChange={setInverted} />
      </View>
      <View style={styles.listContainer}>
        <FlatList
          inverted={inverted}
          data={ROWS}
          keyExtractor={item => item.id}
          renderItem={({item}) => <Text style={styles.row}>{item.label}</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listContainer: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#999999',
  },
  row: {
    padding: 12,
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: 8,
    fontSize: 17,
    color: '#111111',
    backgroundColor: '#dfe6ef',
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
