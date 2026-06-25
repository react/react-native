/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

import VirtualizedList from '../VirtualizedList';
import * as React from 'react';
import {createElement, createRef} from 'react';
import {act, create} from 'react-test-renderer';
import {format} from 'util';

jest.useFakeTimers();

const skipTestSilenceLinter = it.skip;

describe('VirtualizedList', () => {
  it('renders simple list', async () => {
    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          data={[{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]}
          renderItem={({item}) => <item value={item.key} />}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
        />,
      );
    });
    expect(component).toMatchSnapshot();
  });

  it('renders simple list using ListItemComponent', async () => {
    function ListItemComponent({item}) {
      return <item value={item.key} />;
    }
    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          data={[{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]}
          ListItemComponent={ListItemComponent}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
        />,
      );
    });
    expect(component).toMatchSnapshot();
  });

  it('warns if both renderItem or ListItemComponent are specified. Uses ListItemComponent', async () => {
    jest.spyOn(console, 'warn').mockImplementationOnce(() => {});
    function ListItemComponent({item}) {
      return <item value={item.key} testID={`${item.key}-ListItemComponent`} />;
    }
    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          data={[{key: 'i1'}]}
          ListItemComponent={ListItemComponent}
          renderItem={({item}) => (
            <item value={item.key} testID={`${item.key}-renderItem`} />
          )}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
        />,
      );
    });

    expect(console.warn).toBeCalledWith(
      'VirtualizedList: Both ListItemComponent and renderItem props are present. ListItemComponent will take precedence over renderItem.',
    );
    expect(component).toMatchSnapshot();
    console.warn.mockRestore();
  });

  it('throws if no renderItem or ListItemComponent', async () => {
    // Silence the React error boundary warning; we expect an uncaught error.
    const consoleError = console.error;
    jest.spyOn(console, 'error').mockImplementation((...args) => {
      const message = format(...args);
      if (message.includes('The above error occurred in the ')) {
        return;
      }
      consoleError(...args);
    });

    await expect(async () => {
      await act(() => {
        create(
          <VirtualizedList
            data={[{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]}
            getItem={(data, index) => data[index]}
            getItemCount={data => data.length}
          />,
        );
      });
    }).rejects.toThrow(
      'VirtualizedList: Either ListItemComponent or renderItem props are required but none were found.',
    );

    console.error.mockRestore();
  });

  it('renders empty list', async () => {
    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          data={[]}
          renderItem={({item}) => <item value={item.key} />}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
        />,
      );
    });
    expect(component).toMatchSnapshot();
  });

  it('renders empty list after batch', async () => {
    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          data={[]}
          renderItem={({item}) => <item value={item.key} />}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
        />,
      );
    });

    await act(() => {
      simulateLayout(component, {
        viewport: {width: 10, height: 50},
        content: {width: 10, height: 200},
      });

      performAllBatches();
    });

    expect(component).toMatchSnapshot();
  });

  it('renders null list', async () => {
    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          data={undefined}
          renderItem={({item}) => <item value={item.key} />}
          getItem={(data, index) => data[index]}
          getItemCount={data => 0}
        />,
      );
    });
    expect(component).toMatchSnapshot();
  });

  it('scrollToEnd works with null list', async () => {
    const listRef = createRef(null);
    await act(() => {
      create(
        <VirtualizedList
          data={undefined}
          renderItem={({item}) => <item value={item.key} />}
          getItem={(data, index) => data[index]}
          getItemCount={data => 0}
          ref={listRef}
        />,
      );
    });
    listRef.current.scrollToEnd();
  });

  it('renders empty list with empty component', async () => {
    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          data={[]}
          ListEmptyComponent={() => <empty />}
          ListFooterComponent={() => <footer />}
          ListHeaderComponent={() => <header />}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
          renderItem={({item}) => <item value={item.key} />}
        />,
      );
    });
    expect(component).toMatchSnapshot();
  });

  it('renders list with empty component', async () => {
    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          data={[{key: 'hello'}]}
          ListEmptyComponent={() => <empty />}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
          renderItem={({item}) => <item value={item.key} />}
        />,
      );
    });
    expect(component).toMatchSnapshot();
  });

  it('renders all the bells and whistles', async () => {
    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          ItemSeparatorComponent={() => <separator />}
          ListEmptyComponent={() => <empty />}
          ListFooterComponent={() => <footer />}
          ListHeaderComponent={() => <header />}
          data={new Array(5).fill().map((_, ii) => ({id: String(ii)}))}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
          getItemLayout={({index}) => ({length: 50, offset: index * 50})}
          inverted={true}
          keyExtractor={(item, index) => item.id}
          onRefresh={jest.fn()}
          refreshing={false}
          renderItem={({item}) => <item value={item.id} />}
        />,
      );
    });
    expect(component).toMatchSnapshot();
  });

  it('test getItem functionality where data is not an Array', async () => {
    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          data={new Map([['id_0', {key: 'item_0'}]])}
          getItem={(data, index) => data.get('id_' + index)}
          getItemCount={(data: Map) => data.size}
          renderItem={({item}) => <item value={item.key} />}
        />,
      );
    });
    expect(component).toMatchSnapshot();
  });

  it('handles separators correctly', async () => {
    const infos = [];
    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          ItemSeparatorComponent={props => <separator {...props} />}
          data={[{key: 'i0'}, {key: 'i1'}, {key: 'i2'}]}
          renderItem={info => {
            infos.push(info);
            return <item title={info.item.key} />;
          }}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
        />,
      );
    });
    expect(component).toMatchSnapshot();
    await act(() => {
      infos[1].separators.highlight();
    });
    expect(component).toMatchSnapshot();
    await act(() => {
      infos[2].separators.updateProps('leading', {press: true});
    });
    expect(component).toMatchSnapshot();
    await act(() => {
      infos[1].separators.unhighlight();
    });
  });

  it('handles nested lists', async () => {
    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          data={[{key: 'outer0'}, {key: 'outer1'}]}
          renderItem={outerInfo => (
            <VirtualizedList
              data={[
                {key: outerInfo.item.key + ':inner0'},
                {key: outerInfo.item.key + ':inner1'},
              ]}
              horizontal={outerInfo.item.key === 'outer1'}
              renderItem={innerInfo => {
                return <item title={innerInfo.item.key} />;
              }}
              getItem={(data, index) => data[index]}
              getItemCount={data => data.length}
            />
          )}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
        />,
      );
    });
    expect(component).toMatchSnapshot();
  });

  it('handles nested list in ListEmptyComponent', async () => {
    const ListEmptyComponent = (
      <VirtualizedList {...baseItemProps(generateItems(1))} />
    );

    let component;

    await act(() => {
      component = create(
        <VirtualizedList
          {...baseItemProps([])}
          ListEmptyComponent={ListEmptyComponent}
        />,
      );
    });

    await act(() => {
      component.update(
        <VirtualizedList
          {...baseItemProps(generateItems(5))}
          ListEmptyComponent={ListEmptyComponent}
        />,
      );
    });
  });

  it('empty component returns the original element if it is a React.Fragment', () => {
    const listRef = createRef();
    const fragment = (
      <React.Fragment>
        <div>Test</div>
      </React.Fragment>
    );

    act(() => {
      create(
        <VirtualizedList
          ref={listRef}
          data={[]}
          ListEmptyComponent={fragment}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
          renderItem={({item}) => <item value={item.key} />}
        />,
      );
    });

    const result = listRef.current._renderEmptyComponent(fragment, null);
    expect(result).toBe(fragment);
  });

  it('empty component clones the element and adds onLayout and style props if not a Fragment', () => {
    const listRef = createRef();
    const element = <div>Test</div>;
    const inversionStyle = {transform: [{scaleY: -1}]};

    act(() => {
      create(
        <VirtualizedList
          ref={listRef}
          data={[]}
          ListEmptyComponent={element}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
          renderItem={({item}) => <item value={item.key} />}
        />,
      );
    });

    const result = listRef.current._renderEmptyComponent(
      element,
      inversionStyle,
    );

    // The result should be a cloned element with additional props
    expect(result).not.toBe(element);
    expect(result.props).toEqual(
      expect.objectContaining({
        onLayout: expect.any(Function),
        style: inversionStyle,
      }),
    );
  });

  it('empty component preserves original onLayout handler if present', () => {
    const listRef = createRef();
    const originalOnLayout = jest.fn();
    const element = <div onLayout={originalOnLayout}>Test</div>;
    const inversionStyle = {transform: [{scaleY: -1}]};

    act(() => {
      create(
        <VirtualizedList
          ref={listRef}
          data={[]}
          ListEmptyComponent={element}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
          renderItem={({item}) => <item value={item.key} />}
        />,
      );
    });

    const result = listRef.current._renderEmptyComponent(
      element,
      inversionStyle,
    );

    // Call the onLayout handler
    result.props.onLayout({nativeEvent: {layout: {width: 100, height: 100}}});

    // Both the original and the new onLayout should be called
    expect(originalOnLayout).toHaveBeenCalled();
  });

  it('returns the viewableItems correctly in the onViewableItemsChanged callback after changing the data', async () => {
    const ITEM_HEIGHT = 800;
    let data = [{key: 'i1'}, {key: 'i2'}, {key: 'i3'}];
    const nativeEvent = {
      contentOffset: {y: 0, x: 0},
      layoutMeasurement: {width: 300, height: 600},
      contentSize: {width: 300, height: data.length * ITEM_HEIGHT},
      zoomScale: 1,
      contentInset: {right: 0, top: 0, left: 0, bottom: 0},
    };
    const onViewableItemsChanged = jest.fn();
    const props = {
      data,
      renderItem: ({item}) => <item value={item.key} />,
      getItem: (items, index) => items[index],
      getItemCount: items => items.length,
      getItemLayout: (items, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      }),
      onViewableItemsChanged,
    };

    let component;
    await act(() => {
      component = create(<VirtualizedList {...props} />);
    });

    const instance = component.getInstance();

    instance._onScrollBeginDrag({nativeEvent});
    instance._onScroll({
      timeStamp: 1000,
      nativeEvent,
    });

    expect(onViewableItemsChanged).toHaveBeenCalledTimes(1);
    expect(onViewableItemsChanged).toHaveBeenLastCalledWith(
      expect.objectContaining({
        viewableItems: [expect.objectContaining({isViewable: true, key: 'i1'})],
      }),
    );
    data = [{key: 'i4'}, ...data];

    await act(() => {
      component.update(<VirtualizedList {...props} data={data} />);
    });

    await act(() => {
      instance._onScroll({
        timeStamp: 2000,
        nativeEvent: {
          ...nativeEvent,
          contentOffset: {y: 100, x: 0},
        },
      });
    });

    expect(onViewableItemsChanged).toHaveBeenCalledTimes(2);
    expect(onViewableItemsChanged).toHaveBeenLastCalledWith(
      expect.objectContaining({
        viewableItems: [expect.objectContaining({isViewable: true, key: 'i4'})],
      }),
    );
  });

  it('getScrollRef for case where it returns a ScrollView', async () => {
    const listRef = createRef(null);

    await act(() => {
      create(
        <VirtualizedList
          data={[{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]}
          renderItem={({item}) => <item value={item.key} />}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
          ref={listRef}
        />,
      );
    });

    const scrollRef = listRef.current.getScrollRef();

    // This is checking if the ref acts like a ScrollView. If we had an
    // `isScrollView(ref)` method, that would be preferred.
    expect(scrollRef.scrollTo).toBeInstanceOf(jest.fn().constructor);
  });

  it('getScrollRef for case where it returns a View', async () => {
    const listRef = createRef(null);

    await act(() => {
      create(
        <VirtualizedList
          data={[{key: 'outer0'}, {key: 'outer1'}]}
          renderItem={outerInfo => (
            <VirtualizedList
              data={[
                {key: outerInfo.item.key + ':inner0'},
                {key: outerInfo.item.key + ':inner1'},
              ]}
              renderItem={innerInfo => {
                return <item title={innerInfo.item.key} />;
              }}
              getItem={(data, index) => data[index]}
              getItemCount={data => data.length}
              ref={listRef}
            />
          )}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
        />,
      );
    });
    const scrollRef = listRef.current.getScrollRef();

    // This is checking if the ref acts like a host component. If we had an
    // `isHostComponent(ref)` method, that would be preferred.
    expect(scrollRef.measure).toBeInstanceOf(jest.fn().constructor);
    expect(scrollRef.measureLayout).toBeInstanceOf(jest.fn().constructor);
    expect(scrollRef.measureInWindow).toBeInstanceOf(jest.fn().constructor);
  });

  // TODO: Revisit this test case after upgrading to React 19.
  skipTestSilenceLinter(
    'calls onStartReached when near the start',
    async () => {
      const ITEM_HEIGHT = 40;
      const layout = {width: 300, height: 600};
      let data = Array(40)
        .fill()
        .map((_, index) => ({key: `key-${index}`}));
      const onStartReached = jest.fn();
      const props = {
        data,
        initialNumToRender: 10,
        onStartReachedThreshold: 1,
        windowSize: 10,
        renderItem: ({item}) => <item value={item.key} />,
        getItem: (items, index) => items[index],
        getItemCount: items => items.length,
        getItemLayout: (items, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        }),
        onStartReached,
        initialScrollIndex: data.length - 1,
      };
      let component;
      await act(() => {
        component = create(<VirtualizedList {...props} />);
      });

      const instance = component.getInstance();

      await act(async () => {
        instance._onLayout({nativeEvent: {layout, zoomScale: 1}});
        instance._onContentSizeChange(300, data.length * ITEM_HEIGHT);

        // Make sure onStartReached is not called initially when initialScrollIndex is set.
        await jest.runAllTimersAsync();
      });
      expect(onStartReached).not.toHaveBeenCalled();

      await act(async () => {
        // Scroll for a small amount and make sure onStartReached is not called.
        instance._onScroll({
          timeStamp: 1000,
          nativeEvent: {
            contentOffset: {y: (data.length - 2) * ITEM_HEIGHT, x: 0},
            layoutMeasurement: layout,
            contentSize: {...layout, height: data.length * ITEM_HEIGHT},
            zoomScale: 1,
            contentInset: {right: 0, top: 0, left: 0, bottom: 0},
          },
        });
        await jest.runAllTimersAsync();
      });
      expect(onStartReached).not.toHaveBeenCalled();

      await act(async () => {
        // Scroll to start and make sure onStartReached is called.
        instance._onScroll({
          timeStamp: 1000,
          nativeEvent: {
            contentOffset: {y: 0, x: 0},
            layoutMeasurement: layout,
            contentSize: {...layout, height: data.length * ITEM_HEIGHT},
            zoomScale: 1,
            contentInset: {right: 0, top: 0, left: 0, bottom: 0},
          },
        });
        await jest.runAllTimersAsync();
      });
      expect(onStartReached).toHaveBeenCalled();
    },
  );

  it('calls onStartReached initially', async () => {
    const ITEM_HEIGHT = 40;
    const layout = {width: 300, height: 600};
    let data = Array(40)
      .fill()
      .map((_, index) => ({key: `key-${index}`}));
    const onStartReached = jest.fn();
    const props = {
      data,
      initialNumToRender: 10,
      onStartReachedThreshold: 1,
      windowSize: 10,
      renderItem: ({item}) => <item value={item.key} />,
      getItem: (items, index) => items[index],
      getItemCount: items => items.length,
      getItemLayout: (items, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      }),
      onStartReached,
    };

    let component;
    await act(() => {
      component = create(<VirtualizedList {...props} />);
    });

    const instance = component.getInstance();

    await act(() => {
      instance._onLayout({nativeEvent: {layout, zoomScale: 1}});
      instance._onContentSizeChange(300, data.length * ITEM_HEIGHT);

      performAllBatches();
    });

    expect(onStartReached).toHaveBeenCalled();
  });

  it('calls onEndReached when near the end', async () => {
    const ITEM_HEIGHT = 40;
    const layout = {width: 300, height: 600};
    let data = Array(40)
      .fill()
      .map((_, index) => ({key: `key-${index}`}));
    const onEndReached = jest.fn();
    const props = {
      data,
      initialNumToRender: 10,
      onEndReachedThreshold: 1,
      windowSize: 10,
      renderItem: ({item}) => <item value={item.key} />,
      getItem: (items, index) => items[index],
      getItemCount: items => items.length,
      getItemLayout: (items, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      }),
      onEndReached,
    };

    let component;
    await act(() => {
      component = create(<VirtualizedList {...props} />);
    });
    const instance = component.getInstance();

    await act(() => {
      instance._onLayout({nativeEvent: {layout, zoomScale: 1}});
      instance._onContentSizeChange(300, data.length * ITEM_HEIGHT);

      // Make sure onEndReached is not called initially.
      performAllBatches();
    });
    expect(onEndReached).not.toHaveBeenCalled();

    await act(() => {
      // Scroll for a small amount and make sure onEndReached is not called.
      instance._onScroll({
        timeStamp: 1000,
        nativeEvent: {
          contentOffset: {y: ITEM_HEIGHT, x: 0},
          layoutMeasurement: layout,
          contentSize: {...layout, height: data.length * ITEM_HEIGHT},
          zoomScale: 1,
          contentInset: {right: 0, top: 0, left: 0, bottom: 0},
        },
      });
      performAllBatches();
    });
    expect(onEndReached).not.toHaveBeenCalled();

    await act(() => {
      // Scroll to end and make sure onEndReached is called.
      instance._onScroll({
        timeStamp: 1000,
        nativeEvent: {
          contentOffset: {y: data.length * ITEM_HEIGHT, x: 0},
          layoutMeasurement: layout,
          contentSize: {...layout, height: data.length * ITEM_HEIGHT},
          zoomScale: 1,
          contentInset: {right: 0, top: 0, left: 0, bottom: 0},
        },
      });
      performAllBatches();
    });
    expect(onEndReached).toHaveBeenCalled();
  });

  it('does not call onEndReached when onContentSizeChange happens after onLayout', async () => {
    const ITEM_HEIGHT = 40;
    const layout = {width: 300, height: 600};
    let data = Array(20)
      .fill()
      .map((_, index) => ({key: `key-${index}`}));
    const onEndReached = jest.fn();
    const props = {
      data,
      initialNumToRender: 10,
      onEndReachedThreshold: 2,
      windowSize: 21,
      renderItem: ({item}) => <item value={item.key} />,
      getItem: (items, index) => items[index],
      getItemCount: items => items.length,
      onEndReached,
    };

    let component;
    await act(() => {
      component = create(<VirtualizedList {...props} />);
    });

    const instance = component.getInstance();

    await act(() => {
      instance._onLayout({nativeEvent: {layout, zoomScale: 1}});
    });
    const initialContentHeight = props.initialNumToRender * ITEM_HEIGHT;

    await act(() => {
      // We want to test the unusual case of onContentSizeChange firing after
      // onLayout, which can cause https://github.com/facebook/react-native/issues/16067
      instance._onContentSizeChange(300, initialContentHeight);
      instance._onContentSizeChange(300, data.length * ITEM_HEIGHT);
      performAllBatches();
    });

    expect(onEndReached).not.toHaveBeenCalled();

    await act(() => {
      for (let i = 0; i < 20; ++i) {
        simulateCellLayout(component, data, i, {
          width: 10,
          height: ITEM_HEIGHT,
          x: 0,
          y: i * ITEM_HEIGHT,
        });
      }

      instance._onScroll({
        timeStamp: 1000,
        nativeEvent: {
          contentOffset: {y: initialContentHeight, x: 0},
          layoutMeasurement: layout,
          contentSize: {...layout, height: data.length * ITEM_HEIGHT},
          zoomScale: 1,
          contentInset: {right: 0, top: 0, left: 0, bottom: 0},
        },
      });
      performAllBatches();
    });

    expect(onEndReached).toHaveBeenCalled();
  });

  it('throws if using scrollToIndex with index less than 0', async () => {
    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          data={[{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]}
          renderItem={({item}) => <item value={item.key} />}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
        />,
      );
    });
    const instance = component.getInstance();

    expect(() => instance.scrollToIndex({index: -1})).toThrow(
      'scrollToIndex out of range: requested index -1 but minimum is 0',
    );
  });

  it('throws if using scrollToIndex when item length is less than 1', async () => {
    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          data={[]}
          renderItem={({item}) => <item value={item.key} />}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
        />,
      );
    });
    const instance = component.getInstance();

    expect(() => instance.scrollToIndex({index: 1})).toThrow(
      'scrollToIndex out of range: item length 0 but minimum is 1',
    );
  });

  it('throws if using scrollToIndex when requested index is bigger than or equal to item length', async () => {
    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          data={[{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]}
          renderItem={({item}) => <item value={item.key} />}
          getItem={(data, index) => data[index]}
          getItemCount={data => data.length}
        />,
      );
    });
    const instance = component.getInstance();

    expect(() => instance.scrollToIndex({index: 3})).toThrow(
      'scrollToIndex out of range: requested index 3 is out of 0 to 2',
    );
  });

  it('forwards correct stickyHeaderIndices when all in initial render window', async () => {
    const items = generateItemsStickyEveryN(10, 3);
    const ITEM_HEIGHT = 10;

    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          initialNumToRender={10}
          {...baseItemProps(items)}
          {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
        />,
      );
    });
    // The initial render is specified to be the length of items provided.
    // Expect that all sticky items (1 every 3) are passed to the underlying
    // scrollview.
    expect(component).toMatchSnapshot();
  });

  it('forwards correct stickyHeaderIndices when ListHeaderComponent present', async () => {
    const items = generateItemsStickyEveryN(10, 3);
    const ITEM_HEIGHT = 10;

    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          ListHeaderComponent={() => createElement('Header')}
          initialNumToRender={10}
          {...baseItemProps(items)}
          {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
        />,
      );
    });
    // The initial render is specified to be the length of items provided.
    // Expect that all sticky items (1 every 3) are passed to the underlying
    // scrollview, indices offset by 1 to account for the header component.
    expect(component).toMatchSnapshot();
  });

  it('forwards correct stickyHeaderIndices when partially in initial render window', async () => {
    const items = generateItemsStickyEveryN(10, 3);

    const ITEM_HEIGHT = 10;

    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          initialNumToRender={5}
          {...baseItemProps(items)}
          {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
        />,
      );
    });
    // The initial render is specified to be half the length of items provided.
    // Expect that all sticky items of index < 5 are passed to the underlying
    // scrollview.
    expect(component).toMatchSnapshot();
  });

  it('renders sticky headers in viewport on batched render', async () => {
    const items = generateItemsStickyEveryN(10, 3);
    const ITEM_HEIGHT = 10;

    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          initialNumToRender={1}
          windowSize={1}
          {...baseItemProps(items)}
          {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
        />,
      );
    });

    await act(() => {
      simulateLayout(component, {
        viewport: {width: 10, height: 50},
        content: {width: 10, height: 100},
      });
      performAllBatches();
    });

    // A windowSize of 1 means we will render just the viewport height (50dip).
    // Expect 5 10dip items to eventually be rendered, with sticky headers in
    // the first 5 propagated.
    expect(component).toMatchSnapshot();
  });

  it('keeps sticky headers above viewport visualized', async () => {
    const items = generateItemsStickyEveryN(20, 3);
    const ITEM_HEIGHT = 10;

    let component;
    await act(() => {
      component = create(
        <VirtualizedList
          initialNumToRender={1}
          windowSize={1}
          {...baseItemProps(items)}
          {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
        />,
      );
    });

    await act(() => {
      simulateLayout(component, {
        viewport: {width: 10, height: 50},
        content: {width: 10, height: 200},
      });
      performAllBatches();
    });

    await act(() => {
      simulateScroll(component, {x: 0, y: 150});
      performAllBatches();
    });

    // Scroll to the bottom 50 dip (last five items) of the content. Expect the
    // last five items to be rendered (possibly more if realization window is
    // larger), along with the most recent sticky header above the realization
    // region, even though they are out of the viewport window in layout
    // coordinates. This is because they will remain rendered even once
    // scrolled-past in layout space.
    expect(component).toMatchSnapshot();
  });

  it('does not add a sticky header to the render mask when no sticky headers are configured', () => {
    const expectedRegions = [
      {first: 0, last: 9, isSpacer: true},
      {first: 10, last: 12, isSpacer: false},
      {first: 13, last: 19, isSpacer: true},
    ];

    expect(createRenderMaskForStickyHeaderTest().enumerateRegions()).toEqual(
      expectedRegions,
    );
    expect(
      createRenderMaskForStickyHeaderTest({
        stickyHeaderIndices: [],
      }).enumerateRegions(),
    ).toEqual(expectedRegions);
  });

  it('adds the closest sticky header above the viewport from unsorted stickyHeaderIndices', () => {
    expect(
      createRenderMaskForStickyHeaderTest({
        stickyHeaderIndices: [12, 0, 8.5, 7, 7, -1],
      }).enumerateRegions(),
    ).toEqual([
      {first: 0, last: 6, isSpacer: true},
      {first: 7, last: 7, isSpacer: false},
      {first: 8, last: 9, isSpacer: true},
      {first: 10, last: 12, isSpacer: false},
      {first: 13, last: 19, isSpacer: true},
    ]);
  });

  it('accounts for ListHeaderComponent offset when adding the closest sticky header', () => {
    expect(
      createRenderMaskForStickyHeaderTest({
        ListHeaderComponent: () => createElement('Header'),
        stickyHeaderIndices: [3],
      }).enumerateRegions(),
    ).toEqual([
      {first: 0, last: 1, isSpacer: true},
      {first: 2, last: 2, isSpacer: false},
      {first: 3, last: 9, isSpacer: true},
      {first: 10, last: 12, isSpacer: false},
      {first: 13, last: 19, isSpacer: true},
    ]);
  });
});

