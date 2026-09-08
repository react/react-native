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

  describe('scrollToLocation', () => {
    const ITEM_HEIGHT = 100;

    const createVirtualizedSectionList = async (props?: {
      stickySectionHeadersEnabled?: boolean,
      sections?: Array<SectionBase<{key: string}>>,
      getItemLayout?: (
        data: unknown,
        index: number,
      ) => {
        length: number,
        offset: number,
        index: number,
      },
    }) => {
      const defaultSections = [
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
      ] as Array<SectionBase<{key: string}>>;

      const sections = props?.sections ?? defaultSections;
      let getItemLayout;
      // Use `in` check to allow explicitly passing `getItemLayout: undefined`
      // to disable the default layout (distinct from not passing the prop at all).
      if (props != null && 'getItemLayout' in props) {
        getItemLayout = props.getItemLayout;
      } else {
        getItemLayout = (data: unknown, index: number) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        });
      }
      const {
        sections: _sections,
        getItemLayout: _getItemLayout,
        ...restProps
      } = props ?? {};
      void _sections;
      void _getItemLayout;

      let component;
      await ReactTestRenderer.act(() => {
        component = ReactTestRenderer.create(
          <VirtualizedSectionList
            sections={sections}
            renderItem={({item}) => <item value={item.key} />}
            getItem={(data, key) => data[key]}
            getItemCount={data => data.length}
            getItemLayout={getItemLayout}
            {...restProps}
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

    it('when sticky headers enabled and itemIndex is 1, header height is added to viewOffset', async () => {
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
        index: 2,
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

    it('scrolls to first item of first section', async () => {
      const {instance, spy} = await createVirtualizedSectionList();
      // $FlowFixMe[prop-missing] scrollToLocation not on instance
      instance?.scrollToLocation({sectionIndex: 0, itemIndex: 0});
      expect(spy).toHaveBeenCalledWith({
        index: 1,
        itemIndex: 0,
        sectionIndex: 0,
        viewOffset: 0,
      });
    });

    it('scrolls to first item of a later section', async () => {
      const {instance, spy} = await createVirtualizedSectionList();
      // $FlowFixMe[prop-missing] scrollToLocation not on instance
      instance?.scrollToLocation({sectionIndex: 1, itemIndex: 0});
      expect(spy).toHaveBeenCalledWith({
        index: 6,
        itemIndex: 0,
        sectionIndex: 1,
        viewOffset: 0,
      });
    });

    it('when sticky headers enabled and itemIndex is 0, header height is added to viewOffset (was previously skipped)', async () => {
      // Use distinct heights per index so only the correct header's height can satisfy the assertion.
      // Header at flat index 0 has height 37, item at index 1 has height 41 — an off-by-one
      // in the header lookup would produce 41 and fail.
      const HEADER_HEIGHT = 37;
      const ITEM_HEIGHT_DISTINCT = 41;
      const getItemLayout = (data: unknown, index: number) => ({
        length: index === 0 ? HEADER_HEIGHT : ITEM_HEIGHT_DISTINCT + index,
        offset: 0,
        index,
      });
      const {instance, spy} = await createVirtualizedSectionList({
        stickySectionHeadersEnabled: true,
        getItemLayout,
      });
      // $FlowFixMe[prop-missing] scrollToLocation not on instance
      instance?.scrollToLocation({sectionIndex: 0, itemIndex: 0});
      expect(spy).toHaveBeenCalledWith({
        index: 1,
        itemIndex: 0,
        sectionIndex: 0,
        viewOffset: HEADER_HEIGHT,
      });
    });

    it('preserves caller-supplied viewOffset and adds header height when sticky', async () => {
      const {instance, spy} = await createVirtualizedSectionList({
        stickySectionHeadersEnabled: true,
      });
      // $FlowFixMe[prop-missing] scrollToLocation not on instance
      instance?.scrollToLocation({
        sectionIndex: 1,
        itemIndex: 0,
        viewOffset: 10,
      });
      expect(spy).toHaveBeenCalledWith({
        index: 6,
        itemIndex: 0,
        sectionIndex: 1,
        viewOffset: 10 + ITEM_HEIGHT,
      });
    });

    it('preserves caller-supplied viewOffset without sticky headers', async () => {
      const {instance, spy} = await createVirtualizedSectionList();
      // $FlowFixMe[prop-missing] scrollToLocation not on instance
      instance?.scrollToLocation({
        sectionIndex: 1,
        itemIndex: 2,
        viewOffset: 15,
      });
      expect(spy).toHaveBeenCalledWith({
        index: 8,
        itemIndex: 2,
        sectionIndex: 1,
        viewOffset: 15,
      });
    });

    it('handles out-of-range itemIndex', async () => {
      const {instance, spy} = await createVirtualizedSectionList();
      // $FlowFixMe[prop-missing] scrollToLocation not on instance
      instance?.scrollToLocation({sectionIndex: 1, itemIndex: 10});
      // 10 + 1 + (3 + 2) = 16, out of range for 10-item list but still forwarded
      expect(spy).toHaveBeenCalledWith({
        index: 16,
        itemIndex: 10,
        sectionIndex: 1,
        viewOffset: 0,
      });
    });

    it('works with varying item heights and no getItemLayout', async () => {
      const {instance, spy} = await createVirtualizedSectionList({
        sections: [
          // $FlowFixMe[incompatible-type]
          {title: 's1', data: [{key: 'a1'}, {key: 'a2'}]},
          // $FlowFixMe[incompatible-type]
          {
            title: 's2',
            data: [{key: 'b1'}, {key: 'b2'}, {key: 'b3'}, {key: 'b4'}],
          },
        ] as Array<SectionBase<{key: string}>>,
        getItemLayout: undefined,
      });
      // $FlowFixMe[prop-missing] scrollToLocation not on instance
      instance?.scrollToLocation({sectionIndex: 1, itemIndex: 0});
      // section 0: 2 items + header/footer = 4, so first item of section 1 is at 1 + 4 = 5
      expect(spy).toHaveBeenCalledWith({
        index: 5,
        itemIndex: 0,
        sectionIndex: 1,
        viewOffset: 0,
      });
    });
  });
});
