/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Item as ExampleItem} from '../../components/ListExampleShared';
import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {
  ListRenderItem,
  ListRenderItemInfo,
  ModeChangeEvent,
  ScrollViewProps,
  Separators,
  StyleProp,
  ViewStyle,
  unstable_VirtualCollection as VirtualCollection,
  unstable_VirtualItem as VirtualItem,
} from 'react-native';

import {
  FooterComponent,
  HeaderComponent,
  ItemComponent,
  SeparatorComponent,
  genNewerItems,
  pressItem,
  renderSmallSwitchOption,
} from '../../components/ListExampleShared';
import RNTesterPage from '../../components/RNTesterPage';
import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useCallback, useMemo, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  VirtualViewMode,
  unstable_createVirtualCollectionView as createVirtualCollectionView,
  unstable_VirtualArray as VirtualArray,
  unstable_VirtualColumn as VirtualColumn,
  unstable_VirtualColumnGenerator as VirtualColumnGenerator,
  unstable_VirtualRow as VirtualRow,
  unstable_VirtualView as VirtualView,
} from 'react-native';

/**
 * The shape shared by `VirtualColumn`, `VirtualRow`, and any component made by
 * `createVirtualCollectionView`. Each item is wrapped in a `VirtualView`, which
 * unmounts its children when it scrolls far enough off screen, and items not
 * yet mounted are represented by a single spacer whose size is estimated.
 */
type VirtualCollectionComponentType = component<TItem extends VirtualItem>(
  children: (item: TItem, key: string) => React.Node,
  items: VirtualCollection<TItem>,
  itemToKey?: (v: TItem) => string,
  removeClippedSubviews?: boolean,
  testID?: ?string,
);

type ItemAndSeparator<T> = {
  item: T,
  separator: ?React.ComponentType<{}>,
  index: number,
  type: 'item' | 'separator',
};

type ItemAndIndex<T> = {
  item: T,
  index: number,
};

const placeholderSeparators: Separators = {
  highlight: () => {},
  unhighlight: () => {},
  updateProps: () => {},
};

/**
 * Groups an array into rows of `groupSize` items. Each row is cached by its
 * first item so that the virtual collection sees a stable item (and keeps the
 * row mounted) as long as the row's contents do not change.
 */
function groupArray<T extends VirtualItem>(
  array: ?Readonly<$ArrayLike<T>>,
  groupSize: number,
  separator: ?React.ComponentType<{}>,
  itemAndSeparatorCache: WeakMap<
    T,
    ItemAndSeparator<ReadonlyArray<ItemAndIndex<T>>>,
  >,
  itemToKey: (v: ItemAndIndex<T>) => string,
): ReadonlyArray<ItemAndSeparator<ReadonlyArray<ItemAndIndex<T>>>> {
  const groupedArray: Array<ItemAndSeparator<ReadonlyArray<ItemAndIndex<T>>>> =
    [];

  if (array == null) {
    return groupedArray;
  }

  for (let i = 0; i < array.length; i += groupSize) {
    let itemAndSeparator = itemAndSeparatorCache.get(array[i]);

    const groupIndex = i / groupSize;
    const group = [];
    for (let j = 0; j < groupSize; j++) {
      const index = i + j;
      if (index < array.length) {
        group.push({index, item: array[index]});
      }
    }

    if (
      itemAndSeparator == null ||
      itemAndSeparator.index !== groupIndex ||
      JSON.stringify(itemAndSeparator.item.map(itemToKey)) !==
        JSON.stringify(group.map(itemToKey))
    ) {
      itemAndSeparator = {
        index: groupIndex,
        item: group,
        separator: i === 0 ? null : separator,
        type: 'item',
      };
      itemAndSeparatorCache.set(array[i], itemAndSeparator);
    }
    groupedArray.push(itemAndSeparator);
  }

  return groupedArray;
}

/**
 * Renders one item per virtual cell, using either `VirtualColumn` or
 * `VirtualRow`. Separators are rendered as their own virtual cells.
 */