it('unmounts sticky headers moved below viewport', async () => {
  const items = generateItemsStickyEveryN(20, 3);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={1}
        windowSize={1}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 200},
    });
    performAllBatches();
  });

  await act(() => {
    simulateScroll(component, {x: 0, y: 150});
    performAllBatches();
  });

  await act(() => {
    simulateScroll(component, {x: 0, y: 0});
    performAllBatches();
  });

  // Scroll to the bottom 50 dip (last five items) of the content, then back up
  // to the first 5. Ensure that sticky items are unmounted once they are below
  // the render area.
  expect(component).toMatchSnapshot();
});

it('gracefully handles negative initialScrollIndex', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  const mockWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialScrollIndex={-1}
        initialNumToRender={4}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  expect(mockWarn).toHaveBeenCalledTimes(1);

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 100},
    });
    performAllBatches();
  });

  expect(component).toMatchSnapshot();
  expect(mockWarn).toHaveBeenCalledTimes(1);
  mockWarn.mockRestore();
});

it('gracefully handles too large initialScrollIndex', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  const listRef = createRef();

  const mockWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        ref={listRef}
        initialScrollIndex={15}
        initialNumToRender={4}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  expect(mockWarn).toHaveBeenCalledTimes(1);
  listRef.current.scrollToEnd = jest.fn();

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 100},
    });
    performAllBatches();
  });

  expect(mockWarn).toHaveBeenCalledTimes(1);
  mockWarn.mockRestore();

  expect(listRef.current.scrollToEnd).toHaveBeenLastCalledWith({
    animated: false,
  });
});

