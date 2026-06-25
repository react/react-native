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

import BaseFlatListExample from './BaseFlatListExample';
import * as React from 'react';
import {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

export component FlatList_contentInset() {
  const [initialContentInset, toggledContentInset] = [44, 88];

  const [output, setOutput] = useState(
    `contentInset top: ${initialContentInset.toString()}`,
  );
  const [exampleProps, setExampleProps] = useState({
    automaticallyAdjustContentInsets: false,
    contentInset: {top: initialContentInset},
    contentOffset: {y: -initialContentInset, x: 0},
  });

  const onTest = () => {
    const newContentInset =
      exampleProps.contentInset.top === initialContentInset
        ? toggledContentInset
        : initialContentInset;
    setExampleProps({
      automaticallyAdjustContentInsets: false,
      contentInset: {top: newContentInset},
      contentOffset: {y: -newContentInset, x: 0},
    });
    setOutput(`contentInset top: ${newContentInset.toString()}`);
  };

  return (
    <>
      <View
        style={[
          styles.titleContainer,
          {height: exampleProps.contentInset.top},
        ]}>
        <Text style={styles.titleText}>Menu</Text>
      </View>
      <BaseFlatListExample
        exampleProps={exampleProps}
        testOutput={output}
        onTest={onTest}
        testLabel={'Toggle header size'}
      />
    </>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'gray',
    zIndex: 1,
  },
  titleText: {
    fontSize: 24,
    lineHeight: 44,
    fontWeight: 'bold',
  },
});

export default {
  title: 'Content Inset',
  name: 'contentInset',
  description:
    'The amount by which the scroll view content is inset from the edges of the scroll view.',
  render: () => <FlatList_contentInset />,
} as RNTesterModuleExample;
