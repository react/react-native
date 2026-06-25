/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ListRenderItemInfo} from '../../../../virtualized-lists/Lists/VirtualizedListProps';
import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import * as React from 'react';
import {useCallback, useState} from 'react';
import {Button, FlatList, StyleSheet, Text, View} from 'react-native';

const DATA = Array.from({length: 20}, (_, i) => ({
  id: i.toString(),
}));

const MAINTAIN_VISIBLE_CONTENT_POSITION = {minIndexForVisible: 0};

export component FlatList_maintainVisibleContentPosition() {
  const [height, setHeight] = useState<number>(200);
  const [isItemResponsive, setIsItemResponsive] = useState<boolean>(true);

  const changeHeight = useCallback(() => {
    setHeight(prevHeight => (prevHeight === 200 ? 400 : 200));
  }, []);

  const toggleResponsiveness = useCallback(() => {
    setIsItemResponsive(prevIsItemResponsive => !prevIsItemResponsive);
  }, []);

  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<{id: string}>) => (
      <View
        key={item.id}
        style={{
          height: (isItemResponsive ? height : 200) - 32,
          paddingVertical: 8,
        }}>
        <View style={styles.item}>
          <Text style={styles.itemText}>{item.id}</Text>
        </View>
      </View>
    ),
    [height, isItemResponsive],
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={DATA}
        decelerationRate="fast"
        key={isItemResponsive ? 'responsive' : 'non-responsive'}
        maintainVisibleContentPosition={MAINTAIN_VISIBLE_CONTENT_POSITION}
        pagingEnabled={true}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToAlignment="center"
        style={{height}}
      />
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Button onPress={changeHeight} title="Change height" />
        <Button
          onPress={toggleResponsiveness}
          title={`Make item ${isItemResponsive ? 'non-responsive' : 'responsive'}`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
  },
  itemText: {
    color: '#fff',
    fontSize: 24,
  },
  root: {
    gap: 16,
    paddingHorizontal: 16,
  },
});

export default {
  title: 'maintainVisibleContentPosition',
  name: 'maintainVisibleContentPosition',
  description: 'Test maintainVisibleContentPosition prop on FlatList',
  render: () => <FlatList_maintainVisibleContentPosition />,
} as RNTesterModuleExample;