it('renders offset cells in initial render when initialScrollIndex set', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialScrollIndex={4}
        initialNumToRender={4}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  // Check that the first render respects initialScrollIndex
  expect(component).toMatchSnapshot();
});

it('scrolls after content sizing with integer initialScrollIndex', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  const listRef = createRef(null);

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialScrollIndex={1}
        initialNumToRender={4}
        ref={listRef}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  const {scrollTo} = listRef.current.getScrollRef();

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 200},
    });
    performAllBatches();
  });

  expect(scrollTo).toHaveBeenLastCalledWith({y: 10, animated: false});
});

it('scrolls after content sizing with near-zero initialScrollIndex', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  const listRef = createRef(null);

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialScrollIndex={0.0001}
        initialNumToRender={4}
        ref={listRef}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  const {scrollTo} = listRef.current.getScrollRef();

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 200},
    });
    performAllBatches();
  });

  expect(scrollTo).toHaveBeenLastCalledWith({y: 0.001, animated: false});
});

it('scrolls after content sizing with near-end initialScrollIndex', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  const listRef = createRef(null);

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialScrollIndex={9.9999}
        initialNumToRender={4}
        ref={listRef}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  const {scrollTo} = listRef.current.getScrollRef();

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 200},
    });
    performAllBatches();
  });

  expect(scrollTo).toHaveBeenLastCalledWith({y: 99.999, animated: false});
});

