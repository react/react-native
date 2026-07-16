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
    expect(component).toMatchSnapshot();
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
        // Section header occupies flattened index 0, so itemIndex 1 (the second row)
        // is flattened index 2.
        index: 2,
        itemIndex: 1,
        sectionIndex: 0,
        viewOffset: viewOffset + ITEM_HEIGHT,
      });
    });

    it('when sticky stickySectionHeadersEnabled={true}, itemIndex: 0 targets the first row and compensates for the sticky header (#50143)', async () => {
      const {instance, spy} = await createVirtualizedSectionList({
        stickySectionHeadersEnabled: true,
      });

      // $FlowFixMe[prop-missing] scrollToLocation isn't on instance
      instance?.scrollToLocation({
        sectionIndex: 0,
        itemIndex: 0,
      });
      // Flattened index 1 is the first item (index 0 is the sticky header). The header
      // height is added to viewOffset so the row is not obscured by the pinned header.
      // Previously this produced index: 0 (the header) with viewOffset: 0, which no-ops
      // against the already-pinned sticky header.
      expect(spy).toHaveBeenCalledWith({
        index: 1,
        itemIndex: 0,
        sectionIndex: 0,
        viewOffset: ITEM_HEIGHT,
      });
    });

    it('itemIndex: 0 in a later section resolves to that section first row (#50143)', async () => {
      const {instance, spy} = await createVirtualizedSectionList();

      // $FlowFixMe[prop-missing] scrollToLocation isn't on instance
      instance?.scrollToLocation({
        sectionIndex: 1,
        itemIndex: 0,
      });
      // Section 0 occupies flattened indices 0..4 (header + 3 items + footer). Section 1
      // starts at 5 (its header), so its first item is flattened index 6. Previously this
      // resolved to index 5 (section 1's header) and silently no-oped.
      expect(spy).toHaveBeenCalledWith({
        index: 6,
        itemIndex: 0,
        sectionIndex: 1,
        viewOffset: 0,
      });
    });

    it('out-of-range itemIndex forwards to scrollToIndex so onScrollToIndexFailed can fire (#50143)', async () => {
      const {instance, spy} = await createVirtualizedSectionList();

      // $FlowFixMe[prop-missing] scrollToLocation isn't on instance
      instance?.scrollToLocation({
        sectionIndex: 1,
        // Section 1 only has 3 items (valid itemIndex 0..2); 5 is out of range.
        itemIndex: 5,
      });
      // The out-of-range location is still forwarded to VirtualizedList.scrollToIndex,
      // which is responsible for range validation / firing onScrollToIndexFailed — it is
      // no longer swallowed by scrollToLocation.
      expect(spy).toHaveBeenCalledWith({
        // 5 (header + 3 items + footer of section 0) + 1 (section 1 header) + 5 (itemIndex).
        index: 11,
        itemIndex: 5,
        sectionIndex: 1,
        viewOffset: 0,
      });
    });

    it.each([
      [
        {sectionIndex: 0, itemIndex: 0},
        {
          // itemIndex 0 is the first row (flattened index 1), not the section header.
          index: 1,
          itemIndex: 0,
          sectionIndex: 0,
          viewOffset: 0,
        },
      ],
      [
        {sectionIndex: 2, itemIndex: 1},
        {
          index: 12,
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
          index: 2,
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
