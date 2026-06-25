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

import type {ItemDataType} from './itemData';
import type {ScrollEvent} from 'react-native';

import * as React from 'react';
import {FlatList, ScrollView, StyleSheet, Text, View} from 'react-native';

function Item(props: {data: ItemDataType}): React.Node {
  const {data} = props;
  return (
    <View style={styles.itemContainer}>
      <Text style={styles.itemName}>{data.name}</Text>
      <Text>{`Age: ${data.age}`}</Text>
      <Text>{`Address: ${data.address}`}</Text>
      <Text>{`id: ${data.id}`}</Text>
    </View>
  );
}

type ItemListProps = Readonly<{
  data: ItemDataType[],
  useFlatList?: boolean,
  onScroll?: (evt: ScrollEvent) => void,
  ...
}>;

function renderItem({item}: {item: ItemDataType, ...}): React.MixedElement {
  return <Item data={item} />;
}

function ItemList(props: ItemListProps): React.Node {
  const {data, useFlatList = false, onScroll} = props;

  return (
    <View style={styles.container}>
      {useFlatList ? (
        <FlatList
          horizontal
          onScroll={onScroll}
          data={data}
          renderItem={renderItem}
        />
      ) : (
        <ScrollView horizontal onScroll={onScroll} scrollEventThrottle={16}>
          {data.map(item => (
            <Item data={item} key={item.id} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: 5,
  },
  itemContainer: {
    width: 200,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: 5,
    backgroundColor: 'gray',
    marginHorizontal: 5,
  },
  itemName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 15,
  },
});

export default ItemList;