it('scrolls after content sizing with fractional initialScrollIndex (getItemLayout())', async () => {
  const items = generateItems(10);
  const itemHeights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const getItemLayout = (_, index) => ({
    length: itemHeights[index],
    offset: itemHeights.slice(0, index).reduce((a, b) => a + b, 0),
    index,
  });

  const listRef = createRef(null);

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialScrollIndex={1.5}
        initialNumToRender={4}
        ref={listRef}
        getItemLayout={getItemLayout}
        {...baseItemProps(items)}
      />,
    );
  });

  const {scrollTo} = listRef.current.getScrollRef();

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 200},
    });
    performAllBatches();
  });

  expect(scrollTo).toHaveBeenLastCalledWith({y: 2.0, animated: false});
});

it('scrolls after content sizing with fractional initialScrollIndex (cached layout)', async () => {
  const items = generateItems(10);
  const listRef = createRef(null);

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialScrollIndex={1.5}
        initialNumToRender={4}
        ref={listRef}
        {...baseItemProps(items)}
      />,
    );
  });

  const {scrollTo} = listRef.current.getScrollRef();

  await act(() => {
    let y = 0;
    for (let i = 0; i < 10; ++i) {
      const height = i + 1;
      simulateCellLayout(component, items, i, {
        width: 10,
        height,
        x: 0,
        y,
      });
      y += height;
    }

    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 200},
    });
    performAllBatches();
  });

  expect(scrollTo).toHaveBeenLastCalledWith({y: 2.0, animated: false});
});