component SingleVirtualGroup<T extends VirtualItem>(
  VirtualCollectionComponent: VirtualCollectionComponentType,
  data: ?Readonly<$ArrayLike<T>>,
  keyExtractor: (item: T, index: number) => string,
  renderItem: ListRenderItem<T>,
  ItemSeparatorComponent?: ?React.ComponentType<{}>,
  removeClippedSubviews?: boolean,
  testID?: ?string,
) {
  const itemToKey = useCallback(
    ({item, index, type}: ItemAndSeparator<T>) => {
      if (type === 'separator') {
        return `separator-${index}`;
      }
      return keyExtractor(item, index);
    },
    [keyExtractor],
  );

  // Items handed to the virtual collection must be stable across renders, so
  // that unchanged cells are not re-rendered.
  const [itemAndSeparatorCache] = useState<WeakMap<T, ItemAndSeparator<T>>>(
    () => new WeakMap(),
  );

  const items = useMemo(() => {
    const itemAndSeparators: Array<ItemAndSeparator<T>> = [];
    if (data == null) {
      return itemAndSeparators;
    }
    for (let index = 0; index < data.length; index++) {
      const item = data[index];
      if (index > 0 && ItemSeparatorComponent != null) {
        itemAndSeparators.push({
          index,
          item,
          separator: ItemSeparatorComponent,
          type: 'separator',
        });
      }
      let itemAndSeparator = itemAndSeparatorCache.get(item);
      if (itemAndSeparator == null || itemAndSeparator.index !== index) {
        itemAndSeparator = {index, item, separator: null, type: 'item'};
        itemAndSeparatorCache.set(item, itemAndSeparator);
      }
      itemAndSeparators.push(itemAndSeparator);
    }
    return itemAndSeparators;
  }, [ItemSeparatorComponent, data, itemAndSeparatorCache]);

  const render = useCallback(
    ({item, index, separator: Separator, type}: ItemAndSeparator<T>) => {
      if (type === 'separator') {
        return Separator != null ? <Separator /> : null;
      }
      return renderItem({index, item, separators: placeholderSeparators});
    },
    [renderItem],
  );

  return (
    <VirtualCollectionComponent
      items={new VirtualArray(items)}
      itemToKey={itemToKey}
      removeClippedSubviews={removeClippedSubviews}
      testID={testID}>
      {render}
    </VirtualCollectionComponent>
  );
}

/**
 * Renders `numColumns` items per virtual cell by grouping the data into rows.
 */
component MultiVirtualColumn<T extends VirtualItem>(
  numColumns: number,
  data: ?Readonly<$ArrayLike<T>>,
  keyExtractor: (item: T, index: number) => string,
  renderItem: ListRenderItem<T>,
  columnWrapperStyle?: StyleProp<ViewStyle>,
  ItemSeparatorComponent?: ?React.ComponentType<{}>,
  removeClippedSubviews?: boolean,
  testID?: ?string,
) {
  const [itemAndSeparatorCache] = useState<
    WeakMap<T, ItemAndSeparator<ReadonlyArray<ItemAndIndex<T>>>>,
  >(() => new WeakMap());

  const itemToKey = useCallback(
    ({item, index}: ItemAndIndex<T>) => keyExtractor(item, index),
    [keyExtractor],
  );

  const rowToKey = useCallback(
    ({item}: ItemAndSeparator<ReadonlyArray<ItemAndIndex<T>>>) =>
      JSON.stringify(item.map(itemToKey)),
    [itemToKey],
  );

  const rows = useMemo(
    () =>
      groupArray<T>(
        data,
        numColumns,
        ItemSeparatorComponent,
        itemAndSeparatorCache,
        itemToKey,
      ),
    [
      data,
      numColumns,
      ItemSeparatorComponent,
      itemAndSeparatorCache,
      itemToKey,
    ],
  );

  const renderRow = useCallback(
    ({
      item: row,
      separator: Separator,
    }: ItemAndSeparator<ReadonlyArray<ItemAndIndex<T>>>) => (
      <>
        {Separator != null && <Separator />}
        <View style={StyleSheet.compose(styles.row, columnWrapperStyle)}>
          {row.map(({item, index}: ItemAndIndex<T>) => (
            <React.Fragment key={keyExtractor(item, index)}>
              {renderItem({index, item, separators: placeholderSeparators})}
            </React.Fragment>
          ))}
        </View>
      </>
    ),
    [columnWrapperStyle, keyExtractor, renderItem],
  );

  return (
    <VirtualColumn
      items={new VirtualArray(rows)}
      itemToKey={rowToKey}
      removeClippedSubviews={removeClippedSubviews}
      testID={testID}>
      {renderRow}
    </VirtualColumn>
  );
}

