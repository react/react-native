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
import {VirtualizedListContext} from '../VirtualizedListContext';
import * as React from 'react';
import {View} from 'react-native';
import {ReactNativeFeatureFlags} from 'react-native/react-private-interface';
import {act, create} from 'react-test-renderer';

ReactNativeFeatureFlags.override({
  fixCrossOrientationNestedListViewability: () => true,
});

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

async function rerenderAsync(element: React.MixedElement): Promise<void> {
  await act(async () => {
    getRenderer().update(element);
  });
}

async function unmountAsync(): Promise<void> {
  await act(async () => {
    getRenderer().unmount();
  });
  renderer = null;
}

function fireEvent(
  testID: string,
  eventName: string,
  ...args: ReadonlyArray<unknown>
): void {
  const handlerName = `on${eventName[0].toUpperCase()}${eventName.slice(1)}`;
  const [target] = getRenderer().root.findAll(
    node =>
      node.props != null &&
      node.props.testID === testID &&
      typeof node.props[handlerName] === 'function',
  );
  if (target == null) {
    throw new Error(`Expected ${testID} to have an ${handlerName} handler.`);
  }
  act(() => {
    target.props[handlerName](...args);
  });
}

component NestedListTestCell(...props: CellRendererProps<Item>) {
  const {cellKey, children, onLayout, style} = props;
  return (
    <View testID={`outer-cell-${cellKey}`} onLayout={onLayout} style={style}>
      {children}
    </View>
  );
}

function fireListLayout(
  testID: string,
  viewport: LayoutRectangle,
  content: {height: number, width: number},
): void {
  fireEvent(testID, 'layout', {nativeEvent: {layout: viewport}});
  fireEvent(testID, 'contentSizeChange', content.width, content.height);
}

function fireListScroll(
  testID: string,
  contentOffset: {x: number, y: number},
  viewport: LayoutRectangle,
  content: {height: number, width: number},
): void {
  fireEvent(testID, 'scroll', {
    nativeEvent: {
      contentOffset,
      contentSize: content,
      layoutMeasurement: viewport,
      zoomScale: 1,
    },
  });
}