it('scrolls after content sizing with fractional initialScrollIndex (layout estimation)', async () => {
  const items = generateItems(10);
  const listRef = createRef(null);

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialScrollIndex={1.5}
        initialNumToRender={4}
        ref={listRef}
        {...baseItemProps(items)}
      />,
    );
  });

  const {scrollTo} = listRef.current.getScrollRef();

  await act(() => {
    let y = 0;
    for (let i = 5; i < 10; ++i) {
      const height = i + 1;
      simulateCellLayout(component, items, i, {
        width: 10,
        height,
        x: 0,
        y,
      });
      y += height;
    }

    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 200},
    });
    performAllBatches();
  });

  expect(scrollTo).toHaveBeenLastCalledWith({y: 12, animated: false});
});

it('initially renders nothing when initialNumToRender is 0', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={0}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  // Only a spacer should be present (a single item is present in the legacy
  // implementation)
  expect(component).toMatchSnapshot();
});

it('does not over-render when there is less than initialNumToRender cells', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialScrollIndex={4}
        initialNumToRender={20}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  // Check that the first render clamps to the last item when initialNumToRender
  // goes over it.
  expect(component).toMatchSnapshot();
});

it('retains initial render if initialScrollIndex == 0', async () => {
  const items = generateItems(20);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={5}
        initialScrollIndex={0}
        windowSize={1}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 200},
    });
    performAllBatches();
  });

  await act(() => {
    simulateScroll(component, {x: 0, y: 150});
    performAllBatches();
  });

  // If initialScrollIndex is 0 (the default), we should never unmount the top
  // initialNumToRender as part of the "scroll to top optimization", even after
  // scrolling to the bottom five items.
  expect(component).toMatchSnapshot();
});

it('discards initial render if initialScrollIndex != 0', async () => {
  const items = generateItems(20);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialScrollIndex={5}
        initialNumToRender={5}
        windowSize={1}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 200},
    });
    performAllBatches();
  });

  await act(() => {
    simulateScroll(component, {x: 0, y: 150});
    performAllBatches();
  });

  // If initialScrollIndex is not 0, we do not enable retaining initial render
  // as part of "scroll to top" optimization.
  expect(component).toMatchSnapshot();
});

it('expands render area by maxToRenderPerBatch on tick', async () => {
  const items = generateItems(20);
  const ITEM_HEIGHT = 10;

  const props = {
    initialNumToRender: 5,
    maxToRenderPerBatch: 2,
  };

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
        {...props}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 200},
    });
    performNextBatch();
  });

  // We start by rendering 5 items in the initial render, but have default
  // windowSize, enabling eventual rendering up to 20 viewports worth of
  // content. We limit this to rendering 2 items per-batch via
  // maxToRenderPerBatch, so we should only have 7 items rendered after the
  // initial timer tick.
  expect(component).toMatchSnapshot();
});

it('does not adjust render area until content area layed out', async () => {
  const items = generateItems(20);
  const ITEM_HEIGHT = 10;

  let component;

  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={5}
        windowSize={10}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateViewportLayout(component, {width: 10, height: 50});
    performAllBatches();
  });

  // We should not start layout-based logic to expand rendered area until
  // content is layed out. Expect only the 5 initial items to be rendered after
  // processing all batch work, even though the windowSize allows for more.
  expect(component).toMatchSnapshot();
});

