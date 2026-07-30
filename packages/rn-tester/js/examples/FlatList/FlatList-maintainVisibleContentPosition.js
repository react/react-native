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
import type {ScrollEvent} from 'react-native';

import * as React from 'react';
import {useCallback, useRef, useState} from 'react';
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

const HEIGHTS = [30, 50, 70, 90, 110];
const FIXED_ITEM_HEIGHT = 40;

type ListItem = {id: string, height: number};

const INITIAL_DATA: Array<ListItem> = Array.from({length: 20}, (_, i) => ({
  id: i.toString(),
  height: HEIGHTS[i % HEIGHTS.length],
}));

type MaintainVisibleConfig = {
  minIndexForVisible: number,
  autoscrollToTopThreshold?: number | null,
};

function createConfig(
  minIndexForVisible: number,
  autoscrollToTopThreshold?: number | null,
): MaintainVisibleConfig {
  const config: MaintainVisibleConfig = {minIndexForVisible};
  if (autoscrollToTopThreshold != null) {
    config.autoscrollToTopThreshold = autoscrollToTopThreshold;
  }
  return config;
}

export component FlatList_maintainVisibleContentPosition() {
  const [data, setData] = useState(INITIAL_DATA);
  const [horizontal, setHorizontal] = useState(false);
  const [inverted, setInverted] = useState(false);
  const [minIndexForVisible] = useState(0);
  const [autoscrollToTopThreshold, setAutoscrollToTopThreshold] = useState<
    number | null,
  >(null);
  const [windowSize, setWindowSize] = useState(51);
  const [scrollEventThrottle, setScrollEventThrottle] = useState(16);
  const [variableHeight, setVariableHeight] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const flatListRef = useRef<FlatList<ListItem> | null>(null);

  const config = createConfig(minIndexForVisible, autoscrollToTopThreshold);

  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<ListItem>) => (
      <View
        key={item.id}
        testID={`item_${item.id}`}
        style={{
          height: variableHeight ? (item.height ?? 40) : 40,
          width: horizontal ? 200 : '100%',
          backgroundColor: '#4CAF50',
          justifyContent: 'center',
          alignItems: 'center',
          margin: 2,
        }}>
        <Text style={{color: '#fff', fontSize: 16}}>{item.id}</Text>
      </View>
    ),
    [horizontal, variableHeight],
  );

  const addItemAtTop = useCallback(() => {
    setData(prev => [
      {id: `added-${prev.length}`, height: FIXED_ITEM_HEIGHT},
      ...prev,
    ]);
  }, []);

  const addItemAtBottom = useCallback(() => {
    setData(prev => [
      ...prev,
      {id: `added-${prev.length}`, height: FIXED_ITEM_HEIGHT},
    ]);
  }, []);

  const addItemAtTopMultiple = useCallback(() => {
    setData(prev => [
      {id: `added-${prev.length}`, height: FIXED_ITEM_HEIGHT},
      {id: `added-${prev.length + 1}`, height: FIXED_ITEM_HEIGHT},
      {id: `added-${prev.length + 2}`, height: FIXED_ITEM_HEIGHT},
      ...prev,
    ]);
  }, []);

  const addItemAtTopFifty = useCallback(() => {
    setData(prev => {
      const newItems = Array.from({length: 50}, (_, i) => ({
        id: `added-${prev.length + i}`,
        height: FIXED_ITEM_HEIGHT,
      }));
      return [...newItems, ...prev];
    });
  }, []);

  const resetData = useCallback(() => {
    setData(INITIAL_DATA);
    flatListRef.current?.scrollToOffset({offset: 0, animated: false});
  }, []);

  const scrollToOffset500 = useCallback(() => {
    flatListRef.current?.scrollToOffset({offset: 500, animated: true});
  }, []);

  const scrollToOffset100 = useCallback(() => {
    flatListRef.current?.scrollToOffset({offset: 100, animated: true});
  }, []);

  const clearData = useCallback(() => {
    setData([]);
    flatListRef.current?.scrollToOffset({offset: 0, animated: false});
  }, []);

  const addItemAtTopAndRemoveBottom = useCallback(() => {
    setData(prev => {
      const newItems = [
        {id: `added-${prev.length}`, height: FIXED_ITEM_HEIGHT},
      ];
      const remaining = prev.slice(0, Math.max(0, prev.length - 3));
      return [...newItems, ...remaining];
    });
  }, []);

  const onScroll = useCallback(
    (e: ScrollEvent) => {
      const offset = horizontal
        ? e.nativeEvent.contentOffset.x
        : e.nativeEvent.contentOffset.y;
      setScrollOffset(offset);
    },
    [horizontal],
  );

  return (
    <View style={styles.root}>
      <FlatList
        ref={flatListRef}
        data={data}
        maintainVisibleContentPosition={config}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        horizontal={horizontal}
        inverted={inverted}
        windowSize={windowSize}
        scrollEventThrottle={scrollEventThrottle}
        onScroll={onScroll}
        style={horizontal ? styles.listHorizontal : styles.list}
      />
      <View style={styles.controlsContainer}>
        <Text style={styles.info} testID="scroll-offset-display">
          offset:{Math.round(scrollOffset)}
        </Text>
        <View style={styles.smallButtonRow}>
          <View style={styles.smallButtonContainer}>
            <TouchableOpacity
              style={styles.smallButtonText}
              onPress={addItemAtTop}>
              <Text style={styles.smallButtonTextLabel}>Add 1 item at top</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.smallButtonContainer}>
            <TouchableOpacity
              style={styles.smallButtonText}
              onPress={addItemAtBottom}>
              <Text style={styles.smallButtonTextLabel}>
                Add 1 item at bottom
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.smallButtonRow}>
          <View style={styles.smallButtonContainer}>
            <TouchableOpacity
              style={styles.smallButtonText}
              onPress={addItemAtTopMultiple}>
              <Text style={styles.smallButtonTextLabel}>
                Add 3 items at top
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.smallButtonContainer}>
            <TouchableOpacity
              style={styles.smallButtonText}
              onPress={addItemAtTopFifty}>
              <Text style={styles.smallButtonTextLabel}>
                Add 50 items at top
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.smallButtonRow}>
          <View style={styles.smallButtonContainer}>
            <TouchableOpacity
              style={styles.smallButtonText}
              onPress={addItemAtTopAndRemoveBottom}>
              <Text style={styles.smallButtonTextLabel}>
                Add + Remove (net -2)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.smallButtonRow}>
          <View style={styles.smallButtonContainer}>
            <TouchableOpacity
              style={styles.smallButtonText}
              onPress={() => setHorizontal(h => !h)}>
              <Text style={styles.smallButtonTextLabel}>
                {horizontal ? 'Horizontal: ON' : 'Horizontal: OFF'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.smallButtonContainer}>
            <TouchableOpacity
              style={styles.smallButtonText}
              onPress={() => setInverted(i => !i)}>
              <Text style={styles.smallButtonTextLabel}>
                {inverted ? 'Inverted: ON' : 'Inverted: OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.smallButtonRow}>
          <View style={styles.smallButtonContainer}>
            <TouchableOpacity
              style={styles.smallButtonText}
              onPress={() => setWindowSize(windowSize === 51 ? 3 : 51)}>
              <Text style={styles.smallButtonTextLabel}>
                {windowSize === 51 ? 'Recycle: OFF' : 'Recycle: ON'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.smallButtonContainer}>
            <TouchableOpacity
              style={styles.smallButtonText}
              onPress={() => setVariableHeight(v => !v)}>
              <Text style={styles.smallButtonTextLabel}>
                {variableHeight ? 'Height: Variable' : 'Height: Fixed'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.smallButtonRow}>
          <View style={styles.smallButtonContainer}>
            <TouchableOpacity
              style={styles.smallButtonText}
              onPress={() =>
                setAutoscrollToTopThreshold(
                  autoscrollToTopThreshold === 100 ? null : 100,
                )
              }>
              <Text style={styles.smallButtonTextLabel}>
                {autoscrollToTopThreshold === 100
                  ? 'Threshold: 100'
                  : 'Threshold: OFF'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.smallButtonContainer}>
            <TouchableOpacity
              style={styles.smallButtonText}
              onPress={() =>
                setScrollEventThrottle(scrollEventThrottle === 16 ? 500 : 16)
              }>
              <Text style={styles.smallButtonTextLabel}>
                {scrollEventThrottle === 16
                  ? 'Throttle: 16ms'
                  : 'Throttle: 500ms'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.smallButtonRow}>
          <View style={styles.smallButtonContainer}>
            <TouchableOpacity
              style={styles.smallButtonText}
              onPress={scrollToOffset100}>
              <Text style={styles.smallButtonTextLabel}>
                ScrollToOffset 100
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.smallButtonContainer}>
            <TouchableOpacity
              style={styles.smallButtonText}
              onPress={scrollToOffset500}>
              <Text style={styles.smallButtonTextLabel}>
                ScrollToOffset 500
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.smallButtonRow}>
          <View style={styles.smallButtonContainer}>
            <TouchableOpacity
              style={styles.smallButtonText}
              onPress={clearData}>
              <Text style={styles.smallButtonTextLabel}>
                Clear (empty list)
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.smallButtonContainer}>
            <TouchableOpacity
              style={styles.smallButtonText}
              onPress={resetData}>
              <Text style={styles.smallButtonTextLabel}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  list: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    maxHeight: 400,
  },
  listHorizontal: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  smallButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 1,
  },
  smallButtonText: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  smallButtonTextLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  smallButtonContainer: {
    flex: 1,
    marginHorizontal: 2,
  },
  info: {
    marginTop: 4,
    fontSize: 10,
    color: '#666',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
});

export default {
  title: 'maintainVisibleContentPosition',
  name: 'maintainVisibleContentPosition',
  description:
    'Test maintainVisibleContentPosition prop on FlatList when items are prepended',
  render: () => <FlatList_maintainVisibleContentPosition />,
} as RNTesterModuleExample;
