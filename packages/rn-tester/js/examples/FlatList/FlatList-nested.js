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
import type {ListRenderItemInfo} from 'react-native';
import type {ViewToken} from 'react-native/Libraries/Lists/ViewabilityHelper';

import RNTesterPage from '../../components/RNTesterPage';
import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useCallback, useEffect, useMemo, useReducer} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';

type OuterItem = 'head' | 'vertical' | 'horizontal' | 'filler';

const outerItems: OuterItem[] = [
  'head',
  'vertical',
  'filler',
  'horizontal',
  'filler',
  'vertical',
];

const items = [1, 2, 3, 4, 5];

type ItemsState = {
  renderedItems: number[],
  viewableItems: number[],
};

const initialItemsState: ItemsState = {
  renderedItems: [],
  viewableItems: [],
};

type ItemsAction = {
  type: 'add-rendered' | 'add-viewable' | 'remove-rendered' | 'remove-viewable',
  item: number,
};

function reducer(state: ItemsState, action: ItemsAction): ItemsState {
  if (action.type === 'add-rendered') {
    if (state.renderedItems.includes(action.item)) {
      return state;
    } else {
      return {...state, renderedItems: [...state.renderedItems, action.item]};
    }
  } else if (action.type === 'add-viewable') {
    if (state.viewableItems.includes(action.item)) {
      return state;
    } else {
      return {...state, viewableItems: [...state.viewableItems, action.item]};
    }
  } else if (action.type === 'remove-rendered') {
    return {
      ...state,
      renderedItems: state.renderedItems.filter(i => i !== action.item),
    };
  } else if (action.type === 'remove-viewable') {
    return {
      ...state,
      viewableItems: state.viewableItems.filter(i => i !== action.item),
    };
  }

  return state;
}

component NestedListExample() {
  const [outer, dispatchOuter] = useReducer(reducer, initialItemsState);
  const [inner, dispatchInner] = useReducer(reducer, initialItemsState);
  const sortedInnerViewableItems = useMemo(
    () => [...inner.viewableItems].sort((a, b) => a - b).join(', '),
    [inner.viewableItems],
  );
  const sortedInnerRenderedItems = useMemo(
    () => [...inner.renderedItems].sort((a, b) => a - b).join(', '),
    [inner.renderedItems],
  );

  const onViewableItemsChanged = useCallback(
    ({
      changed,
    }: {
      changed: Array<ViewToken>,
      viewableItems: Array<ViewToken>,
      ...
    }) => {
      for (const token of changed) {
        dispatchOuter({
          type: token.isViewable ? 'add-viewable' : 'remove-viewable',
          item: token.index ?? -1,
        });
      }
    },
    [dispatchOuter],
  );

  return (
    <RNTesterPage noScroll={true}>
      <RNTesterText style={styles.debugText}>
        <Text style={styles.debugTextHeader}>Outer Viewable:{'\n'}</Text>
        {outerItems
          .map((item, i) => ({item, i}))
          .filter(o => outer.viewableItems.includes(o.i))
          .map(({item, i}) => `${i} (${item})`)
          .join(', ')}
      </RNTesterText>
      <RNTesterText style={styles.debugText}>
        <Text style={styles.debugTextHeader}>Outer Rendered:{'\n'}</Text>
        {outerItems
          .map((item, i) => ({item, i}))
          .filter(o => outer.renderedItems.includes(o.i))
          .map(({item, i}) => `${i} (${item})`)
          .join(', ')}
      </RNTesterText>
      <RNTesterText style={styles.debugText}>
        <Text style={styles.debugTextHeader}>Inner Viewable:{'\n'}</Text>
        {sortedInnerViewableItems}
      </RNTesterText>
      <RNTesterText style={styles.debugText}>
        <Text style={styles.debugTextHeader}>Inner Rendered:{'\n'}</Text>
        {sortedInnerRenderedItems}
      </RNTesterText>

      <FlatList
        data={outerItems}
        renderItem={({index, item}) => (
          <OuterItemRenderer
            index={index}
            item={item}
            dispatchOuter={dispatchOuter}
            dispatchInner={dispatchInner}
          />
        )}
        style={styles.list}
        windowSize={3}
        initialNumToRender={1}
        onViewableItemsChanged={onViewableItemsChanged}
      />
    </RNTesterPage>
  );
}