it('does not move render area when initialScrollIndex is > 0 and offset not yet known', async () => {
  const items = generateItems(20);
  const ITEM_HEIGHT = 10;

  let component;

  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={5}
        initialScrollIndex={1}
        windowSize={10}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 100},
    });
    performAllBatches();
  });

  // 5 cells should be present starting at index 1, since we have not seen a
  // scroll event yet for current position.
  expect(component).toMatchSnapshot();
});

it('clamps render area when items removed for initialScrollIndex > 0 and scroller position not yet known', async () => {
  const items = generateItems(20);
  const lessItems = generateItems(15);
  const ITEM_HEIGHT = 10;

  let component;

  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={5}
        initialScrollIndex={14}
        windowSize={10}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    component.update(
      <VirtualizedList
        initialNumToRender={5}
        initialScrollIndex={14}
        windowSize={10}
        {...baseItemProps(lessItems)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 100},
    });
    performAllBatches();
  });

  // The initial render range should be adjusted to not overflow the list
  expect(component).toMatchSnapshot();
});

it('adjusts render area with non-zero initialScrollIndex', async () => {
  const items = generateItems(20);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={5}
        initialScrollIndex={1}
        windowSize={10}
        maxToRenderPerBatch={10}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 200},
    });
    simulateScroll(component, {x: 0, y: 10}); // simulate scroll offset for initialScrollIndex
  });

  await advanceUntilRenderAreaChanged(component);

  // We should expand the render area after receiving a message indicating we
  // arrived at initialScrollIndex.
  expect(component).toMatchSnapshot();
});

it('renders new items when data is updated with non-zero initialScrollIndex', async () => {
  const items = generateItems(2);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={5}
        initialScrollIndex={1}
        windowSize={10}
        maxToRenderPerBatch={10}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 20},
      content: {width: 10, height: 20},
    });
    performAllBatches();
  });

  const newItems = generateItems(4);

  await act(() => {
    component.update(
      <VirtualizedList
        initialNumToRender={5}
        initialScrollIndex={1}
        windowSize={10}
        maxToRenderPerBatch={10}
        {...baseItemProps(newItems)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    performAllBatches();
  });

  // We expect all the items to be rendered
  expect(component).toMatchSnapshot();
});

it('renders initialNumToRender cells when virtualization disabled', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={5}
        initialScrollIndex={1}
        disableVirtualization
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });
  // We should render initialNumToRender items with no spacers on initial render
  // when virtualization is disabled
  expect(component).toMatchSnapshot();
});

it('renders no spacers up to initialScrollIndex on first render when virtualization disabled', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={2}
        initialScrollIndex={4}
        maxToRenderPerBatch={1}
        disableVirtualization
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  // There should be no spacers present in an offset initial render with
  // virtualization disabled. Only initialNumToRender items starting at
  // initialScrollIndex.
  expect(component).toMatchSnapshot();
});

it('expands first in viewport to render up to maxToRenderPerBatch on initial render', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={2}
        initialScrollIndex={4}
        maxToRenderPerBatch={10}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  // When virtualization is disabled we may render items before initialItemIndex
  // if initialItemIndex + initialNumToRender < maxToRenderPerBatch. Expect cells
  // 0-3 to be rendered in this example, even though initialScrollIndex is 4.
  expect(component).toMatchSnapshot();
});

it('renders items before initialScrollIndex on first batch tick when virtualization disabled', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={1}
        initialScrollIndex={5}
        maxToRenderPerBatch={1}
        disableVirtualization
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 100},
    });
    performNextBatch();
  });

  // When virtualization is disabled, we render "maxToRenderPerBatch" items
  // sequentially per batch tick. Any items not yet rendered before
  // initialScrollIndex are currently rendered at this time. Expect the first
  // tick to render all items before initialScrollIndex, along with
  // maxToRenderPerBatch after.
  expect(component).toMatchSnapshot();
});

it('eventually renders all items when virtualization disabled', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={5}
        initialScrollIndex={1}
        windowSize={1}
        maxToRenderPerBatch={10}
        disableVirtualization
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 100},
    });
    performAllBatches();
  });

  // After all batch ticks, all items should eventually be rendered when\
  // virtualization is disabled.
  expect(component).toMatchSnapshot();
});

it('retains initial render region when an item is appended', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={3}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    component.update(
      <VirtualizedList
        initialNumToRender={3}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
        data={generateItems(11)}
      />,
    );
  });

  // Adding an item to the list before batch render should keep the existing
  // rendered items rendered. Expect the first 3 items rendered, and a spacer
  // for 8 items (including the 11th, added item).
  expect(component).toMatchSnapshot();
});

it('retains batch render region when an item is appended', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 100},
    });
  });

  await advanceUntilLastCellIndexRendered(component, items.length - 1);

  await act(() => {
    component.update(
      <VirtualizedList
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
        data={generateItems(11)}
      />,
    );
  });

  // Adding an item to the list after batch render should keep the existing
  // rendered items rendered. We batch render 10 items, then add an 11th. Expect
  // the first ten items to be present, with a spacer for the 11th until the
  // next batch render.
  expect(component).toMatchSnapshot();
});

it('constrains batch render region when an item is removed', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 100},
    });
    performAllBatches();
  });

  await act(() => {
    component.update(
      <VirtualizedList
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
        data={generateItems(5)}
      />,
    );
  });

  // If the number of items is reduced, we should remove the corresponding
  // already rendered items. Expect there to be 5 items present. New items in a
  // previously occupied index may also be immediately rendered.
  expect(component).toMatchSnapshot();
});

it('renders a zero-height tail spacer on initial render if getItemLayout not defined', async () => {
  const items = generateItems(10);

  let component;
  await act(() => {
    component = create(
      <VirtualizedList initialNumToRender={3} {...baseItemProps(items)} />,
    );
  });

  // Do not add space for out-of-viewport content on initial render when we do
  // not yet know how large it should be (no getItemLayout and cell onLayout not
  // yet called). Expect the tail spacer not to occupy space.
  expect(component).toMatchSnapshot();
});

it('renders zero-height tail spacer on batch render if cells not yet measured and getItemLayout not defined', async () => {
  const items = generateItems(10);

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={3}
        maxToRenderPerBatch={1}
        windowSize={1}
        {...baseItemProps(items)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 200},
    });
    performNextBatch();
  });

  // Do not add space for out-of-viewport content unless the cell has previously
  // been layed out and measurements cached. Expect the tail spacer not to
  // occupy space.
  expect(component).toMatchSnapshot();
});

