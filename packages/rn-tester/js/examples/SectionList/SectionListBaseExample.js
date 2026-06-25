/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';
import {
  Button,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const DATA = [
  {
    data: ['Pizza', 'Burger', 'Risotto'],
    title: 'Main dishes',
  },
  {
    data: ['French Fries', 'Onion Rings', 'Fried Shrimps'],
    title: 'Sides',
  },
  {
    data: ['Water', 'Coke', 'Beer'],
    title: 'Drinks',
  },
  {
    data: ['Cheesecake', 'Brownie'],
    title: 'Desserts',
  },
];

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
const Item = ({item, section, separators}) => {
  return (
    <Pressable
      onPressIn={() => {
        separators.highlight();
      }}
      onPress={() => {
        separators.updateProps('trailing', {hasBeenHighlighted: true});
        separators.updateProps('leading', {hasBeenHighlighted: true});
      }}
      onPressOut={() => {
        separators.unhighlight();
      }}
      style={({pressed}) => [
        styles.item,
        {
          backgroundColor: pressed ? 'red' : 'pink',
        },
      ]}
      testID={item}>
      <Text style={styles.title}>{item}</Text>
    </Pressable>
  );
};

type Props = Readonly<{
  // $FlowFixMe[unclear-type]
  exampleProps: Partial<React.ElementConfig<typeof SectionList<any>>>,
  onTest?: ?() => void,
  testLabel?: ?string,
  testOutput?: ?string,
  children?: ?React.Node,
}>;

const SectionListBaseExample: component(
  // $FlowFixMe[unclear-type]
  ref?: React.RefSetter<SectionList<any>>,
  ...props: Props
) = ({
  ref,
  ...props
}: {
  // $FlowFixMe[unclear-type]
  ref: React.RefSetter<SectionList<any>>,
  ...Props,
}): React.Node => {
  return (
    <View style={styles.container}>
      {props.testOutput != null ? (
        <View testID="test_container" style={styles.testContainer}>
          <Text style={styles.output} numberOfLines={1} testID="output">
            {props.testOutput}
          </Text>
          {props.onTest != null ? (
            <Button
              testID="start_test"
              onPress={props.onTest}
              title={props.testLabel ?? 'Test'}
            />
          ) : null}
        </View>
      ) : null}
      {props.children}
      <SectionList
        ref={ref}
        testID="section_list"
        accessibilityRole="list"
        sections={DATA}
        keyExtractor={(item, index) => item + index}
        style={styles.list}
        renderItem={Item}
        /* $FlowFixMe[prop-missing] Error revealed after improved builtin React
         * utility types */
        renderSectionHeader={({section: {title}}) => (
          <Text style={styles.header}>{title}</Text>
        )}
        {...props.exampleProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    backgroundColor: 'white',
    fontSize: 32,
  },
  item: {
    backgroundColor: 'pink',
    marginVertical: 8,
    padding: 20,
  },
  list: {
    flex: 1,
  },
  output: {
    flex: 1,
    fontSize: 12,
  },
  testContainer: {
    alignItems: 'center',
    backgroundColor: '#f2f2f7ff',
    flexDirection: 'row',
    height: 40,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
  },
});

export default SectionListBaseExample;
