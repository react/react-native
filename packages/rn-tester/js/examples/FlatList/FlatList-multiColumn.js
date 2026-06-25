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

import type {Item} from '../../components/ListExampleShared';
import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {ListRenderItemInfo} from 'react-native';

import {
  FooterComponent,
  HeaderComponent,
  ItemComponent,
  PlainInput,
  SeparatorComponent,
  genNewerItems,
  getItemLayout,
  pressItem,
  renderSmallSwitchOption,
} from '../../components/ListExampleShared';
import RNTesterPage from '../../components/RNTesterPage';
import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useCallback, useState} from 'react';
import {Alert, FlatList, StyleSheet, View} from 'react-native';

component MultiColumnExample() {
  const [data, setData] = useState(genNewerItems(1000));
  const [filterText, setFilterText] = useState('');
  const [fixedHeight, setFixedHeight] = useState(true);
  const [logViewable, setLogViewable] = useState(false);
  const [numColumns, setNumColumns] = useState(2);
  const [virtualized, setVirtualized] = useState(true);

  const _onChangeFilterText = (_filterText: string) => {
    setFilterText(_filterText);
  };
  const _onChangeNumColumns = (_numColumns: unknown) => {
    setNumColumns(Number(_numColumns));
  };

  const _setBooleanValue = (key: string) => (value: boolean) => {
    switch (key) {
      case 'virtualized':
        setVirtualized(value);
        break;
      case 'fixedHeight':
        setFixedHeight(value);
        break;
      case 'logViewable':
        setLogViewable(value);
        break;
    }
  };

  const _getItemLayout = (_data: any, index: number) => {
    const length =
      getItemLayout(_data, index).length + 2 * (CARD_MARGIN + BORDER_WIDTH);
    return {length, offset: length * index, index};
  };

  const _pressItem = useCallback(
    (key: string) => {
      const index = Number(key);
      const itemState = pressItem(data[index]);
      setData(state => [
        ...state.slice(0, index),
        itemState,
        ...state.slice(index + 1),
      ]);
    },
    [data],
  );

  const _renderItemComponent = useCallback(
    ({item}: ListRenderItemInfo<any | Item>): $FlowFixMe => {
      return (
        <View style={styles.card}>
          <ItemComponent
            item={item}
            fixedHeight={fixedHeight}
            onPress={_pressItem}
          />
        </View>
      );
    },
    [_pressItem, fixedHeight],
  );

  // This is called when items change viewability by scrolling into or out of the viewable area.
  const _onViewableItemsChanged = (info: {
    changed: Array<{
      key: string,
      isViewable: boolean,
      item: {columns: Array<any>, ...},
      index: ?number,
      section?: any,
      ...
    }>,
    ...
  }) => {
    // Impressions can be logged here
    if (logViewable) {
      console.log(
        'onViewableItemsChanged: ',
        info.changed.map(v => ({...v, item: '...'})),
      );
    }
  };

  const filterRegex = new RegExp(String(filterText), 'i');
  const filter = (item: any | Item) =>
    filterRegex.test(item.text) || filterRegex.test(item.title);
  const filteredData = data.filter(filter);

  return (
    <RNTesterPage title={'<FlatList> - MultiColumn'} noScroll={true}>
      <View style={styles.searchRow}>
        <View style={styles.row}>
          <PlainInput
            onChangeText={_onChangeFilterText}
            placeholder="Search..."
            value={filterText}
            placeholderTextColor="#000"
          />
          <RNTesterText> numColumns: </RNTesterText>
          <PlainInput
            clearButtonMode="never"
            onChangeText={_onChangeNumColumns}
            value={numColumns ? String(numColumns) : ''}
          />
        </View>
        <View style={styles.row}>
          {renderSmallSwitchOption(
            'Virtualized',
            virtualized,
            _setBooleanValue('virtualized'),
          )}
          {renderSmallSwitchOption(
            'Fixed Height',
            fixedHeight,
            _setBooleanValue('fixedHeight'),
          )}
          {renderSmallSwitchOption(
            'Log Viewable',
            logViewable,
            _setBooleanValue('logViewable'),
          )}
        </View>
      </View>
      <SeparatorComponent />
      <FlatList
        ListFooterComponent={FooterComponent}
        ListHeaderComponent={HeaderComponent}
        getItemLayout={fixedHeight ? _getItemLayout : undefined}
        data={filteredData}
        key={numColumns + (fixedHeight ? 'f' : 'v')}
        numColumns={numColumns || 1}
        onRefresh={() =>
          Alert.alert('Alert', 'onRefresh: nothing to refresh :P')
        }
        refreshing={false}
        renderItem={_renderItemComponent}
        disableVirtualization={virtualized}
        onViewableItemsChanged={_onViewableItemsChanged}
      />
    </RNTesterPage>
  );
}

const CARD_MARGIN = 4;
const BORDER_WIDTH = 1;

const styles = StyleSheet.create({
  card: {
    margin: CARD_MARGIN,
    borderRadius: 10,
    flex: 1,
    overflow: 'hidden',
    borderColor: 'lightgray',
    borderWidth: BORDER_WIDTH,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchRow: {
    padding: 10,
  },
});

export default {
  title: 'MultiColumn',
  name: 'multicolumn',
  description: 'Performant, scrollable grid of data',
  render: () => <MultiColumnExample />,
} as RNTesterModuleExample;
