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
import {useRef, useState} from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const DATA = Array.from({length: 60}, (_, index) => ({
  id: String(index + 1),
  text: `Item ${index + 1}`,
}));

const START = 400;

type Mode = 'top' | 'translateY' | 'left' | 'nested';
const MODES: Array<Mode> = ['top', 'translateY', 'left', 'nested'];
const MULTIPLIERS = [0, 1, 2];

function MovingScrollViewExample(): React.Node {
  const [mode, setMode] = useState<Mode>('top');
  const [multiplier, setMultiplier] = useState(1);
  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        {MODES.map(m => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            style={[styles.button, m === mode && styles.active]}>
            <Text>{m}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.toolbar}>
        {MULTIPLIERS.map(m => (
          <Pressable
            key={m}
            onPress={() => setMultiplier(m)}
            style={[styles.button, m === multiplier && styles.active]}>
            <Text>x{m}</Text>
          </Pressable>
        ))}
      </View>
      {mode === 'nested' ? (
        <NestedCase />
      ) : (
        <MovingCase
          key={`${mode}-${multiplier}`}
          mode={mode}
          multiplier={multiplier}
        />
      )}
    </View>
  );
}

function MovingCase({
  mode,
  multiplier,
}: {
  mode: Mode,
  multiplier: number,
}): React.Node {
  const [offset, setOffset] = useState(0);
  const [stutters, setStutters] = useState(0);
  const previous = useRef(0);
  const horizontal = mode === 'left';
  const shift = Math.max(
    0,
    (horizontal ? START / 2 : START) - offset * multiplier,
  );
  const moveStyle =
    mode === 'top'
      ? {top: shift}
      : mode === 'translateY'
        ? {transform: [{translateY: shift}]}
        : {left: shift};
  return (
    <>
      <Text>
        mode={mode} multiplier={multiplier} stutters={stutters} offset=
        {offset.toFixed(1)}
      </Text>
      <View style={styles.area}>
        <FlatList
          data={DATA}
          horizontal={horizontal}
          renderItem={({item}) => (
            <View style={horizontal ? styles.column : styles.row}>
              <Text>{item.text}</Text>
            </View>
          )}
          style={[styles.list, moveStyle]}
          scrollEventThrottle={16}
          onScroll={event => {
            const {x, y} = event.nativeEvent.contentOffset;
            const value = horizontal ? x : y;
            if (value < previous.current) {
              setStutters(s => s + 1);
            }
            previous.current = value;
            setOffset(value);
          }}
        />
      </View>
    </>
  );
}

function NestedCase(): React.Node {
  const [outer, setOuter] = useState(0);
  const [inner, setInner] = useState(0);
  return (
    <>
      <Text>
        outer={outer.toFixed(1)} inner={inner.toFixed(1)} sum=
        {(outer + inner).toFixed(1)}
      </Text>
      <ScrollView
        style={styles.container}
        scrollEventThrottle={16}
        onScroll={e => setOuter(e.nativeEvent.contentOffset.y)}>
        <View style={styles.nestedHeader} />
        <ScrollView
          nestedScrollEnabled
          style={styles.nestedInner}
          scrollEventThrottle={16}
          onScroll={e => setInner(e.nativeEvent.contentOffset.y)}>
          {DATA.slice(0, 12).map(item => (
            <View key={item.id} style={styles.row}>
              <Text>{item.text}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.nestedFooter} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  toolbar: {flexDirection: 'row', gap: 8, padding: 4},
  button: {padding: 8, backgroundColor: '#ddd'},
  active: {backgroundColor: '#8f8'},
  area: {flex: 1, backgroundColor: 'red', overflow: 'hidden'},
  list: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'green',
  },
  row: {height: 50},
  column: {width: 80, justifyContent: 'center'},
  nestedHeader: {height: 100, backgroundColor: 'red'},
  nestedInner: {height: 400, backgroundColor: 'green'},
  nestedFooter: {height: 2000, backgroundColor: 'blue'},
});

exports.title = 'MovingScrollViewExample';
exports.category = 'Basic';
exports.description = 'ScrollView that moves while it is dragged (#38470).';
exports.examples = [
  {
    title: 'Moving scroll view',
    render(): React.MixedElement {
      return <MovingScrollViewExample />;
    },
  },
] as Array<RNTesterModuleExample>;
