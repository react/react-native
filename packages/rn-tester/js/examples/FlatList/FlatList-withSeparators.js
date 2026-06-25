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

import BaseFlatListExample from './BaseFlatListExample';
import * as React from 'react';
import {useRef} from 'react';
import {StyleSheet, Text, View} from 'react-native';

const Separator =
  (defaultColor: string, highlightColor: string) =>
  ({
    leadingItem,
    trailingItem,
    highlighted,
    hasBeenHighlighted,
  }: $FlowFixMe) => {
    const text = `Separator for leading ${leadingItem} and trailing ${trailingItem} has ${
      !hasBeenHighlighted ? 'not ' : ''
    }been pressed`;

    return (
      <View
        style={[
          styles.separator,
          {backgroundColor: highlighted ? highlightColor : defaultColor},
        ]}>
        <Text testID="flat_list_separator" style={styles.separatorText}>
          {text}
        </Text>
      </View>
    );
  };

export component FlatList_withSeparators() {
  const exampleProps = {
    ItemSeparatorComponent: Separator('lightgreen', 'green'),
  };
  const ref = useRef<$FlowFixMe>(null);

  return <BaseFlatListExample ref={ref} exampleProps={exampleProps} />;
}

const styles = StyleSheet.create({
  separator: {
    height: 12,
  },
  separatorText: {
    fontSize: 10,
  },
});

export default {
  title: 'FlatList with Separators',
  name: 'separators',
  description: 'Tap to see pressed states for separator components.',
  render: () => <FlatList_withSeparators />,
} as RNTesterModuleExample;
