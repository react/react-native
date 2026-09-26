/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import BaseFlatListExample, {ITEM_HEIGHT} from './BaseFlatListExample';
import * as React from 'react';
import {useRef, useState} from 'react';
import {Button, FlatList} from 'react-native';

const DATA = Array.from({length: 20}, (_, index) => `Item ${index}`);
const SCROLL_TO_ITEM = DATA[18];

type EventCounts = {
  dragEvents: number,
  onEndReached: number,
  onMomentumScrollEnd: number,
  onStartReached: number,
};

export component FlatList_onEndReached() {
  const [output, setOutput] = useState('ready');
  const listRef = useRef<?FlatList<string>>(null);
  const actionRef = useRef<'end' | 'start'>('end');
  const attemptsRef = useRef(0);
  const eventCountsRef = useRef<EventCounts>({
    dragEvents: 0,
    onEndReached: 0,
    onMomentumScrollEnd: 0,
    onStartReached: 0,
  });
  const recordEventsRef = useRef(false);
  const momentumEndedRef = useRef(false);

  const report = () => {
    const {dragEvents, onEndReached, onMomentumScrollEnd, onStartReached} =
      eventCountsRef.current;
    setOutput(
      `${actionRef.current}: attempts=${attemptsRef.current}, ` +
        `onEndReached=${onEndReached}, onStartReached=${onStartReached}, ` +
        `onMomentumScrollEnd=${onMomentumScrollEnd}, dragEvents=${dragEvents}`,
    );
  };

  const onEndReached = () => {
    if (recordEventsRef.current) {
      eventCountsRef.current.onEndReached++;
      if (momentumEndedRef.current) {
        report();
      }
    }
  };

  const onStartReached = () => {
    if (recordEventsRef.current) {
      eventCountsRef.current.onStartReached++;
      if (momentumEndedRef.current) {
        report();
      }
    }
  };

  const onMomentumScrollEnd = () => {
    if (recordEventsRef.current) {
      eventCountsRef.current.onMomentumScrollEnd++;
      momentumEndedRef.current = true;
      report();
    }
  };

  const onDragEvent = () => {
    if (recordEventsRef.current) {
      eventCountsRef.current.dragEvents++;
    }
  };

  const scrollToEnd = () => {
    recordEventsRef.current = true;
    momentumEndedRef.current = false;
    actionRef.current = 'end';
    attemptsRef.current++;
    setOutput('running');
    listRef.current?.scrollToItem({
      animated: true,
      item: SCROLL_TO_ITEM,
      viewOffset: -ITEM_HEIGHT,
    });
  };

  const scrollToStart = () => {
    momentumEndedRef.current = false;
    actionRef.current = 'start';
    attemptsRef.current++;
    setOutput('running');
    listRef.current?.scrollToOffset({animated: true, offset: 0});
  };

  const exampleProps = {
    initialNumToRender: 19,
    onEndReached,
    onEndReachedThreshold: 0.2,
    onMomentumScrollEnd,
    onScrollBeginDrag: onDragEvent,
    onScrollEndDrag: onDragEvent,
    onStartReached,
    onStartReachedThreshold: 0.1,
    windowSize: 2,
  };

  return (
    <BaseFlatListExample
      ref={listRef}
      data={DATA}
      exampleProps={exampleProps}
      testOutput={output}
      onTest={scrollToEnd}
      testLabel="Scroll to item">
      <Button
        testID="scroll_to_start"
        onPress={scrollToStart}
        title="Scroll to start"
      />
      <Button
        testID="scroll_to_end"
        onPress={scrollToEnd}
        title="Scroll to item"
      />
    </BaseFlatListExample>
  );
}

export default {
  title: 'onEndReached',
  name: 'onEndReached',
  description:
    'Programmatic scrolling calls edge callbacks once and does not emit drag callbacks.',
  render: function () {
    return <FlatList_onEndReached />;
  },
} as RNTesterModuleExample;
