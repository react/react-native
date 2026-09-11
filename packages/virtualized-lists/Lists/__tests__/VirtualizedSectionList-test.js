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

import type {SectionBase} from 'react-native';

import nullthrows from 'nullthrows';

const VirtualizedSectionList = require('../VirtualizedSectionList').default;
const React = require('react');
const ReactTestRenderer = require('react-test-renderer');

function removeOwner(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(removeOwner);

  const result: {[string]: unknown} = {};
  for (const key of Object.keys(obj)) {
    if (key === '_owner') continue;
    result[key] = removeOwner(obj[key]);
  }
  return result;
}

describe('VirtualizedSectionList', () => {
  it('renders simple list', async () => {
    let component;
    await ReactTestRenderer.act(() => {
      component = ReactTestRenderer.create(
        <VirtualizedSectionList
          sections={[
            // $FlowFixMe[incompatible-type]
            {title: 's1', data: [{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]},
          ]}
          // $FlowFixMe[missing-local-annot]
          renderItem={({item}) => <item value={item.key} />}
          getItem={(data, key) => data[key]}
          getItemCount={data => data.length}
        />,
      );
    });
    expect(component).toMatchSnapshot();
  });

  it('renders empty list', async () => {
    let component;
    await ReactTestRenderer.act(() => {
      component = ReactTestRenderer.create(
        <VirtualizedSectionList
          sections={[] as Array<SectionBase<string>>}
          renderItem={({item}) => <item value={item} />}
          getItem={(data, key) => data[key]}
          getItemCount={data => data.length}
        />,
      );
    });
    expect(component).toMatchSnapshot();
  });

  it('renders empty list with empty component', async () => {
    let component;
    await ReactTestRenderer.act(() => {
      component = ReactTestRenderer.create(
        <VirtualizedSectionList
          sections={[] as Array<SectionBase<string>>}
          ListEmptyComponent={() => <empty />}
          ListFooterComponent={() => <footer />}
          ListHeaderComponent={() => <header />}
          getItem={(data, key) => data[key]}
          getItemCount={data => data.length}
          renderItem={({item}) => <item value={item} />}
        />,
      );
    });
    expect(component).toMatchSnapshot();
  });

  it('renders list with empty component', async () => {
    let component;
    await ReactTestRenderer.act(() => {
      component = ReactTestRenderer.create(
        <VirtualizedSectionList
          // $FlowFixMe[incompatible-type]
          sections={[{title: 's1', data: [{key: 'hello'}]}]}
          ListEmptyComponent={() => <empty />}
          getItem={(data, key) => data[key]}
          getItemCount={data => data.length}
          renderItem={({item}) => <item value={item.key} />}
        />,
      );
    });
    expect(component).toMatchSnapshot();
  });

  it('renders all the bells and whistles', async () => {
    let component;
    await ReactTestRenderer.act(() => {
      component = ReactTestRenderer.create(
        <VirtualizedSectionList
          ItemSeparatorComponent={() => <separator />}
          ListEmptyComponent={() => <empty />}
          ListFooterComponent={() => <footer />}
          ListHeaderComponent={() => <header />}
          sections={
            [
              {
                title: 's1',
                data: new Array<void>(5)
                  .fill()
                  .map((_, ii) => ({id: String(ii)})) as Array<{id: string}>,
              },
            ] as Array<SectionBase<{id: string}>>
          }
          getItem={(data, key) => data[key]}
          getItemCount={data => data.length}
          getItemLayout={({index}) => ({
            index: -1,
            length: 50,
            offset: index * 50,
          })}
          inverted={true}
          keyExtractor={(item, index) => item.id}
          onRefresh={jest.fn()}
          refreshing={false}
          renderItem={({item}) => <item value={item.id} />}
        />,
      );
    });
    // $FlowFixMe[incompatible-use] component is assigned before use inside act()
    expect(removeOwner(component.toJSON())).toMatchSnapshot();
  });

  it('handles separators correctly', async () => {
    const infos = [];
    let component;
    await ReactTestRenderer.act(() => {
      component = ReactTestRenderer.create(
        <VirtualizedSectionList
          ItemSeparatorComponent={props => <separator {...props} />}
          sections={[
            // $FlowFixMe[incompatible-type]
            {title: 's0', data: [{key: 'i0'}, {key: 'i1'}, {key: 'i2'}]},
          ]}
          renderItem={info => {
            infos.push(info);
            return <item title={info.item.key} />;
          }}
          getItem={(data, key) => data[key]}
          getItemCount={data => data.length}
        />,
      );
    });
    expect(component).toMatchSnapshot();

    ReactTestRenderer.act(() => {
      infos[1].separators.highlight();
    });
    expect(component).toMatchSnapshot();
    ReactTestRenderer.act(() => {
      infos[2].separators.updateProps('leading', {press: true});
    });
    expect(component).toMatchSnapshot();
    ReactTestRenderer.act(() => {
      infos[1].separators.unhighlight();
    });
    expect(component).toMatchSnapshot();
  });

  it('handles nested lists', async () => {
    let component;
    await ReactTestRenderer.act(() => {
      component = ReactTestRenderer.create(
        <VirtualizedSectionList
          // $FlowFixMe[incompatible-type]
          sections={
            [
              {title: 'outer', data: [{key: 'outer0'}, {key: 'outer1'}]},
            ] as Array<SectionBase<{key: string}>>
          }
          renderItem={outerInfo => (
            <VirtualizedSectionList
              sections={
                [
                  // $FlowFixMe[incompatible-type]
                  {
                    title: 'inner',
                    data: [
                      {key: outerInfo.item.key + ':inner0'},
                      {key: outerInfo.item.key + ':inner1'},
                    ],
                  },
                ] as Array<SectionBase<{key: string}>>
              }
              horizontal={outerInfo.item.key === 'outer1'}
              renderItem={innerInfo => {
                return <item title={innerInfo.item.key} />;
              }}
              getItem={(data, key) => data[key]}
              getItemCount={data => data.length}
            />
          )}
          getItem={(data, key) => data[key]}
          getItemCount={data => data.length}
        />,
      );
    });
    expect(component).toMatchSnapshot();
  });

  describe('onViewableItemsChanged', () => {
    const ITEM_HEIGHT = 100;

    type Item = {nested: {id: string}};

    // Six of the eight rows (2 headers, 4 items, 2 footers) fit in the
    // viewport, so both section headers, one section footer and three items
    // become viewable.
    const nativeEvent = {
      contentInset: {bottom: 0, left: 0, right: 0, top: 0},
      contentOffset: {x: 0, y: 0},
      contentSize: {height: 8 * ITEM_HEIGHT, width: 300},
      layoutMeasurement: {height: 6 * ITEM_HEIGHT, width: 300},
      zoomScale: 1,
    };

    it('reports section headers and footers without running them through the section keyExtractor', async () => {
      // A key extractor written for items, the way a section defines one. It
      // throws if it is handed anything other than an item.
      const extractorArgs: Array<Item> = [];
      const keyExtractor = (item: ?Item) => {
        const arg = nullthrows(item);
        extractorArgs.push(arg);
        return arg.nested.id;
      };
      const sections = [
        // $FlowFixMe[incompatible-type]
        {
          title: 's1',
          keyExtractor,
          data: [{nested: {id: 'i1.1'}}, {nested: {id: 'i1.2'}}],
        },
        // $FlowFixMe[incompatible-type]
        {
          title: 's2',
          keyExtractor,
          data: [{nested: {id: 'i2.1'}}, {nested: {id: 'i2.2'}}],
        },
      ] as Array<SectionBase<Item>>;
      const onViewableItemsChanged = jest.fn();

      let component;
      await ReactTestRenderer.act(() => {
        component = ReactTestRenderer.create(
          <VirtualizedSectionList
            sections={sections}
            renderItem={({item}) => <item value={item.nested.id} />}
            renderSectionHeader={({section}) => (
              <header value={section.title} />
            )}
            renderSectionFooter={({section}) => (
              <footer value={section.title} />
            )}
            getItem={(data, index) => data[index]}
            getItemCount={data => data.length}
            getItemLayout={(data, index) => ({
              length: ITEM_HEIGHT,
              offset: ITEM_HEIGHT * index,
              index,
            })}
            onViewableItemsChanged={onViewableItemsChanged}
          />,
        );
      });

      const instance = nullthrows(component).getInstance();
      // $FlowFixMe[incompatible-use] wrong types
      // $FlowFixMe[prop-missing] wrong types
      instance._listRef._onScrollBeginDrag({nativeEvent});
      // $FlowFixMe[incompatible-use] wrong types
      // $FlowFixMe[prop-missing] wrong types
      instance._listRef._onScroll({timeStamp: 1000, nativeEvent});

      // The section's keyExtractor is only ever given items from
      // `section.data`, never the section itself.
      const items = sections.flatMap(section => section.data);
      expect(extractorArgs.filter(arg => !items.includes(arg))).toEqual([]);

      // Header and footer rows are still reported, keyed by their section, and
      // item rows are still keyed by the section's keyExtractor.
      expect(onViewableItemsChanged).toHaveBeenCalledTimes(1);
      const {viewableItems} = onViewableItemsChanged.mock.calls[0][0];
      expect(
        viewableItems.map(token => ({key: token.key, index: token.index})),
      ).toEqual([
        {key: '0:header', index: null},
        {key: 'i1.1', index: 0},
        {key: 'i1.2', index: 1},
        {key: '0:footer', index: null},
        {key: '1:header', index: null},
        {key: 'i2.1', index: 0},
      ]);
    });
  });

  describe('scrollToLocation', () => {
    const ITEM_HEIGHT = 100;

    const createVirtualizedSectionList = async (props?: {
      stickySectionHeadersEnabled: boolean,
    }) => {
      let component;
      await ReactTestRenderer.act(() => {
        component = ReactTestRenderer.create(
          <VirtualizedSectionList
            sections={
              [
                // $FlowFixMe[incompatible-type]
                {
                  title: 's1',
                  data: [{key: 'i1.1'}, {key: 'i1.2'}, {key: 'i1.3'}],
                },
                // $FlowFixMe[incompatible-type]
                {
                  title: 's2',
                  data: [{key: 'i2.1'}, {key: 'i2.2'}, {key: 'i2.3'}],
                },
              ] as Array<SectionBase<{key: string}>>
            }
            renderItem={({item}) => <item value={item.key} />}
            getItem={(data, key) => data[key]}
            getItemCount={data => data.length}
            getItemLayout={(data, index) => ({
              length: ITEM_HEIGHT,
              offset: ITEM_HEIGHT * index,
              index,
            })}
            {...props}
          />,
        );
      });

      const instance = nullthrows(component).getInstance();
      const spy = jest.fn();

      // $FlowFixMe[incompatible-use] wrong types
      // $FlowFixMe[prop-missing] wrong types
      instance._listRef.scrollToIndex = spy;

      return {
        instance,
        spy,
      };
    };

    it('when sticky stickySectionHeadersEnabled={true}, header height is added to the developer-provided viewOffset', async () => {
      const {instance, spy} = await createVirtualizedSectionList({
        stickySectionHeadersEnabled: true,
      });

      const viewOffset = 25;

      // $FlowFixMe[prop-missing] scrollToLocation isn't on instance
      instance?.scrollToLocation({
        sectionIndex: 0,
        itemIndex: 1,
        viewOffset,
      });
      expect(spy).toHaveBeenCalledWith({
        index: 1,
        itemIndex: 1,
        sectionIndex: 0,
        viewOffset: viewOffset + ITEM_HEIGHT,
      });
    });

    it.each([
      [
        // prevents #18098
        {sectionIndex: 0, itemIndex: 0},
        {
          index: 0,
          itemIndex: 0,
          sectionIndex: 0,
          viewOffset: 0,
        },
      ],
      [
        {sectionIndex: 2, itemIndex: 1},
        {
          index: 11,
          itemIndex: 1,
          sectionIndex: 2,
          viewOffset: 0,
        },
      ],
      [
        {
          sectionIndex: 0,
          itemIndex: 1,
          viewOffset: 25,
        },
        {
          index: 1,
          itemIndex: 1,
          sectionIndex: 0,
          viewOffset: 25,
        },
      ],
    ])(
      'given sectionIndex, itemIndex and viewOffset, scrollToIndex is called with correct params',
      async (scrollToLocationParams, expected) => {
        const {instance, spy} = await createVirtualizedSectionList();
        // $FlowFixMe[prop-missing] scrollToLocation not on instance
        instance?.scrollToLocation(scrollToLocationParams);
        expect(spy).toHaveBeenCalledWith(expected);
      },
    );
  });
});