component OuterItemRenderer(
  index: number,
  item: OuterItem,
  dispatchOuter: ItemsAction => void,
  dispatchInner: ItemsAction => void,
) {
  useEffect(() => {
    dispatchOuter({
      type: 'add-rendered',
      item: index,
    });

    return () => {
      dispatchOuter({
        type: 'remove-rendered',
        item: index,
      });
    };
  }, [dispatchOuter, index]);

  const onViewableItemsChanged = useCallback(
    ({
      changed,
    }: {
      changed: Array<ViewToken>,
      viewableItems: Array<ViewToken>,
      ...
    }) => {
      for (const token of changed) {
        dispatchInner({
          type: token.isViewable ? 'add-viewable' : 'remove-viewable',
          item: token.item,
        });
      }
    },
    [dispatchInner],
  );

  switch (item) {
    case 'head':
      return (
        <View style={styles.header}>
          <Text>Header</Text>
        </View>
      );

    case 'vertical':
      return (
        <View style={styles.body}>
          <View style={styles.col}>
            <FlatList
              data={items.map(i => index * items.length * 3 + i)}
              renderItem={(p: ListRenderItemInfo<number>) => (
                <InnerItemRenderer
                  item={p.item}
                  dispatchInner={dispatchInner}
                />
              )}
              style={styles.childList}
              onViewableItemsChanged={onViewableItemsChanged}
              windowSize={1}
              initialNumToRender={1}
            />
          </View>
          <View style={styles.col}>
            <FlatList
              data={items.map(i => index * items.length * 3 + i + items.length)}
              renderItem={(p: ListRenderItemInfo<number>) => (
                <InnerItemRenderer
                  item={p.item}
                  dispatchInner={dispatchInner}
                />
              )}
              style={styles.childList}
              onViewableItemsChanged={onViewableItemsChanged}
              windowSize={1}
              initialNumToRender={1}
            />
          </View>
        </View>
      );

    case 'horizontal':
      return (
        <View style={styles.row}>
          <FlatList
            horizontal={true}
            data={items.map(
              i => index * items.length * 3 + i + 2 * items.length,
            )}
            renderItem={(p: ListRenderItemInfo<number>) => (
              <InnerItemRenderer item={p.item} dispatchInner={dispatchInner} />
            )}
            style={styles.childList}
            onViewableItemsChanged={onViewableItemsChanged}
          />
        </View>
      );

    case 'filler':
      return <View style={styles.filler} />;
  }
}

component InnerItemRenderer(item: number, dispatchInner: ItemsAction => void) {
  useEffect(() => {
    dispatchInner({
      type: 'add-rendered',
      item: item,
    });

    return () => {
      dispatchInner({
        type: 'remove-rendered',
        item: item,
      });
    };
  }, [dispatchInner, item]);

  return (
    <View style={styles.cell}>
      <View style={styles.item}>
        <Text>{item}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  debugText: {
    fontSize: 10,
  },
  debugTextHeader: {
    fontWeight: 'bold',
  },
  list: {
    borderWidth: 1,
    borderColor: 'black',
  },
  body: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  col: {
    flex: 1,
    padding: 10,
  },
  row: {
    flex: 1,
  },
  filler: {
    height: 72,
    backgroundColor: 'lightblue',
  },
  childList: {
    backgroundColor: 'lightgreen',
  },
  header: {
    height: 40,
    backgroundColor: 'lightcoral',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cell: {
    padding: 10,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: 'oldlace',
    height: 72,
    minWidth: 144,
  },
});

export default {
  title: 'Nested',
  description: 'Nested FlatLists of same and opposite orientation',
  name: 'nested',
  render: NestedListExample,
} as RNTesterModuleExample;
