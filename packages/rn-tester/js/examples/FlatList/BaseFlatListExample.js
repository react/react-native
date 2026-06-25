/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ListRenderItemInfo} from 'react-native';

import * as React from 'react';
import {
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const DATA = [
  'Pizza',
  'Burger',
  'Risotto',
  'French Fries',
  'Onion Rings',
  'Fried Shrimps',
  'Water',
  'Coke',
  'Beer',
  'Cheesecake',
  'Brownie',
];

const Item = ({item, separators}: ListRenderItemInfo<string>) => {
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
  exampleProps: Partial<React.ElementConfig<typeof FlatList>>,
  onTest?: ?() => void,
  testLabel?: ?string,
  testOutput?: ?string,
  children?: ?React.Node,
}>;

const BaseFlatListExample: component(
  ref?: React.RefSetter<FlatList<string>>,
  ...props: Props
) = ({ref, ...props}: {ref: React.RefSetter<FlatList<string>>, ...Props}) => {
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
      <FlatList
        {...props.exampleProps}
        // $FlowFixMe[incompatible-type]
        ref={ref}
        testID="flat_list"
        // $FlowFixMe[incompatible-type]
        data={DATA}
        keyExtractor={(item, index) => item + index}
        style={styles.list}
        // $FlowFixMe[incompatible-type]
        renderItem={Item}
      />
    </View>
  );
};

export default BaseFlatListExample;

const ITEM_INNER_HEIGHT = 70;
const ITEM_MARGIN = 8;
export const ITEM_HEIGHT: number = ITEM_INNER_HEIGHT + ITEM_MARGIN * 2;

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    backgroundColor: 'white',
    fontSize: 32,
  },
  item: {
    backgroundColor: 'pink',
    height: ITEM_INNER_HEIGHT,
    justifyContent: 'center',
    marginVertical: ITEM_MARGIN,
    paddingHorizontal: 20,
  },
  list: {
    flex: 1,
  },
  offScreen: {
    height: 1000,
  },
  output: {
    fontSize: 12,
  },
  separator: {
    height: 12,
  },
  separatorText: {
    fontSize: 10,
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
  titleContainer: {
    alignItems: 'center',
    backgroundColor: 'gray',
    justifyContent: 'flex-end',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 45,
    zIndex: 1,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 44,
  },
});
