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
import {FlatList} from 'react-native';

export component FlatList_onStartReached() {
  const [output, setOutput] = useState('');
  const exampleProps = {
    onStartReached: (info: {distanceFromStart: number, ...}) =>
      setOutput('onStartReached'),
    onStartReachedThreshold: 0,
    initialScrollIndex: 5,
    getItemLayout: (data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
  };
  const ref = useRef<?FlatList<string>>(null);

  const onTest = () => {
    ref.current?.scrollToOffset({offset: 0});
  };

  return (
    <BaseFlatListExample
      ref={ref}
      exampleProps={exampleProps}
      testOutput={output}
      onTest={onTest}
    />
  );
}

export default {
  title: 'onStartReached',
  name: 'onStartReached',
  description:
    'Scroll to start of list or tap Test button to see `onStartReached` triggered.',
  render: function () {
    return <FlatList_onStartReached />;
  },
} as RNTesterModuleExample;
