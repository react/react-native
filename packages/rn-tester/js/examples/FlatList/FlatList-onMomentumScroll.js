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

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import * as React from 'react';
import {useCallback, useRef, useState} from 'react';
import {Button, FlatList, StyleSheet, Text, View} from 'react-native';

const DATA = [...Array(30)].map((_, i) => `Item ${i}`);

component FlatList_onMomentumScroll() {
  const ref = useRef<?FlatList<string>>(null);
  const [beginCount, setBeginCount] = useState(0);
  const [endCount, setEndCount] = useState(0);

  const renderItem = useCallback(
    ({item}: {item: string, ...}) => (
      <View style={styles.item}>
        <Text>{item}</Text>
      </View>
    ),
    [],
  );

  const resetCounts = useCallback(() => {
    setBeginCount(0);
    setEndCount(0);
  }, []);

  return (
    <View style={styles.root}>
      <Text testID="flatlist_momentum_begin_count">begin:{beginCount}</Text>
      <Text testID="flatlist_momentum_end_count">end:{endCount}</Text>
      <FlatList
        ref={ref}
        data={DATA}
        keyExtractor={(_item, index) => index.toString()}
        renderItem={renderItem}
        getItemLayout={(_data: unknown, index: number) => ({
          length: 40,
          offset: 40 * index,
          index,
        })}
        style={styles.list}
        testID="flatlist_momentum_list"
        onMomentumScrollBegin={() => setBeginCount(count => count + 1)}
        onMomentumScrollEnd={() => setEndCount(count => count + 1)}
      />
      <Button
        title="scrollToOffset 600 (animated)"
        testID="flatlist_momentum_scroll_to_offset_600_animated"
        onPress={() =>
          ref.current?.scrollToOffset({offset: 600, animated: true})
        }
      />
      <Button
        title="scrollToOffset 0 (animated)"
        testID="flatlist_momentum_scroll_to_offset_0_animated"
        onPress={() => ref.current?.scrollToOffset({offset: 0, animated: true})}
      />
      <Button
        title="scrollToOffset 0 (not animated)"
        testID="flatlist_momentum_scroll_to_offset_0_not_animated"
        onPress={() =>
          ref.current?.scrollToOffset({offset: 0, animated: false})
        }
      />
      <Button
        title="Reset counts"
        testID="flatlist_momentum_reset"
        onPress={resetCounts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 8,
  },
  list: {
    height: 200,
  },
  item: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});

export default {
  title: 'OnMomentumScroll',
  name: 'onMomentumScroll',
  description:
    'Counts `onMomentumScrollBegin`/`onMomentumScrollEnd` for animated and non-animated `scrollToOffset` commands.',
  render: function () {
    return <FlatList_onMomentumScroll />;
  },
} as RNTesterModuleExample;
