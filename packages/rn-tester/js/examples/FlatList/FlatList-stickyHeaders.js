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
import type {ListRenderItemInfo} from 'react-native';

import * as React from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';

const DATA = [
  'Sticky Pizza',
  'Burger',
  'Sticky Risotto',
  'French Fries',
  'Sticky Onion Rings',
  'Fried Shrimps',
  'Water',
  'Coke',
  'Beer',
  'Cheesecake',
  'Ice Cream',
];

const STICKY_HEADER_INDICES = [0, 2, 4];

const Item = ({item, separators}: ListRenderItemInfo<string>) => {
  return (
    <View style={styles.item}>
      <Text style={styles.title}>{item}</Text>
    </View>
  );
};

export component FlatList_stickyHeaders() {
  return (
    <FlatList
      data={DATA}
      keyExtractor={(item, index) => item + index}
      style={styles.list}
      stickyHeaderIndices={STICKY_HEADER_INDICES}
      renderItem={Item}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: 'pink',
    padding: 20,
    marginVertical: 8,
  },
  list: {
    flex: 1,
  },
  title: {
    fontSize: 24,
  },
});

export default {
  title: 'Sticky Headers',
  name: 'stickyHeaders',
  description: 'Test sticky headers on FlatList',
  render: () => <FlatList_stickyHeaders />,
} as RNTesterModuleExample;
