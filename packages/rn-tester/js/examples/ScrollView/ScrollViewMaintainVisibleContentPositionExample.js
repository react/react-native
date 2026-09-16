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
import type {ScrollEvent, ScrollViewInstance} from 'react-native';

import * as React from 'react';
import {useCallback, useRef, useState} from 'react';
import {Button, ScrollView, StyleSheet, Text, View} from 'react-native';

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

function ScrollView_maintainVisibleContentPosition(): React.Node {
  const [items, setItems] = useState(
    Array.from({length: 20}, (_, i) => ({id: i.toString()})),
  );
  const [minIndexForVisible, setMinIndexForVisible] = useState(0);
  const [autoscrollToTopThreshold, setAutoscrollToTopThreshold] = useState<
    number | null,
  >(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const scrollViewRef = useRef<?ScrollViewInstance>(null);

  const config = createConfig(minIndexForVisible, autoscrollToTopThreshold);

  const onScroll = useCallback((e: ScrollEvent) => {
    setScrollOffset(e.nativeEvent.contentOffset.y);
  }, []);

  const addItemAtTop = useCallback(() => {
    setItems(prev => [{id: `new-${Date.now()}`}, ...prev]);
  }, []);

  const resetItems = useCallback(() => {
    setItems(Array.from({length: 20}, (_, i) => ({id: i.toString()})));
    scrollViewRef.current?.scrollTo({x: 0, y: 0, animated: false});
  }, []);

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollViewRef}
        maintainVisibleContentPosition={config}
        onScroll={onScroll}
        style={styles.scrollView}>
        {items.map(item => (
          <View
            key={item.id}
            testID={`scrollview_item_${item.id}`}
            style={{
              height: 40,
              width: '100%',
              backgroundColor: '#2196F3',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text style={{color: '#fff', fontSize: 16}}>{item.id}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.controlsContainer}>
        <Text style={styles.info} testID="scroll-offset-display">
          offset:{Math.round(scrollOffset)}
        </Text>
        <View style={styles.buttonRow}>
          <Button onPress={addItemAtTop} title="Add 1 item at top" />
          <Button onPress={resetItems} title="Reset" />
        </View>
        <View style={styles.buttonRow}>
          <Button
            onPress={() => setMinIndexForVisible(0)}
            title="minIndex: 0"
          />
          <Button
            onPress={() => setMinIndexForVisible(5)}
            title="minIndex: 5"
          />
        </View>
        <View style={styles.buttonRow}>
          <Button
            onPress={() => setAutoscrollToTopThreshold(null)}
            title="Threshold: OFF"
          />
          <Button
            onPress={() => setAutoscrollToTopThreshold(100)}
            title="Threshold: 100"
          />
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
  scrollView: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    maxHeight: 400,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  info: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
});

exports.title = 'ScrollViewMaintainVisibleContentPositionExample';
exports.category = 'Basic';
exports.description =
  'Test maintainVisibleContentPosition prop on ScrollView when items are prepended';

exports.examples = [
  {
    title: 'maintainVisibleContentPosition',
    render: () => <ScrollView_maintainVisibleContentPosition />,
  },
] as Array<RNTesterModuleExample>;