/**
 * The layout used by a custom virtual column: mounted items followed by the
 * spacer that stands in for the items that are not mounted yet.
 */
component VirtualColumnLayout(
  children: ReadonlyArray<React.Node>,
  spacer: React.Node,
) {
  return (
    <>
      {children}
      {spacer}
    </>
  );
}

let virtualColumnsByInitialItems: ?Map<string, VirtualCollectionComponentType> =
  null;

/**
 * Shows how to build a custom virtual column with
 * `createVirtualCollectionView`. The returned column mounts
 * `initialItemCount` items in its first render and, until the spacer measures
 * mounted items, estimates `deferredItemHeight` for each unmounted item.
 * Falls back to the default `VirtualColumn` otherwise.
 */
function getVirtualColumnForInitialItems(
  initialItemCount: ?number,
  deferredItemHeight: ?number,
): VirtualCollectionComponentType {
  if (
    initialItemCount == null ||
    deferredItemHeight == null ||
    !Number.isInteger(initialItemCount) ||
    initialItemCount < 1 ||
    initialItemCount >= VirtualColumnGenerator.initial.itemCount ||
    !Number.isFinite(deferredItemHeight) ||
    deferredItemHeight <= 0
  ) {
    return VirtualColumn;
  }
  if (virtualColumnsByInitialItems == null) {
    virtualColumnsByInitialItems = new Map();
  }
  const virtualColumns = virtualColumnsByInitialItems;
  const key = `${initialItemCount}:${deferredItemHeight}`;
  let virtualColumn = virtualColumns.get(key);
  if (virtualColumn == null) {
    virtualColumn = createVirtualCollectionView(VirtualColumnLayout, {
      ...VirtualColumnGenerator,
      initial: {
        itemCount: initialItemCount,
        spacerStyle: (itemCount: number) => ({
          height: itemCount * deferredItemHeight,
        }),
      },
    });
    virtualColumns.set(key, virtualColumn);
  }
  return virtualColumn;
}

/**
 * A `VirtualView` placed after the last item. `VirtualView` reports a mode
 * change when it enters the prerender region ahead of the viewport, which is
 * used here to request more data before the end of the list becomes visible.
 * It is remounted for every new data length, so `onEndReached` fires at most
 * once per length.
 */
component EndReachedSentinel(onEndReached: () => void) {
  return (
    <VirtualView
      style={styles.endReachedSentinel}
      onModeChange={(event: ModeChangeEvent) => {
        if (event.mode !== VirtualViewMode.Hidden) {
          onEndReached();
        }
      }}
    />
  );
}

/**
 * A `FlatList`-like component built directly on `VirtualColumn`,
 * `VirtualRow`, and `VirtualView` inside a plain `ScrollView`.
 */
