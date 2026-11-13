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
import {
  Button,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const INITIAL_SECTIONS = [
  {title: 'Section', data: [{key: 'a'}, {key: 'b'}, {key: 'c'}]},
];
const REORDERED_SECTIONS = [
  {title: 'Section', data: [{key: 'b'}, {key: 'a'}, {key: 'c'}]},
];

function ItemSeparatorReproducer({leadingItem, trailingItem}: any) {
  const leading = leadingItem?.key ?? 'undefined';
  const trailing = trailingItem?.key ?? 'undefined';
  return (
    <View style={styles.separator}>
      <Text style={styles.separatorText}>
        leading: {leading} | trailing: {trailing}
      </Text>
    </View>
  );
}

function ItemSeparatorComponentBugPlayground() {
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [reordered, setReordered] = useState(false);

  return (
    <View style={styles.container}>
      <RNTesterText>
        Bug: ItemSeparatorComponent receives stale leadingItem/trailingItem after
        reorder. Tap "Reorder" to swap first two items. The separator between
        "b" and "a" should show "leading: b | trailing: a". If it shows
        "leading: a | trailing: c" or "undefined", the bug is present.
      </RNTesterText>
      <Button
        title={reordered ? 'Reset' : 'Reorder (swap first two)'}
        onPress={() => {
          setReordered(r => !r);
          setSections(reordered ? INITIAL_SECTIONS : REORDERED_SECTIONS);
        }}
      />
      <SectionList
        style={styles.list}
        sections={sections}
        keyExtractor={item => item.key}
        renderItem={({item}) => (
          <View style={styles.item}>
            <Text>{item.key}</Text>
          </View>
        )}
        renderSectionHeader={({section: {title}}) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        ItemSeparatorComponent={ItemSeparatorReproducer}
      />
    </View>
  );
}

function Playground() {
  return (
    <View style={styles.container}>
      <ItemSeparatorComponentBugPlayground />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  item: {
    padding: 12,
    backgroundColor: '#f0f0f0',
  },
  list: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 8,
  },
  separator: {
    height: 24,
    backgroundColor: '#e0e0ff',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  separatorText: {
    fontSize: 12,
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description:
    'Test out new features and ideas. Includes reproducer for ItemSeparatorComponent leadingItem/trailingItem state bug.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
