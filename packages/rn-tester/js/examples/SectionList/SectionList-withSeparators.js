/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import SectionListBaseExample from './SectionListBaseExample';
import * as React from 'react';
import {useRef} from 'react';
import {StyleSheet, Text, View} from 'react-native';

const Separator =
  (defaultColor: string, highlightColor: string, isSectionSeparator: boolean) =>
  ({leadingItem, trailingItem, highlighted, hasBeenHighlighted}: any) => {
    const text = `${
      isSectionSeparator ? 'Section ' : ''
    }separator for leading ${leadingItem} and trailing ${trailingItem} has ${
      !hasBeenHighlighted ? 'not ' : ''
    }been pressed`;

    return (
      <View
        style={[
          styles.separator,
          {backgroundColor: highlighted ? highlightColor : defaultColor},
        ]}>
        <Text style={styles.separatorText}>{text}</Text>
      </View>
    );
  };

export component SectionList_withSeparators() {
  const exampleProps = {
    ItemSeparatorComponent: Separator('lightgreen', 'green', false),
    SectionSeparatorComponent: Separator('lightblue', 'blue', true),
  };
  const ref = useRef<any>(null);

  return <SectionListBaseExample ref={ref} exampleProps={exampleProps} />;
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
  title: 'SectionList With Separators',
  name: 'withSeparators',
  render: function (): React.MixedElement {
    return <SectionList_withSeparators />;
  },
};
