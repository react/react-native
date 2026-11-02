/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {CellRendererProps} from '../VirtualizedListProps';
import type {LayoutRectangle} from 'react-native';
import type {ReactTestRenderer} from 'react-test-renderer';

import VirtualizedList from '../VirtualizedList';
import * as React from 'react';
import {View} from 'react-native';
import {act, create} from 'react-test-renderer';

jest.useFakeTimers();

type Item = {key: string};

let renderer: ?ReactTestRenderer = null;

function getRenderer(): ReactTestRenderer {
  if (renderer == null) {
    throw new Error('Expected a rendered tree.');
  }
  return renderer;
}

async function renderAsync(element: React.MixedElement): Promise<void> {
  await act(async () => {
    renderer = create(element);
  });
}

async function unmountAsync(): Promise<void> {
  await act(async () => {
    getRenderer().unmount();
  });
  renderer = null;
}

component NestedListTestCell(...props: CellRendererProps<Item>) {
  const {cellKey, children, onLayout, style} = props;
  return (
    <View testID={`outer-cell-${cellKey}`} onLayout={onLayout} style={style}>
      {children}
    </View>
  );
}

function fireLayout(testID: string, layout: LayoutRectangle): void {
  const [target] = getRenderer().root.findAll(
    node =>
      node.props != null &&
      node.props.testID === testID &&
      typeof node.props.onLayout === 'function',
  );
  if (target == null) {
    throw new Error(`Expected ${testID} to have an onLayout handler.`);
  }
  act(() => {
    target.props.onLayout({nativeEvent: {layout}});
  });
}

describe('VirtualizedList nested viewability with the flag disabled', () => {
  test('cross-orientation children keep reporting independently of the parent viewport', async () => {
    const outerData: Array<Item> = [{key: 'outer0'}, {key: 'outer1'}];
    const innerData: Array<Item> = [{key: 'inner0'}, {key: 'inner1'}];
    const offscreenOnViewable = jest.fn();

    await renderAsync(
      <VirtualizedList
        CellRendererComponent={NestedListTestCell}
        data={outerData}
        getItem={(items, index) => items[index]}
        getItemCount={items => items.length}
        initialNumToRender={2}
        renderItem={({item}) => (
          <VirtualizedList
            data={innerData}
            getItem={(items, index) => items[index]}
            getItemCount={items => items.length}
            getItemLayout={(_, index) => ({
              index,
              length: 100,
              offset: index * 100,
            })}
            horizontal={true}
            onViewableItemsChanged={
              item.key === 'outer1' ? offscreenOnViewable : undefined
            }
            renderItem={({item: innerItem}) => (
              <View testID={`${item.key}-${innerItem.key}`} />
            )}
            testID={`inner-${item.key}`}
            viewabilityConfig={{viewAreaCoveragePercentThreshold: 0}}
          />
        )}
        testID="outer-list"
      />,
    );

    await act(async () => {
      fireLayout('outer-list', {height: 100, width: 300, x: 0, y: 0});
      fireLayout('outer-cell-outer0', {height: 100, width: 300, x: 0, y: 0});
      fireLayout('outer-cell-outer1', {height: 100, width: 300, x: 0, y: 100});
      fireLayout('inner-outer1', {height: 100, width: 200, x: 0, y: 0});
      jest.runAllTimers();
    });

    expect(offscreenOnViewable).toHaveBeenLastCalledWith(
      expect.objectContaining({
        viewableItems: [
          expect.objectContaining({isViewable: true, key: 'inner0'}),
          expect.objectContaining({isViewable: true, key: 'inner1'}),
        ],
      }),
    );

    await unmountAsync();
  });
});