it('renders tail spacer up to last measured index if getItemLayout not defined', async () => {
  const items = generateItems(10);

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={3}
        maxToRenderPerBatch={1}
        windowSize={1}
        {...baseItemProps(items)}
      />,
    );
  });

  await act(() => {
    const LAST_MEASURED_CELL = 6;
    for (let i = 0; i <= LAST_MEASURED_CELL; ++i) {
      simulateCellLayout(component, items, i, {
        width: 10,
        height: 10,
        x: 0,
        y: 10 * i,
      });
    }

    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 30},
    });
    performNextBatch();
  });

  // If cells in the out-of-viewport area have been measured, their space can be
  // incorporated into the tail spacer, without space for the cells we can not
  // measure until layout. Expect there to be a tail spacer occupying the space
  // for measured, but not yet rendered items (up to and including item 6).
  expect(component).toMatchSnapshot();
});

it('renders tail spacer up to last measured with irregular layout when getItemLayout undefined', async () => {
  const items = generateItems(10);

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={3}
        maxToRenderPerBatch={1}
        windowSize={1}
        {...baseItemProps(items)}
      />,
    );
  });

  await act(() => {
    const LAST_MEASURED_CELL = 6;

    let currentY = 0;
    for (let i = 0; i <= LAST_MEASURED_CELL; ++i) {
      simulateCellLayout(component, items, i, {
        width: 10,
        height: i,
        x: 0,
        y: currentY + i,
      });
      currentY += i;
    }

    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 30},
    });
    performNextBatch();
  });

  // If cells in the out-of-viewport area have been measured, their space can be
  // incorporated into the tail spacer, without space for the cells we can not
  // measure until layout. Expect there to be a tail spacer occupying the space
  // for measured, but not yet rendered items (up to and including item 6).
  expect(component).toMatchSnapshot();
});

it('renders full tail spacer if all cells measured', async () => {
  const items = generateItems(10);

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={3}
        maxToRenderPerBatch={1}
        windowSize={1}
        {...baseItemProps(items)}
      />,
    );
  });

  await act(() => {
    const LAST_MEASURED_CELL = 9;
    for (let i = 0; i <= LAST_MEASURED_CELL; ++i) {
      simulateCellLayout(component, items, i, {
        width: 10,
        height: 10,
        x: 0,
        y: 10 * i,
      });
    }

    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 30},
    });
    performNextBatch();
  });

  // The tail-spacer should occupy the space of all non-rendered items if all
  // items have been measured.
  expect(component).toMatchSnapshot();
});

it('renders windowSize derived region at top', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 20},
      content: {width: 10, height: 100},
    });
    performAllBatches();
  });

  await act(() => {
    jest.runAllTimers();
  });
  // A windowSize of 3 means that we should render a viewport's worth of content
  // above and below the current. A 20 dip viewport at the top of the list means
  // we should render the top 4 10-dip items (for the current viewport, and
  // 20dip below).
  expect(component).toMatchSnapshot();
});

it('renders windowSize derived region in middle', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 20},
      content: {width: 10, height: 100},
    });
    performAllBatches();
  });

  await act(() => {
    simulateScroll(component, {x: 0, y: 50});
  });

  await act(() => {
    performAllBatches();
  });

  await act(() => {
    jest.runAllTimers();
  });

  // A windowSize of 3 means that we should render a viewport's worth of content
  // above and below the current. A 20 dip viewport in the top of the list means
  // we should render the 6 10-dip items (for the current viewport, 20 dip above
  // and below), along with retaining the top initialNumToRenderItems. We seem
  // to actually render 7 in the middle due to rounding at the moment.
  expect(component).toMatchSnapshot();
});

it('renders windowSize derived region at bottom', async () => {
  const items = generateItems(10);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 20},
      content: {width: 10, height: 100},
    });
    performAllBatches();
  });
  await act(() => {
    simulateScroll(component, {x: 0, y: 80});
  });

  await act(() => {
    performAllBatches();
  });

  await act(() => {
    jest.runAllTimers();
  });

  // A windowSize of 3 means that we should render a viewport's worth of content
  // above and below the current. A 20 dip viewport at the bottom of the list
  // means we should render the bottom 4 10-dip items (for the current viewport,
  // and 20dip above), along with retaining the top initialNumToRenderItems. We
  // seem to actually render 4 at the bottom due to rounding at the moment.
  expect(component).toMatchSnapshot();
});

it('calls _onCellLayout properly', async () => {
  const items = [{key: 'i1'}, {key: 'i2'}, {key: 'i3'}];
  const mock = jest.fn();
  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        data={items}
        renderItem={({item}) => <item value={item.key} />}
        getItem={(data, index) => data[index]}
        getItemCount={data => data.length}
      />,
    );
  });
  const virtualList: VirtualizedList = component.getInstance();
  virtualList._onCellLayout = mock;
  await act(() => {
    component.update(
      <VirtualizedList
        data={[...items, {key: 'i4'}]}
        renderItem={({item}) => <item value={item.key} />}
        getItem={(data, index) => data[index]}
        getItemCount={data => data.length}
      />,
    );
  });
  const cell = virtualList._cellRefs.i4;
  const event = {
    nativeEvent: {layout: {x: 0, y: 0, width: 50, height: 50}, zoomScale: 1},
  };
  cell._onLayout(event);
  expect(mock).toHaveBeenCalledWith(event, 'i4', 3);
  expect(mock).not.toHaveBeenCalledWith(event, 'i3', 2);
});

it('keeps viewport below last focused rendered', async () => {
  const items = generateItems(20);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={1}
        windowSize={1}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 200},
    });

    performAllBatches();
  });

  await act(() => {
    component.getInstance()._onCellFocusCapture(3);
  });

  await act(() => {
    simulateScroll(component, {x: 0, y: 150});
    performAllBatches();
  });

  // Cells 1-8 should remain rendered after scrolling to the bottom of the list
  expect(component).toMatchSnapshot();
});

it('virtualizes away last focused item if focus changes to a new cell', async () => {
  const items = generateItems(20);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={1}
        windowSize={1}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 200},
    });

    performAllBatches();
  });

  await act(() => {
    component.getInstance()._onCellFocusCapture(3);
  });

  await act(() => {
    simulateScroll(component, {x: 0, y: 150});
    performAllBatches();
  });

  await act(() => {
    component.getInstance()._onCellFocusCapture(17);
  });

  // Cells 1-8 should no longer be rendered after focus is moved to the end of
  // the list
  expect(component).toMatchSnapshot();
});

it('keeps viewport above last focused rendered', async () => {
  const items = generateItems(20);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={1}
        windowSize={1}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 200},
    });

    performAllBatches();
  });

  await act(() => {
    component.getInstance()._onCellFocusCapture(3);
  });

  await act(() => {
    simulateScroll(component, {x: 0, y: 150});
    performAllBatches();
  });

  await act(() => {
    component.getInstance()._onCellFocusCapture(17);
  });

  await act(() => {
    simulateScroll(component, {x: 0, y: 0});
    performAllBatches();
  });

  // Cells 12-19 should remain rendered after scrolling to the top of the list
  expect(component).toMatchSnapshot();
});