export component VirtualCollectionFlatList<T extends VirtualItem>(
  data: ?Readonly<$ArrayLike<T>>,
  keyExtractor: (item: T, index: number) => string,
  renderItem: ListRenderItem<T>,
  numColumns: number = 1,
  columnWrapperStyle?: StyleProp<ViewStyle>,
  ItemSeparatorComponent?: ?React.ComponentType<{}>,
  ListHeaderComponent?: ?React.ComponentType<{}>,
  ListFooterComponent?: ?React.ComponentType<{}>,
  ListEmptyComponent?: ?React.ComponentType<{}>,
  onEndReached?: ?() => void,
  initialItemCount?: ?number,
  deferredItemHeight?: ?number,
  ...scrollViewProps: ScrollViewProps
) {
  const horizontal = scrollViewProps.horizontal ?? false;
  const removeClippedSubviews = scrollViewProps.removeClippedSubviews === true;
  const testID = scrollViewProps.testID;

  let list: React.Node;
  if (data == null || data.length === 0) {
    list = ListEmptyComponent != null ? <ListEmptyComponent /> : null;
  } else if (horizontal) {
    list = (
      <View collapsable={false} style={styles.row}>
        <SingleVirtualGroup
          VirtualCollectionComponent={VirtualRow}
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ItemSeparatorComponent={ItemSeparatorComponent}
          removeClippedSubviews={removeClippedSubviews}
          testID={testID}
        />
      </View>
    );
  } else {
    list = (
      <View collapsable={false} style={styles.column}>
        {numColumns > 1 ? (
          <MultiVirtualColumn
            numColumns={numColumns}
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            columnWrapperStyle={columnWrapperStyle}
            ItemSeparatorComponent={ItemSeparatorComponent}
            removeClippedSubviews={removeClippedSubviews}
            testID={testID}
          />
        ) : (
          <SingleVirtualGroup
            VirtualCollectionComponent={getVirtualColumnForInitialItems(
              initialItemCount,
              deferredItemHeight,
            )}
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ItemSeparatorComponent={ItemSeparatorComponent}
            removeClippedSubviews={removeClippedSubviews}
            testID={testID}
          />
        )}
      </View>
    );
  }

  return (
    <ScrollView {...scrollViewProps}>
      {ListHeaderComponent != null && <ListHeaderComponent />}
      {list}
      {ListFooterComponent != null && <ListFooterComponent />}
      {onEndReached != null && (
        <EndReachedSentinel
          key={`end-reached-${data?.length ?? 0}`}
          onEndReached={onEndReached}
        />
      )}
    </ScrollView>
  );
}

const PAGE_SIZE = 50;
const MAX_ITEMS = 1000;

component VirtualCollectionExample() {
  const [data, setData] = useState<Array<ExampleItem>>(() =>
    genNewerItems(PAGE_SIZE),
  );
  const [multiColumn, setMultiColumn] = useState(false);

  const onPressItem = useCallback((key: string) => {
    setData(items =>
      items.map(item => (item.key === key ? pressItem(item) : item)),
    );
  }, []);

  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<ExampleItem>) => (
      <View style={multiColumn ? styles.card : null}>
        <ItemComponent item={item} onPress={onPressItem} />
      </View>
    ),
    [multiColumn, onPressItem],
  );

  const onEndReached = useCallback(() => {
    setData(items =>
      items.length >= MAX_ITEMS
        ? items
        : [...items, ...genNewerItems(PAGE_SIZE, items.length)],
    );
  }, []);

  return (
    <RNTesterPage title="Virtual Collection" noScroll={true}>
      <View style={styles.options}>
        {renderSmallSwitchOption('Multi-column', multiColumn, setMultiColumn)}
        <RNTesterText>Items: {data.length}</RNTesterText>
      </View>
      <SeparatorComponent />
      <VirtualCollectionFlatList
        data={data}
        keyExtractor={exampleKeyExtractor}
        renderItem={renderItem}
        numColumns={multiColumn ? 2 : 1}
        ItemSeparatorComponent={multiColumn ? null : SeparatorComponent}
        ListHeaderComponent={HeaderComponent}
        ListFooterComponent={FooterComponent}
        onEndReached={onEndReached}
      />
    </RNTesterPage>
  );
}

function exampleKeyExtractor(item: ExampleItem): string {
  return item.key;
}

const styles = StyleSheet.create({
  card: {
    borderColor: 'lightgray',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    margin: 4,
    overflow: 'hidden',
  },
  column: {
    flexDirection: 'column',
  },
  endReachedSentinel: {
    minHeight: 1,
    minWidth: 1,
  },
  options: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  row: {
    flexDirection: 'row',
  },
});

export default {
  title: 'Virtual Collection',
  name: 'virtualCollection',
  description:
    'A FlatList-like list built directly on VirtualColumn, VirtualRow and VirtualView.',
  render: () => <VirtualCollectionExample />,
} as RNTesterModuleExample;