describe('VirtualizedList nested viewability', () => {
  test('cross-orientation children follow parent row visibility transitions', async () => {
    const outerData: Array<Item> = [{key: 'outer0'}, {key: 'outer1'}];
    const innerData: Array<Item> = [{key: 'inner0'}, {key: 'inner1'}];
    const inner0OnViewable = jest.fn();
    const inner1OnViewable = jest.fn();
    const inner0Ref = React.createRef<VirtualizedList>();
    const inner1Ref = React.createRef<VirtualizedList>();

    await renderAsync(
      <VirtualizedList
        CellRendererComponent={NestedListTestCell}
        data={outerData}
        getItem={(items, index) => items[index]}
        getItemCount={items => items.length}
        initialNumToRender={2}
        renderItem={({item}) => (
          <VirtualizedList
            ref={item.key === 'outer0' ? inner0Ref : inner1Ref}
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
              item.key === 'outer0' ? inner0OnViewable : inner1OnViewable
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
      fireListLayout(
        'outer-list',
        {height: 100, width: 300, x: 0, y: 0},
        {height: 200, width: 300},
      );
      fireListLayout(
        'inner-outer0',
        {height: 100, width: 200, x: 0, y: 0},
        {height: 100, width: 200},
      );
      fireListLayout(
        'inner-outer1',
        {height: 100, width: 200, x: 0, y: 0},
        {height: 100, width: 200},
      );
      jest.runAllTimers();
    });

    expect(inner0OnViewable).not.toHaveBeenCalled();
    expect(inner1OnViewable).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent('outer-cell-outer0', 'layout', {
        nativeEvent: {
          layout: {height: 100, width: 300, x: 0, y: 0},
        },
      });
      fireEvent('outer-cell-outer1', 'layout', {
        nativeEvent: {
          layout: {height: 100, width: 300, x: 0, y: 100},
        },
      });
      jest.runAllTimers();
    });

    expect(inner0OnViewable).toHaveBeenLastCalledWith(
      expect.objectContaining({
        viewableItems: [
          expect.objectContaining({isViewable: true, key: 'inner0'}),
          expect.objectContaining({isViewable: true, key: 'inner1'}),
        ],
      }),
    );
    expect(inner1OnViewable).not.toHaveBeenCalled();

    await act(async () => {
      fireListScroll(
        'outer-list',
        {x: 0, y: 100},
        {height: 100, width: 300, x: 0, y: 0},
        {height: 200, width: 300},
      );
      jest.runAllTimers();
    });

    expect(inner0OnViewable).toHaveBeenLastCalledWith(
      expect.objectContaining({
        changed: expect.arrayContaining([
          expect.objectContaining({isViewable: false, key: 'inner0'}),
          expect.objectContaining({isViewable: false, key: 'inner1'}),
        ]),
        viewableItems: [],
      }),
    );
    expect(inner1OnViewable).toHaveBeenLastCalledWith(
      expect.objectContaining({
        viewableItems: [
          expect.objectContaining({isViewable: true, key: 'inner0'}),
          expect.objectContaining({isViewable: true, key: 'inner1'}),
        ],
      }),
    );

    const inner0 = inner0Ref.current;
    const inner1 = inner1Ref.current;
    if (inner0 == null || inner1 == null) {
      throw new Error('Expected both nested lists to be mounted.');
    }
    const inner0ViewportUpdate = jest.spyOn(inner0, '_onParentViewportChanged');
    const inner1ViewportUpdate = jest.spyOn(inner1, '_onParentViewportChanged');
    await act(async () => {
      fireListScroll(
        'outer-list',
        {x: 0, y: 110},
        {height: 100, width: 300, x: 0, y: 0},
        {height: 200, width: 300},
      );
      fireListScroll(
        'outer-list',
        {x: 0, y: 120},
        {height: 100, width: 300, x: 0, y: 0},
        {height: 200, width: 300},
      );
      jest.runAllTimers();
    });

    expect(inner0ViewportUpdate).not.toHaveBeenCalled();
    expect(inner1ViewportUpdate).not.toHaveBeenCalled();

    const childError = new Error('Expected child callback failure.');
    inner0ViewportUpdate.mockImplementationOnce(() => {
      throw childError;
    });
    expect(() =>
      fireListScroll(
        'outer-list',
        {x: 0, y: 0},
        {height: 100, width: 300, x: 0, y: 0},
        {height: 200, width: 300},
      ),
    ).toThrow(childError);
    expect(inner0ViewportUpdate).toHaveBeenCalledWith(false);
    expect(inner1ViewportUpdate).toHaveBeenCalledWith(true);

    fireListScroll(
      'outer-list',
      {x: 0, y: 0},
      {height: 100, width: 300, x: 0, y: 0},
      {height: 200, width: 300},
    );
    expect(inner0ViewportUpdate).toHaveBeenCalledTimes(2);
    expect(inner1ViewportUpdate).toHaveBeenCalledWith(true);
    fireListScroll(
      'outer-list',
      {x: 0, y: 100},
      {height: 100, width: 300, x: 0, y: 0},
      {height: 200, width: 300},
    );
    expect(inner0ViewportUpdate).toHaveBeenCalledTimes(3);
    expect(inner0ViewportUpdate).toHaveBeenLastCalledWith(true);
    expect(inner1ViewportUpdate).toHaveBeenCalledTimes(2);
    expect(inner1ViewportUpdate).toHaveBeenLastCalledWith(false);

    inner0ViewportUpdate.mockRestore();
    inner1ViewportUpdate.mockRestore();
    await unmountAsync();
  });

  test('uses current scroll metrics when clearing a pending scroll update', async () => {
    const innerOnViewable = jest.fn();
    await renderAsync(
      <VirtualizedList
        data={[{key: 'outer0'}, {key: 'outer1'}]}
        getItem={(items, index) => items[index]}
        getItemCount={items => items.length}
        getItemLayout={(_, index) => ({
          index,
          length: 100,
          offset: index * 100,
        })}
        initialNumToRender={2}
        initialScrollIndex={1}
        renderItem={({item}) => (
          <VirtualizedList
            data={[{key: 'inner'}]}
            getItem={(items, index) => items[index]}
            getItemCount={items => items.length}
            getItemLayout={(_, index) => ({index, length: 100, offset: 0})}
            horizontal={true}
            onViewableItemsChanged={
              item.key === 'outer1' ? innerOnViewable : undefined
            }
            renderItem={({item: innerItem}) => (
              <View testID={`${item.key}-${innerItem.key}`} />
            )}
            testID={`pending-inner-${item.key}`}
            viewabilityConfig={{viewAreaCoveragePercentThreshold: 0}}
          />
        )}
        testID="pending-outer-list"
      />,
    );

    fireListLayout(
      'pending-outer-list',
      {height: 100, width: 300, x: 0, y: 0},
      {height: 200, width: 300},
    );
    fireListLayout(
      'pending-inner-outer1',
      {height: 100, width: 100, x: 0, y: 0},
      {height: 100, width: 100},
    );
    expect(innerOnViewable).not.toHaveBeenCalled();

    fireListScroll(
      'pending-outer-list',
      {x: 0, y: 100},
      {height: 100, width: 300, x: 0, y: 0},
      {height: 200, width: 300},
    );

    expect(innerOnViewable).toHaveBeenLastCalledWith(
      expect.objectContaining({
        viewableItems: [
          expect.objectContaining({isViewable: true, key: 'inner'}),
        ],
      }),
    );
    await unmountAsync();
  });

  test('suppresses children while the parent has no cross-axis size', async () => {
    const innerOnViewable = jest.fn();
    await renderAsync(
      <VirtualizedList
        data={[{key: 'outer'}]}
        getItem={(items, index) => items[index]}
        getItemCount={items => items.length}
        getItemLayout={(_, index) => ({index, length: 100, offset: 0})}
        renderItem={() => (
          <VirtualizedList
            data={[{key: 'inner'}]}
            getItem={(items, index) => items[index]}
            getItemCount={items => items.length}
            getItemLayout={(_, index) => ({index, length: 100, offset: 0})}
            horizontal={true}
            onViewableItemsChanged={innerOnViewable}
            renderItem={({item}) => <View testID={item.key} />}
            testID="zero-width-inner-list"
            viewabilityConfig={{viewAreaCoveragePercentThreshold: 0}}
          />
        )}
        testID="zero-width-outer-list"
      />,
    );

    fireListLayout(
      'zero-width-outer-list',
      {height: 100, width: 0, x: 0, y: 0},
      {height: 100, width: 0},
    );
    fireListLayout(
      'zero-width-inner-list',
      {height: 100, width: 100, x: 0, y: 0},
      {height: 100, width: 100},
    );

    expect(innerOnViewable).not.toHaveBeenCalled();
    await unmountAsync();
  });

  test('does not suppress cross-orientation lists in structural cells', async () => {
    const innerOnViewable = jest.fn();
    await renderAsync(
      <VirtualizedList
        ListHeaderComponent={
          <VirtualizedList
            data={[{key: 'inner'}]}
            getItem={(items, index) => items[index]}
            getItemCount={items => items.length}
            getItemLayout={(_, index) => ({index, length: 100, offset: 0})}
            horizontal={true}
            onViewableItemsChanged={innerOnViewable}
            renderItem={({item}) => <View testID={item.key} />}
            testID="header-inner-list"
            viewabilityConfig={{viewAreaCoveragePercentThreshold: 0}}
          />
        }
        data={[]}
        getItem={(items, index) => items[index]}
        getItemCount={items => items.length}
        renderItem={() => null}
        testID="header-outer-list"
      />,
    );

    fireListLayout(
      'header-inner-list',
      {height: 100, width: 100, x: 0, y: 0},
      {height: 100, width: 100},
    );
    await act(async () => {
      jest.runAllTimers();
    });
    expect(innerOnViewable).toHaveBeenLastCalledWith(
      expect.objectContaining({
        viewableItems: [
          expect.objectContaining({isViewable: true, key: 'inner'}),
        ],
      }),
    );

    fireListLayout(
      'header-outer-list',
      {height: 100, width: 300, x: 0, y: 0},
      {height: 100, width: 300},
    );

    expect(innerOnViewable).toHaveBeenCalledTimes(1);
    await unmountAsync();
  });

  test('propagates ancestor suppression to same-orientation children', async () => {
    const parentRef = React.createRef<VirtualizedList>();
    const childRef = React.createRef<VirtualizedList>();
    await renderAsync(
      <VirtualizedList
        ref={parentRef}
        data={[{key: 'parent'}]}
        getItem={(items, index) => items[index]}
        getItemCount={items => items.length}
        horizontal={true}
        renderItem={() => (
          <VirtualizedList
            ref={childRef}
            data={[{key: 'child'}]}
            getItem={(items, index) => items[index]}
            getItemCount={items => items.length}
            horizontal={true}
            renderItem={({item}) => <View testID={item.key} />}
          />
        )}
      />,
    );
    const parent = parentRef.current;
    const child = childRef.current;
    if (parent == null || child == null) {
      throw new Error('Expected both nested lists to be mounted.');
    }
    const parentViewportUpdate = jest.spyOn(parent, '_onParentViewportChanged');
    const childViewportUpdate = jest.spyOn(child, '_onParentViewportChanged');
    const childShouldSuppress = jest.spyOn(
      child,
      '_shouldSuppressViewableItems',
    );

    await act(async () => {
      parentViewportUpdate(true);
    });

    expect(childViewportUpdate).toHaveBeenCalledWith(true);
    expect(childShouldSuppress.call(child)).toBe(true);

    childViewportUpdate.mockClear();
    const unregister = jest.spyOn(parent, '_unregisterAsNestedChild');
    const register = jest.spyOn(parent, '_registerAsNestedChild');
    unregister({ref: child});
    register({cellKey: 'parent', horizontal: true, ref: child});
    expect(childShouldSuppress.call(child)).toBe(true);

    await act(async () => {
      parentViewportUpdate(false);
    });

    expect(childShouldSuppress.call(child)).toBe(false);
    unregister.mockRestore();
    register.mockRestore();
    parentViewportUpdate.mockRestore();
    childViewportUpdate.mockRestore();
    childShouldSuppress.mockRestore();
    await unmountAsync();
  });

  test('immediately suppresses a child registered in an offscreen row', async () => {
    const parentRef = React.createRef<VirtualizedList>();
    const childRef = React.createRef<VirtualizedList>();
    await renderAsync(
      <>
        <VirtualizedList
          ref={parentRef}
          data={[{key: 'outer0'}, {key: 'outer1'}]}
          getItem={(items, index) => items[index]}
          getItemCount={items => items.length}
          getItemLayout={(_, index) => ({
            index,
            length: 100,
            offset: index * 100,
          })}
          initialNumToRender={2}
          renderItem={({item}) => <View testID={item.key} />}
          testID="registration-parent-list"
        />
        <VirtualizedList
          ref={childRef}
          data={[{key: 'child'}]}
          getItem={(items, index) => items[index]}
          getItemCount={items => items.length}
          horizontal={true}
          renderItem={({item}) => <View testID={item.key} />}
        />
      </>,
    );

    fireListLayout(
      'registration-parent-list',
      {height: 100, width: 300, x: 0, y: 0},
      {height: 200, width: 300},
    );
    fireListScroll(
      'registration-parent-list',
      {x: 0, y: 100},
      {height: 100, width: 300, x: 0, y: 0},
      {height: 200, width: 300},
    );

    const parent = parentRef.current;
    const child = childRef.current;
    if (parent == null || child == null) {
      throw new Error('Expected both lists to be mounted.');
    }
    const register = jest.spyOn(parent, '_registerAsNestedChild');
    const notify = jest.spyOn(parent, '_notifyCrossOrientationChildren');
    const childViewportUpdate = jest.spyOn(child, '_onParentViewportChanged');
    childViewportUpdate.mockImplementationOnce(() => {
      notify.call(parent);
    });

    register({cellKey: 'outer0', horizontal: true, ref: child});

    expect(childViewportUpdate).toHaveBeenCalledWith(true);
    expect(childViewportUpdate).toHaveBeenCalledTimes(1);
    register.mockRestore();
    notify.mockRestore();
    childViewportUpdate.mockRestore();
    await unmountAsync();
  });

  test('ancestor suppression propagates through nested cross-orientation lists', async () => {
    const grandchildOnViewable = jest.fn();
    await renderAsync(
      <VirtualizedList
        data={[{key: 'outer0'}, {key: 'outer1'}]}
        getItem={(items, index) => items[index]}
        getItemCount={items => items.length}
        getItemLayout={(_, index) => ({
          index,
          length: 100,
          offset: index * 100,
        })}
        initialNumToRender={2}
        renderItem={({item}) =>
          item.key === 'outer0' ? (
            <VirtualizedList
              data={[{key: 'middle'}]}
              getItem={(items, index) => items[index]}
              getItemCount={items => items.length}
              getItemLayout={(_, index) => ({
                index,
                length: 200,
                offset: index * 200,
              })}
              horizontal={true}
              renderItem={() => (
                <VirtualizedList
                  data={[{key: 'grandchild'}]}
                  getItem={(items, index) => items[index]}
                  getItemCount={items => items.length}
                  getItemLayout={(_, index) => ({
                    index,
                    length: 100,
                    offset: index * 100,
                  })}
                  onViewableItemsChanged={grandchildOnViewable}
                  renderItem={({item: grandchild}) => (
                    <View testID={grandchild.key} />
                  )}
                  testID="grandchild-list"
                  viewabilityConfig={{viewAreaCoveragePercentThreshold: 0}}
                />
              )}
              testID="middle-list"
            />
          ) : (
            <View />
          )
        }
        testID="deep-outer-list"
      />,
    );

    await act(async () => {
      fireListLayout(
        'deep-outer-list',
        {height: 100, width: 300, x: 0, y: 0},
        {height: 200, width: 300},
      );
      fireListLayout(
        'middle-list',
        {height: 100, width: 200, x: 0, y: 0},
        {height: 100, width: 200},
      );
      fireListLayout(
        'grandchild-list',
        {height: 100, width: 200, x: 0, y: 0},
        {height: 100, width: 200},
      );
      jest.runAllTimers();
    });

    expect(grandchildOnViewable).toHaveBeenLastCalledWith(
      expect.objectContaining({
        viewableItems: [
          expect.objectContaining({isViewable: true, key: 'grandchild'}),
        ],
      }),
    );

    await act(async () => {
      fireListScroll(
        'deep-outer-list',
        {x: 0, y: 100},
        {height: 100, width: 300, x: 0, y: 0},
        {height: 200, width: 300},
      );
      jest.runAllTimers();
    });

    expect(grandchildOnViewable).toHaveBeenLastCalledWith(
      expect.objectContaining({
        changed: [
          expect.objectContaining({isViewable: false, key: 'grandchild'}),
        ],
        viewableItems: [],
      }),
    );
    await unmountAsync();
  });

  test('orientation updates reconcile registration and unmount cleanup', async () => {
    const childRef = React.createRef<VirtualizedList>();
    const registerAsNestedChild = jest.fn();
    const unregisterAsNestedChild = jest.fn();
    const contextValue = {
      cellKey: 'parent-cell',
      getCellVisibilityByKey: () => true,
      getOutermostParentListRef: () => {
        const child = childRef.current;
        if (child == null) {
          throw new Error('Expected the child list to be mounted.');
        }
        return child;
      },
      getScrollMetrics: () => ({
        contentLength: 100,
        dOffset: 0,
        dt: 1,
        offset: 0,
        timestamp: 0,
        velocity: 0,
        visibleLength: 100,
        zoomScale: 1,
      }),
      horizontal: false,
      registerAsNestedChild,
      unregisterAsNestedChild,
    };
    const renderChild = (
      context: ?typeof contextValue,
      horizontal: boolean,
    ): React.MixedElement => (
      <VirtualizedListContext.Provider value={context}>
        <VirtualizedList
          ref={childRef}
          data={[{key: 'child'}]}
          getItem={(items, index) => items[index]}
          getItemCount={items => items.length}
          horizontal={horizontal}
          renderItem={({item}) => <View testID={item.key} />}
        />
      </VirtualizedListContext.Provider>
    );

    await renderAsync(renderChild(contextValue, true));
    const childInstance = childRef.current;
    if (childInstance == null) {
      throw new Error('Expected the child list to be mounted.');
    }

    expect(registerAsNestedChild).toHaveBeenCalledWith({
      cellKey: 'parent-cell',
      horizontal: true,
      ref: childInstance,
    });
    await rerenderAsync(renderChild(contextValue, false));
    expect(unregisterAsNestedChild).toHaveBeenCalledWith({
      ref: childInstance,
    });
    expect(registerAsNestedChild).toHaveBeenCalledWith({
      cellKey: 'parent-cell',
      horizontal: false,
      ref: childInstance,
    });

    const childViewportUpdate = jest.spyOn(
      childInstance,
      '_onParentViewportChanged',
    );
    const childShouldSuppress = jest.spyOn(
      childInstance,
      '_shouldSuppressViewableItems',
    );
    childViewportUpdate(true);
    expect(childShouldSuppress.call(childInstance)).toBe(true);

    await rerenderAsync(renderChild(null, false));

    expect(childViewportUpdate).toHaveBeenLastCalledWith(false);
    expect(childShouldSuppress.call(childInstance)).toBe(false);
    childViewportUpdate.mockRestore();
    childShouldSuppress.mockRestore();

    await unmountAsync();

    expect(unregisterAsNestedChild).toHaveBeenCalledWith({
      ref: childInstance,
    });
  });
});