it('virtualizes away last focused index if item removed', async () => {
  const items = generateItems(20);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={1}
        windowSize={1}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: 200},
    });

    performAllBatches();
  });

  await act(() => {
    component.getInstance()._onCellFocusCapture(3);
  });

  await act(() => {
    simulateScroll(component, {x: 0, y: 150});
    performAllBatches();
  });

  const itemsWithoutFocused = [...items.slice(0, 3), ...items.slice(4)];
  await act(() => {
    component.update(
      <VirtualizedList
        initialNumToRender={1}
        windowSize={1}
        {...baseItemProps(itemsWithoutFocused)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  // Cells 1-8 should no longer be rendered
  expect(component).toMatchSnapshot();
});

it('handles maintainVisibleContentPosition', async () => {
  const items = generateItems(20);
  const ITEM_HEIGHT = 10;

  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={1}
        windowSize={1}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: items.length * ITEM_HEIGHT},
    });

    performAllBatches();
  });

  // Initial render.
  expect(component).toMatchSnapshot();

  // Add new items at the start of the list to trigger the maintainVisibleContentPosition adjustment.
  const newItems = [...generateItems(10, items.length), ...items];
  await act(() => {
    component.update(
      <VirtualizedList
        initialNumToRender={1}
        windowSize={1}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}
        {...baseItemProps(newItems)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  // Previously rendered cells should be rendered still.
  expect(component).toMatchSnapshot();

  // Simulate scroll adjustment from native maintainVisibleContentPosition.
  await act(() => {
    simulateContentLayout(component, {
      width: 10,
      height: newItems.length * ITEM_HEIGHT,
    });
    simulateScroll(component, {x: 0, y: 10 * ITEM_HEIGHT});
    performAllBatches();
  });

  // Previously rendered cells should be rendered still + starting to render new cells ahead.
  expect(component).toMatchSnapshot();
});

it('handles maintainVisibleContentPosition when anchor moves before minIndexForVisible', async () => {
  const items = generateItems(20);
  const ITEM_HEIGHT = 10;

  // Render a list with `minIndexForVisible: 1`
  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        initialNumToRender={1}
        windowSize={1}
        maintainVisibleContentPosition={{minIndexForVisible: 1}}
        {...baseItemProps(items)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  await act(() => {
    simulateLayout(component, {
      viewport: {width: 10, height: 50},
      content: {width: 10, height: items.length * ITEM_HEIGHT},
    });

    performAllBatches();
  });

  expect(component).toMatchSnapshot();

  // Remove the first item to shift the previous anchor to be before
  // `minIndexForVisible`.
  const [, ...restItems] = items;
  await act(() => {
    component.update(
      <VirtualizedList
        initialNumToRender={1}
        windowSize={1}
        maintainVisibleContentPosition={{minIndexForVisible: 1}}
        {...baseItemProps(restItems)}
        {...fixedHeightItemLayoutProps(ITEM_HEIGHT)}
      />,
    );
  });

  expect(component).toMatchSnapshot();
});

function generateItems(count, startKey = 0) {
  return Array(count)
    .fill()
    .map((_, i) => ({key: i + startKey}));
}

function generateItemsStickyEveryN(count, n) {
  return Array(count)
    .fill()
    .map((_, i) => (i % n === 0 ? {key: i, sticky: true} : {key: i}));
}

function baseItemProps(items) {
  return {
    data: items,
    renderItem: ({item}) =>
      createElement('MockCellItem', {value: item.key, ...item}),
    getItem: (data, index) => data[index],
    getItemCount: data => data.length,
    stickyHeaderIndices: stickyHeaderIndices(items),
  };
}

function stickyHeaderIndices(items) {
  return items.filter(item => item.sticky).map(item => item.key);
}

function fixedHeightItemLayoutProps(height) {
  return {
    getItemLayout: (_, index) => ({
      length: height,
      offset: height * index,
      index,
    }),
  };
}

function createRenderMaskForStickyHeaderTest({
  ListHeaderComponent,
  stickyHeaderIndices: stickyHeaderIndicesForTest,
} = {}) {
  return VirtualizedList._createRenderMask(
    {
      data: {length: 20},
      getItem: (data, index) => index,
      getItemCount: data => data.length,
      initialScrollIndex: 1,
      ListHeaderComponent,
      stickyHeaderIndices: stickyHeaderIndicesForTest,
    },
    {
      first: 10,
      last: 12,
    },
  );
}

let lastViewportLayout;
let lastContentLayout;

function simulateLayout(component, args) {
  simulateViewportLayout(component, args.viewport);
  simulateContentLayout(component, args.content);
}

function simulateViewportLayout(component, dimensions) {
  lastViewportLayout = dimensions;
  component
    .getInstance()
    ._onLayout({nativeEvent: {layout: dimensions}, zoomScale: 1});
}

function simulateContentLayout(component, dimensions) {
  lastContentLayout = dimensions;
  component
    .getInstance()
    ._onContentSizeChange(dimensions.width, dimensions.height);
}

function simulateCellLayout(component, items, itemIndex, dimensions) {
  const instance = component.getInstance();
  const cellKey = VirtualizedList._keyExtractor(
    items[itemIndex],
    itemIndex,
    instance.props,
  );
  instance._onCellLayout(
    {nativeEvent: {layout: dimensions, zoomScale: 1}},
    cellKey,
    itemIndex,
  );
}

function simulateScroll(component, position) {
  component.getInstance()._onScroll({
    nativeEvent: {
      contentOffset: position,
      contentSize: lastContentLayout,
      layoutMeasurement: lastViewportLayout,
      zoomScale: 1,
    },
  });
}

async function advanceUntilRenderAreaChanged(component) {
  const instance = component.getInstance();
  const initialRenderArea = instance.state.cellsAroundViewport;
  const MAX_TIMER_STEPS = 20;

  for (let step = 0; step < MAX_TIMER_STEPS; step++) {
    const currentRenderArea = instance.state.cellsAroundViewport;
    const renderAreaChanged =
      currentRenderArea.first !== initialRenderArea.first ||
      currentRenderArea.last !== initialRenderArea.last;

    if (renderAreaChanged) {
      return;
    }

    await act(() => {
      performNextBatch();
    });
  }

  throw new Error(`Render area did not change`);
}

async function advanceUntilLastCellIndexRendered(component, targetLastIndex) {
  const instance = component.getInstance();
  const MAX_TIMER_STEPS = 20;

  for (let step = 0; step < MAX_TIMER_STEPS; step++) {
    if (instance.state.cellsAroundViewport.last === targetLastIndex) {
      return;
    }

    await act(() => {
      performNextBatch();
    });
  }

  throw new Error(`Target last index ${targetLastIndex} not rendered`);
}

function performAllBatches() {
  jest.runAllTimers();
}

function performNextBatch() {
  jest.advanceTimersToNextTimer(1);
}
