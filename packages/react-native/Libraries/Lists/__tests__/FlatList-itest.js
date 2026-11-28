/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';
import type {FlatListProps} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {FlatList, Text, View} from 'react-native';

function testPropPropagatedToMountingLayer<TValue>({
  propName,
  value,
  defaultValue,
  renderChildrenForValue,
}: Readonly<{
  propName: string,
  value: TValue,
  defaultValue: TValue,
  renderChildrenForValue?: () => React.Node,
}>) {
  describe(propName, () => {
    it('is propagated to the mounting layer', () => {
      const root = Fantom.createRoot();
      const props: FlatListProps<Readonly<{}>> = {
        // $FlowFixMe[incompatible-type]
        [propName]: value,
      };
      Fantom.runTask(() => {
        root.render(<FlatList data={null} {...props} />);
      });

      expect(root.getRenderedOutput({props: [propName]}).toJSX()).toEqual(
        <rn-scrollView
          {...{
            // $FlowFixMe[incompatible-type] jsx_intrinsic_elements rollout
            [propName]: JSON.stringify(value),
          }}>
          {renderChildrenForValue != null ? (
            renderChildrenForValue()
          ) : (
            <rn-view />
          )}
        </rn-scrollView>,
      );
    });

    it(`default value is ${JSON.stringify(defaultValue) ?? 'null'}`, () => {
      const root = Fantom.createRoot();
      const props: FlatListProps<Readonly<{}>> = {
        // $FlowFixMe[incompatible-type]
        [propName]: defaultValue,
      };
      Fantom.runTask(() => {
        root.render(<FlatList data={null} {...props} />);
      });

      expect(root.getRenderedOutput({props: [propName]}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view />
        </rn-scrollView>,
      );
    });
  });
}

describe('<FlatList>', () => {
  describe('props', () => {
    describe('data & renderItem', () => {
      const root = Fantom.createRoot();
      it('List is rendered as expected', () => {
        Fantom.runTask(() => {
          root.render(
            <FlatList
              data={[
                {title: 'Title Text', key: 'item1'},
                {title: 'Title Text 2', key: 'item2'},
              ]}
              renderItem={({item, separators}) => <Text>{item.title}</Text>}
            />,
          );
        });

        expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
          <rn-scrollView>
            <rn-view>
              <rn-paragraph key="0">Title Text</rn-paragraph>
              <rn-paragraph key="1">Title Text 2</rn-paragraph>
            </rn-view>
          </rn-scrollView>,
        );
      });
    });

    describe('inverted', () => {
      it('changes prop isInvertedVirtualizedList which gets propagated to mounting layer', () => {
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(<FlatList data={null} inverted={true} />);
        });

        expect(
          root
            .getRenderedOutput({
              props: ['inverted', 'isInvertedVirtualizedList'],
            })
            .toJSX(),
        ).toEqual(
          <rn-scrollView isInvertedVirtualizedList="true">
            <rn-view />
          </rn-scrollView>,
        );
      });

      it('default value is false', () => {
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(<FlatList data={null} inverted={false} />);
        });

        expect(
          root
            .getRenderedOutput({
              props: ['inverted', 'isInvertedVirtualizedList'],
            })
            .toJSX(),
        ).toEqual(
          <rn-scrollView>
            <rn-view />
          </rn-scrollView>,
        );
      });
    });
  });

  describe('props inherited from ScrollView', () => {
    testPropPropagatedToMountingLayer<boolean>({
      propName: 'disableIntervalMomentum',
      value: true,
      defaultValue: false,
    });

    testPropPropagatedToMountingLayer<boolean>({
      propName: 'horizontal',
      value: true,
      defaultValue: false,
      renderChildrenForValue: () => <rn-androidHorizontalScrollContentView />,
    });

    testPropPropagatedToMountingLayer<boolean>({
      propName: 'scrollEnabled',
      value: false,
      defaultValue: true,
    });

    testPropPropagatedToMountingLayer<boolean>({
      propName: 'pagingEnabled',
      value: true,
      defaultValue: false,
    });

    testPropPropagatedToMountingLayer<boolean>({
      propName: 'showsVerticalScrollIndicator',
      value: false,
      defaultValue: true,
    });

    testPropPropagatedToMountingLayer<boolean>({
      propName: 'snapToStart',
      value: false,
      defaultValue: true,
    });

    testPropPropagatedToMountingLayer<boolean>({
      propName: 'snapToEnd',
      value: false,
      defaultValue: true,
    });
  });

  describe('ListHeaderComponent', () => {
    it('renders a header before list items', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <FlatList
            data={[{key: 'item1', title: 'Item 1'}]}
            renderItem={({item}) => <Text>{item.title}</Text>}
            ListHeaderComponent={() => <Text>Header</Text>}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-view key="0">
              <rn-paragraph>Header</rn-paragraph>
            </rn-view>
            <rn-paragraph key="1">Item 1</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('ListFooterComponent', () => {
    it('renders a footer after list items', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <FlatList
            data={[{key: 'item1', title: 'Item 1'}]}
            renderItem={({item}) => <Text>{item.title}</Text>}
            ListFooterComponent={() => <Text>Footer</Text>}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">Item 1</rn-paragraph>
            <rn-paragraph key="1">Footer</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('ListEmptyComponent', () => {
    it('renders the empty component when data is empty', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <FlatList
            data={[]}
            renderItem={({item}) => <Text>should not render</Text>}
            ListEmptyComponent={() => <Text>No items</Text>}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph>No items</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });

    it('does not render the empty component when data has items', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <FlatList
            data={[{key: 'item1', title: 'Item 1'}]}
            renderItem={({item}) => <Text>{item.title}</Text>}
            ListEmptyComponent={() => <Text>No items</Text>}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph>Item 1</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('numColumns', () => {
    it('lays out items in a grid when numColumns > 1', () => {
      const root = Fantom.createRoot({
        viewportWidth: 400,
        viewportHeight: 600,
      });
      Fantom.runTask(() => {
        root.render(
          <FlatList
            data={[{key: '1'}, {key: '2'}, {key: '3'}]}
            numColumns={2}
            renderItem={() => (
              <View style={{height: 50, flex: 1}} collapsable={false} />
            )}
          />,
        );
      });

      // Items 1 and 2 share the first row (each 200px wide),
      // item 3 is alone on the second row (full 400px width).
      expect(
        root
          .getRenderedOutput({
            includeLayoutMetrics: true,
            props: ['layoutMetrics-frame'],
          })
          .toJSX(),
      ).toEqual(
        <rn-scrollView layoutMetrics-frame="{x:0,y:0,width:400,height:600}">
          <rn-view layoutMetrics-frame="{x:0,y:0,width:400,height:100}">
            <rn-view
              key="0"
              layoutMetrics-frame="{x:0,y:0,width:200,height:50}"
            />
            <rn-view
              key="1"
              layoutMetrics-frame="{x:200,y:0,width:200,height:50}"
            />
            <rn-view
              key="2"
              layoutMetrics-frame="{x:0,y:50,width:400,height:50}"
            />
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('ItemSeparatorComponent', () => {
    it('renders separators between items', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <FlatList
            data={[
              {key: '1', title: 'First'},
              {key: '2', title: 'Second'},
              {key: '3', title: 'Third'},
            ]}
            renderItem={({item}) => <Text>{item.title}</Text>}
            ItemSeparatorComponent={() => <View testID="separator" />}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">First</rn-paragraph>
            <rn-view key="1" />
            <rn-paragraph key="2">Second</rn-paragraph>
            <rn-view key="3" />
            <rn-paragraph key="4">Third</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('keyExtractor', () => {
    it('uses custom keyExtractor for item keys', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <FlatList
            data={[
              {id: 'custom-1', title: 'Item 1'},
              {id: 'custom-2', title: 'Item 2'},
            ]}
            renderItem={({item}) => <Text>{item.title}</Text>}
            keyExtractor={(item: {id: string, title: string}) => item.id}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">Item 1</rn-paragraph>
            <rn-paragraph key="1">Item 2</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('getItemLayout', () => {
    it('uses getItemLayout to determine item positions', () => {
      const root = Fantom.createRoot({
        viewportWidth: 400,
        viewportHeight: 600,
      });
      Fantom.runTask(() => {
        root.render(
          <FlatList
            data={[{key: '1'}, {key: '2'}]}
            renderItem={() => <View style={{height: 50}} collapsable={false} />}
            getItemLayout={(
              _data: ?Readonly<$ArrayLike<{key: string}>>,
              index: number,
            ) => ({
              length: 50,
              offset: 50 * index,
              index,
            })}
          />,
        );
      });

      expect(
        root
          .getRenderedOutput({
            includeLayoutMetrics: true,
            props: ['layoutMetrics-frame'],
          })
          .toJSX(),
      ).toEqual(
        <rn-scrollView layoutMetrics-frame="{x:0,y:0,width:400,height:600}">
          <rn-view layoutMetrics-frame="{x:0,y:0,width:400,height:100}">
            <rn-view
              key="0"
              layoutMetrics-frame="{x:0,y:0,width:400,height:50}"
            />
            <rn-view
              key="1"
              layoutMetrics-frame="{x:0,y:50,width:400,height:50}"
            />
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('initialNumToRender', () => {
    it('initially renders limited items then renders more on scroll', () => {
      const root = Fantom.createRoot({
        viewportWidth: 400,
        viewportHeight: 200,
      });
      const flatListRef = createRef<FlatList<{key: string, title: string}>>();
      Fantom.runTask(() => {
        root.render(
          <FlatList
            ref={flatListRef}
            data={[
              {key: '1', title: 'Item 1'},
              {key: '2', title: 'Item 2'},
              {key: '3', title: 'Item 3'},
              {key: '4', title: 'Item 4'},
              {key: '5', title: 'Item 5'},
              {key: '6', title: 'Item 6'},
              {key: '7', title: 'Item 7'},
              {key: '8', title: 'Item 8'},
              {key: '9', title: 'Item 9'},
              {key: '10', title: 'Item 10'},
            ]}
            renderItem={({item}) => <Text>{item.title}</Text>}
            getItemLayout={(
              _data: ?Readonly<$ArrayLike<{key: string, title: string}>>,
              index: number,
            ) => ({
              length: 50,
              offset: 50 * index,
              index,
            })}
            initialNumToRender={2}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">Item 1</rn-paragraph>
            <rn-paragraph key="1">Item 2</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );

      // Scroll down to trigger rendering of additional items.
      const scrollView = nullthrows(
        nullthrows(flatListRef.current).getNativeScrollRef(),
      );
      Fantom.scrollTo(scrollView, {x: 0, y: 100});

      const output = root.getRenderedOutput({props: []}).toJSONObject();
      const innerView = output.children[0];
      expect(typeof innerView).toBe('object');
      if (typeof innerView === 'object') {
        expect(innerView.children.length).toBeGreaterThan(2);
      }
    });
  });

  describe('onEndReached', () => {
    it('calls onEndReached when scrolled near the end', () => {
      const root = Fantom.createRoot({
        viewportWidth: 400,
        viewportHeight: 200,
      });
      const onEndReached = jest.fn();
      const flatListRef = createRef<FlatList<{key: string}>>();
      Fantom.runTask(() => {
        root.render(
          <FlatList
            ref={flatListRef}
            data={Array.from({length: 10}, (_, i) => ({key: String(i)}))}
            renderItem={() => (
              <View style={{height: 100}} collapsable={false} />
            )}
            getItemLayout={(
              _data: ?Readonly<$ArrayLike<{key: string}>>,
              index: number,
            ) => ({
              length: 100,
              offset: 100 * index,
              index,
            })}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
          />,
        );
      });

      const scrollView = nullthrows(
        nullthrows(flatListRef.current).getNativeScrollRef(),
      );

      Fantom.scrollTo(scrollView, {x: 0, y: 800});

      expect(onEndReached).toHaveBeenCalled();
    });
  });

  describe('onViewableItemsChanged', () => {
    it('reports viewable items after scrolling', () => {
      const root = Fantom.createRoot({
        viewportWidth: 400,
        viewportHeight: 200,
      });
      const onViewableItemsChanged = jest.fn();
      const flatListRef = createRef<FlatList<{key: string}>>();
      Fantom.runTask(() => {
        root.render(
          <FlatList
            ref={flatListRef}
            data={Array.from({length: 20}, (_, i) => ({key: String(i)}))}
            renderItem={() => (
              <View style={{height: 100}} collapsable={false} />
            )}
            getItemLayout={(
              _data: ?Readonly<$ArrayLike<{key: string}>>,
              index: number,
            ) => ({
              length: 100,
              offset: 100 * index,
              index,
            })}
            viewabilityConfig={{itemVisiblePercentThreshold: 50}}
            onViewableItemsChanged={onViewableItemsChanged}
            initialNumToRender={4}
            windowSize={5}
          />,
        );
      });

      const scrollView = nullthrows(
        nullthrows(flatListRef.current).getNativeScrollRef(),
      );

      // Scroll so items around index 3 become the viewable window.
      Fantom.scrollTo(scrollView, {x: 0, y: 300});

      expect(onViewableItemsChanged).toHaveBeenCalled();
      const lastCall =
        onViewableItemsChanged.mock.calls[
          onViewableItemsChanged.mock.calls.length - 1
        ][0];
      const viewableKeys = lastCall.viewableItems.map(
        (item: {key: string, ...}) => item.key,
      );
      expect(viewableKeys).toContain('3');
    });

    it('supports viewabilityConfigCallbackPairs', () => {
      const root = Fantom.createRoot({
        viewportWidth: 400,
        viewportHeight: 200,
      });
      const onViewableItemsChanged = jest.fn();
      const flatListRef = createRef<FlatList<{key: string}>>();
      Fantom.runTask(() => {
        root.render(
          <FlatList
            ref={flatListRef}
            data={Array.from({length: 20}, (_, i) => ({key: String(i)}))}
            renderItem={() => (
              <View style={{height: 100}} collapsable={false} />
            )}
            getItemLayout={(
              _data: ?Readonly<$ArrayLike<{key: string}>>,
              index: number,
            ) => ({
              length: 100,
              offset: 100 * index,
              index,
            })}
            viewabilityConfigCallbackPairs={[
              {
                viewabilityConfig: {viewAreaCoveragePercentThreshold: 50},
                onViewableItemsChanged,
              },
            ]}
            initialNumToRender={4}
            windowSize={5}
          />,
        );
      });

      const scrollView = nullthrows(
        nullthrows(flatListRef.current).getNativeScrollRef(),
      );

      Fantom.scrollTo(scrollView, {x: 0, y: 300});

      expect(onViewableItemsChanged).toHaveBeenCalled();
      const lastCall =
        onViewableItemsChanged.mock.calls[
          onViewableItemsChanged.mock.calls.length - 1
        ][0];
      expect(lastCall.viewableItems.length).toBeGreaterThan(0);
    });

    it('respects minimumViewTime before reporting items', () => {
      const root = Fantom.createRoot({
        viewportWidth: 400,
        viewportHeight: 200,
      });
      const onViewableItemsChanged = jest.fn();
      const flatListRef = createRef<FlatList<{key: string}>>();
      const timers = Fantom.installTimerMock();
      try {
        Fantom.runTask(() => {
          root.render(
            <FlatList
              ref={flatListRef}
              data={Array.from({length: 20}, (_, i) => ({key: String(i)}))}
              renderItem={() => (
                <View style={{height: 100}} collapsable={false} />
              )}
              getItemLayout={(
                _data: ?Readonly<$ArrayLike<{key: string}>>,
                index: number,
              ) => ({
                length: 100,
                offset: 100 * index,
                index,
              })}
              viewabilityConfig={{
                itemVisiblePercentThreshold: 50,
                minimumViewTime: 200,
              }}
              onViewableItemsChanged={onViewableItemsChanged}
              initialNumToRender={4}
              windowSize={5}
            />,
          );
        });

        const scrollView = nullthrows(
          nullthrows(flatListRef.current).getNativeScrollRef(),
        );
        Fantom.scrollTo(scrollView, {x: 0, y: 300});

        // Items must remain viewable for `minimumViewTime` before being
        // reported, so nothing has fired yet.
        expect(onViewableItemsChanged).not.toHaveBeenCalled();

        timers.advanceTimersByTime(200);

        // The first timer represents an intermediate viewport snapshot and
        // must not publish after the final visible set supersedes it.
        expect(onViewableItemsChanged).not.toHaveBeenCalled();

        timers.advanceTimersByTime(200);

        expect(onViewableItemsChanged).toHaveBeenCalled();
      } finally {
        timers.uninstall();
      }
    });

    it('waits for interaction before reporting items when waitForInteraction is set', () => {
      const root = Fantom.createRoot({
        viewportWidth: 400,
        viewportHeight: 200,
      });
      const onViewableItemsChanged = jest.fn();
      const flatListRef = createRef<FlatList<{key: string}>>();
      Fantom.runTask(() => {
        root.render(
          <FlatList
            ref={flatListRef}
            data={Array.from({length: 20}, (_, i) => ({key: String(i)}))}
            renderItem={() => (
              <View style={{height: 100}} collapsable={false} />
            )}
            getItemLayout={(
              _data: ?Readonly<$ArrayLike<{key: string}>>,
              index: number,
            ) => ({
              length: 100,
              offset: 100 * index,
              index,
            })}
            viewabilityConfig={{
              itemVisiblePercentThreshold: 50,
              waitForInteraction: true,
            }}
            onViewableItemsChanged={onViewableItemsChanged}
            initialNumToRender={4}
            windowSize={5}
          />,
        );
      });

      // Initially visible items are withheld until the user interacts.
      expect(onViewableItemsChanged).not.toHaveBeenCalled();

      // Signal an interaction (scrolling records this via onScrollBeginDrag; the
      // public method is the deterministic equivalent), then a viewability
      // re-evaluation reports the visible items.
      Fantom.runTask(() => {
        nullthrows(flatListRef.current).recordInteraction();
      });

      const scrollView = nullthrows(
        nullthrows(flatListRef.current).getNativeScrollRef(),
      );
      Fantom.scrollTo(scrollView, {x: 0, y: 100});

      expect(onViewableItemsChanged).toHaveBeenCalled();
    });
  });

  describe('extraData', () => {
    it('triggers re-render when extraData changes', () => {
      const root = Fantom.createRoot();
      let suffix = 'v1';
      const renderItem = ({
        item,
      }: {
        item: {key: string, title: string},
        ...
      }) => <Text>{item.title + ' ' + suffix}</Text>;

      Fantom.runTask(() => {
        root.render(
          <FlatList
            data={[{key: '1', title: 'Item'}]}
            renderItem={renderItem}
            extraData={suffix}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph>Item v1</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );

      suffix = 'v2';
      Fantom.runTask(() => {
        root.render(
          <FlatList
            data={[{key: '1', title: 'Item'}]}
            renderItem={renderItem}
            extraData={suffix}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph>Item v2</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('contentContainerStyle', () => {
    it('propagates style to the content container', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <FlatList
            data={[{key: '1', title: 'Item 1'}]}
            renderItem={({item}) => <Text>{item.title}</Text>}
            contentContainerStyle={{backgroundColor: 'red', padding: 10}}
          />,
        );
      });

      expect(
        root.getRenderedOutput({props: ['backgroundColor']}).toJSX(),
      ).toEqual(
        <rn-scrollView>
          <rn-view backgroundColor="rgba(255, 0, 0, 1)">
            <rn-paragraph>Item 1</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('rows whose height depends on the list width', () => {
    // Rows that are not mounted when the width changes keep their metrics
    // from the old width. Mixed with the new metrics of the mounted rows, they
    // made the spacer after the rows kept by initialNumToRender start
    // somewhere other than where those rows end, so the rows after it moved on
    // every layout and the content size never stopped changing.
    const ASPECT_RATIOS = [1.5, 2, 3];
    const DATA = Array.from({length: 200}, (_, i) => ({key: String(i)}));

    for (const [initialWidth, newWidth] of [
      [674, 381],
      [381, 674],
    ]) {
      it(`settle after the width changes from ${initialWidth} to ${newWidth} while scrolled deep`, () => {
        const root = Fantom.createRoot({
          viewportWidth: 800,
          viewportHeight: 900,
        });
        const flatListRef = createRef<FlatList<{key: string}>>();
        let contentSizeChanges = 0;
        const render = (width: number) =>
          Fantom.runTask(() => {
            root.render(
              <View style={{width, height: 900}}>
                <FlatList
                  ref={flatListRef}
                  data={DATA}
                  ListHeaderComponent={<View style={{height: 600}} />}
                  renderItem={({index}) => (
                    <View style={{padding: 8}}>
                      <View
                        style={{
                          aspectRatio:
                            ASPECT_RATIOS[index % ASPECT_RATIOS.length],
                        }}
                      />
                    </View>
                  )}
                  onContentSizeChange={() => {
                    contentSizeChanges++;
                  }}
                />
              </View>,
            );
          });

        const timers = Fantom.installTimerMock();
        try {
          // Delivers layout and lets batched renders run until the content
          // size stops changing, and returns whether it did.
          const settle = (): boolean => {
            const MAX_STEPS = 50;
            const QUIET_STEPS = 5;
            let quietSteps = 0;
            for (let step = 0; step < MAX_STEPS; step++) {
              const changesBefore = contentSizeChanges;
              Fantom.flushAllNativeEvents();
              timers.advanceTimersByTime(100);
              quietSteps =
                contentSizeChanges === changesBefore ? quietSteps + 1 : 0;
              if (quietSteps === QUIET_STEPS) {
                return true;
              }
            }
            return false;
          };

          render(initialWidth);
          expect(settle()).toBe(true);

          // Scroll far enough that the rows after the ones kept by
          // initialNumToRender unmount.
          const scrollView = nullthrows(
            nullthrows(flatListRef.current).getNativeScrollRef(),
          );
          for (let y = 2000; y <= 30000; y += 2000) {
            Fantom.scrollTo(scrollView, {x: 0, y, zoomScale: 1});
            expect(settle()).toBe(true);
          }

          render(newWidth);
          expect(settle()).toBe(true);
        } finally {
          timers.uninstall();
        }
      });
    }
  });

  it('keeps the size of the rows after the window when one row grows on its own', () => {
    // A row that changes size while the list keeps its width doesn't change
    // how the other rows lay out, so the list keeps the metrics of the rows
    // that aren't mounted, and the spacer after the window keeps its size.
    const ROW_HEIGHT = 50;
    const DATA = Array.from({length: 200}, (_, i) => ({key: String(i)}));
    const root = Fantom.createRoot({viewportWidth: 400, viewportHeight: 500});
    const flatListRef = createRef<FlatList<{key: string}>>();
    let contentHeight = 0;
    const render = (firstRowSize: number) =>
      Fantom.runTask(() => {
        root.render(
          <FlatList
            ref={flatListRef}
            data={DATA}
            extraData={firstRowSize}
            windowSize={3}
            contentContainerStyle={{alignItems: 'flex-start'}}
            renderItem={({index}) => (
              <View
                style={
                  index === 0
                    ? {width: firstRowSize, height: firstRowSize}
                    : {width: 300, height: ROW_HEIGHT}
                }
              />
            )}
            onContentSizeChange={(width, height) => {
              contentHeight = height;
            }}
          />,
        );
      });

    const timers = Fantom.installTimerMock();
    try {
      const settle = () => {
        for (let step = 0; step < 10; step++) {
          Fantom.flushAllNativeEvents();
          timers.advanceTimersByTime(100);
        }
      };

      render(ROW_HEIGHT);
      settle();

      // Scroll to the end, so that every row is measured, and back to the top.
      const scrollView = nullthrows(
        nullthrows(flatListRef.current).getNativeScrollRef(),
      );
      for (let y = 500; y <= DATA.length * ROW_HEIGHT - 500; y += 500) {
        Fantom.scrollTo(scrollView, {x: 0, y, zoomScale: 1});
        settle();
      }
      Fantom.scrollTo(scrollView, {x: 0, y: 0, zoomScale: 1});
      settle();
      expect(contentHeight).toBe(DATA.length * ROW_HEIGHT);

      // The rows after the window keep the offsets they were measured at
      // until they are measured again, so the content can stay short by the
      // height row 0 gained, but not lose those rows.
      render(2 * ROW_HEIGHT);
      settle();
      expect(contentHeight).toBeGreaterThanOrEqual(DATA.length * ROW_HEIGHT);
    } finally {
      timers.uninstall();
    }
  });

  it('does not throw when the data is replaced with fewer items after scrolling', () => {
    // Cells measured past the end of the new data must not be used to
    // estimate the cells that are not measured yet.
    const root = Fantom.createRoot({viewportWidth: 400, viewportHeight: 400});
    const flatListRef = createRef<FlatList<{key: string}>>();
    const render = (keyPrefix: string, length: number) =>
      Fantom.runTask(() => {
        root.render(
          <FlatList
            ref={flatListRef}
            data={Array.from({length}, (_, i) => ({key: `${keyPrefix}${i}`}))}
            renderItem={() => <View style={{height: 44}} />}
            windowSize={3}
          />,
        );
      });

    render('a', 270);
    Fantom.flushAllNativeEvents();
    Fantom.scrollTo(
      nullthrows(nullthrows(flatListRef.current).getNativeScrollRef()),
      {x: 0, y: 5000, zoomScale: 1},
    );
    Fantom.flushAllNativeEvents();

    render('b', 20);
    expect(() => Fantom.flushAllNativeEvents()).not.toThrow();
  });

  describe('imperative methods', () => {
    const ITEM_HEIGHT = 50;
    type Item = {key: string, title: string};
    const DATA: Array<Item> = Array.from({length: 20}, (_, i) => ({
      key: String(i),
      title: `Item ${i}`,
    }));
    const getItemLayout = (
      _data: ?Readonly<$ArrayLike<Item>>,
      index: number,
    ) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    });

    describe('scrollToOffset', () => {
      it('dispatches scrollTo command for vertical list', () => {
        const root = Fantom.createRoot();
        const flatListRef = createRef<FlatList<Item>>();

        Fantom.runTask(() => {
          root.render(
            <FlatList
              ref={flatListRef}
              nativeID="flat-list"
              data={DATA}
              renderItem={({item}) => <View style={{height: ITEM_HEIGHT}} />}
              getItemLayout={getItemLayout}
            />,
          );
        });

        root.takeMountingManagerLogs();

        Fantom.runTask(() => {
          nullthrows(flatListRef.current).scrollToOffset({
            offset: 100,
            animated: false,
          });
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Command {type: "ScrollView", nativeID: "flat-list", name: "scrollTo, args: [0,100,false]"}',
        ]);
      });

      it('dispatches scrollTo command for horizontal list', () => {
        const root = Fantom.createRoot();
        const flatListRef = createRef<FlatList<Item>>();

        Fantom.runTask(() => {
          root.render(
            <FlatList
              ref={flatListRef}
              nativeID="flat-list"
              data={DATA}
              horizontal={true}
              renderItem={({item}) => <View style={{width: ITEM_HEIGHT}} />}
              getItemLayout={getItemLayout}
            />,
          );
        });

        root.takeMountingManagerLogs();

        Fantom.runTask(() => {
          nullthrows(flatListRef.current).scrollToOffset({
            offset: 200,
            animated: false,
          });
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Command {type: "ScrollView", nativeID: "flat-list", name: "scrollTo, args: [200,0,false]"}',
        ]);
      });

      it('passes animated flag through to the native command', () => {
        const root = Fantom.createRoot();
        const flatListRef = createRef<FlatList<Item>>();

        Fantom.runTask(() => {
          root.render(
            <FlatList
              ref={flatListRef}
              nativeID="flat-list"
              data={DATA}
              renderItem={({item}) => <View style={{height: ITEM_HEIGHT}} />}
              getItemLayout={getItemLayout}
            />,
          );
        });

        root.takeMountingManagerLogs();

        Fantom.runTask(() => {
          nullthrows(flatListRef.current).scrollToOffset({
            offset: 50,
            animated: true,
          });
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Command {type: "ScrollView", nativeID: "flat-list", name: "scrollTo, args: [0,50,true]"}',
        ]);
      });
    });

    describe('scrollToEnd', () => {
      it('dispatches scrollTo command to scroll to end of content', () => {
        const root = Fantom.createRoot();
        const flatListRef = createRef<FlatList<Item>>();

        Fantom.runTask(() => {
          root.render(
            <FlatList
              ref={flatListRef}
              nativeID="flat-list"
              data={DATA}
              renderItem={({item}) => <View style={{height: ITEM_HEIGHT}} />}
              getItemLayout={getItemLayout}
            />,
          );
        });

        root.takeMountingManagerLogs();

        Fantom.runTask(() => {
          nullthrows(flatListRef.current).scrollToEnd({animated: false});
        });

        // 20 items * 50px = 1000px total content height
        expect(root.takeMountingManagerLogs()).toEqual([
          'Command {type: "ScrollView", nativeID: "flat-list", name: "scrollTo, args: [0,1000,false]"}',
        ]);
      });
    });

    describe('scrollToIndex', () => {
      it('dispatches scrollTo command for a specific index', () => {
        const root = Fantom.createRoot();
        const flatListRef = createRef<FlatList<Item>>();

        Fantom.runTask(() => {
          root.render(
            <FlatList
              ref={flatListRef}
              nativeID="flat-list"
              data={DATA}
              renderItem={({item}) => <View style={{height: ITEM_HEIGHT}} />}
              getItemLayout={getItemLayout}
            />,
          );
        });

        root.takeMountingManagerLogs();

        Fantom.runTask(() => {
          nullthrows(flatListRef.current).scrollToIndex({
            index: 5,
            animated: false,
          });
        });

        // Index 5 with ITEM_HEIGHT=50 should scroll to offset 250
        expect(root.takeMountingManagerLogs()).toEqual([
          'Command {type: "ScrollView", nativeID: "flat-list", name: "scrollTo, args: [0,250,false]"}',
        ]);
      });
    });

    describe('scrollToItem', () => {
      it('dispatches scrollTo command for a specific item', () => {
        const root = Fantom.createRoot();
        const flatListRef = createRef<FlatList<Item>>();

        Fantom.runTask(() => {
          root.render(
            <FlatList
              ref={flatListRef}
              nativeID="flat-list"
              data={DATA}
              renderItem={({item}) => <View style={{height: ITEM_HEIGHT}} />}
              getItemLayout={getItemLayout}
            />,
          );
        });

        root.takeMountingManagerLogs();

        Fantom.runTask(() => {
          nullthrows(flatListRef.current).scrollToItem({
            item: DATA[3],
            animated: false,
          });
        });

        // Item at index 3 with ITEM_HEIGHT=50 should scroll to offset 150
        expect(root.takeMountingManagerLogs()).toEqual([
          'Command {type: "ScrollView", nativeID: "flat-list", name: "scrollTo, args: [0,150,false]"}',
        ]);
      });

      it('does not dispatch command when item is not in data', () => {
        const root = Fantom.createRoot();
        const flatListRef = createRef<FlatList<Item>>();

        Fantom.runTask(() => {
          root.render(
            <FlatList
              ref={flatListRef}
              nativeID="flat-list"
              data={DATA}
              renderItem={({item}) => <View style={{height: ITEM_HEIGHT}} />}
              getItemLayout={getItemLayout}
            />,
          );
        });

        root.takeMountingManagerLogs();

        Fantom.runTask(() => {
          nullthrows(flatListRef.current).scrollToItem({
            item: {key: 'not-in-data', title: 'Missing'},
            animated: false,
          });
        });

        expect(root.takeMountingManagerLogs()).toEqual([]);
      });
    });

    describe('recordInteraction', () => {
      it('can be called without throwing', () => {
        const root = Fantom.createRoot();
        const flatListRef = createRef<FlatList<Item>>();

        Fantom.runTask(() => {
          root.render(
            <FlatList
              ref={flatListRef}
              data={DATA}
              renderItem={({item}) => <View style={{height: ITEM_HEIGHT}} />}
            />,
          );
        });

        expect(() => {
          nullthrows(flatListRef.current).recordInteraction();
        }).not.toThrow();
      });
    });

    describe('flashScrollIndicators', () => {
      it('dispatches flashScrollIndicators command', () => {
        const root = Fantom.createRoot();
        const flatListRef = createRef<FlatList<Item>>();

        Fantom.runTask(() => {
          root.render(
            <FlatList
              ref={flatListRef}
              nativeID="flat-list"
              data={DATA}
              renderItem={({item}) => <View style={{height: ITEM_HEIGHT}} />}
            />,
          );
        });

        root.takeMountingManagerLogs();

        Fantom.runTask(() => {
          nullthrows(flatListRef.current).flashScrollIndicators();
        });

        expect(root.takeMountingManagerLogs()).toEqual([
          'Command {type: "ScrollView", nativeID: "flat-list", name: "flashScrollIndicators"}',
        ]);
      });
    });

    describe('getScrollResponder', () => {
      it('returns a non-null scroll responder', () => {
        const root = Fantom.createRoot();
        const flatListRef = createRef<FlatList<Item>>();

        Fantom.runTask(() => {
          root.render(
            <FlatList
              ref={flatListRef}
              data={DATA}
              renderItem={({item}) => <View style={{height: ITEM_HEIGHT}} />}
            />,
          );
        });

        const responder = nullthrows(flatListRef.current).getScrollResponder();
        expect(responder).not.toBeNull();
      });
    });

    describe('getNativeScrollRef', () => {
      it('returns a non-null native scroll ref', () => {
        const root = Fantom.createRoot();
        const flatListRef = createRef<FlatList<Item>>();

        Fantom.runTask(() => {
          root.render(
            <FlatList
              ref={flatListRef}
              data={DATA}
              renderItem={({item}) => <View style={{height: ITEM_HEIGHT}} />}
            />,
          );
        });

        const nativeRef = nullthrows(flatListRef.current).getNativeScrollRef();
        expect(nativeRef).not.toBeNull();
      });
    });

    describe('getScrollableNode', () => {
      it('returns a non-null scrollable node', () => {
        const root = Fantom.createRoot();
        const flatListRef = createRef<FlatList<Item>>();

        Fantom.runTask(() => {
          root.render(
            <FlatList
              ref={flatListRef}
              data={DATA}
              renderItem={({item}) => <View style={{height: ITEM_HEIGHT}} />}
            />,
          );
        });

        const node = nullthrows(flatListRef.current).getScrollableNode();
        expect(node).not.toBeNull();
      });
    });

    describe('setNativeProps', () => {
      it('can be called without throwing', () => {
        const root = Fantom.createRoot();
        const flatListRef = createRef<FlatList<Item>>();

        Fantom.runTask(() => {
          root.render(
            <FlatList
              ref={flatListRef}
              data={DATA}
              renderItem={({item}) => <View style={{height: ITEM_HEIGHT}} />}
            />,
          );
        });

        expect(() => {
          nullthrows(flatListRef.current).setNativeProps({
            scrollEnabled: false,
          });
        }).not.toThrow();
      });
    });
  });

  describe('ListItemComponent', () => {
    it('renders items using ListItemComponent', () => {
      const root = Fantom.createRoot();
      function ListItemComponent({
        item,
      }: {
        item: {key: string, title: string},
        ...
      }) {
        return <Text>{item.title}</Text>;
      }
      Fantom.runTask(() => {
        root.render(
          <FlatList
            data={[
              {key: '1', title: 'Item 1'},
              {key: '2', title: 'Item 2'},
            ]}
            ListItemComponent={ListItemComponent}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">Item 1</rn-paragraph>
            <rn-paragraph key="1">Item 2</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });

    it('renders items using ListItemComponent across multiple columns', () => {
      const root = Fantom.createRoot({viewportWidth: 400, viewportHeight: 600});
      function ListItemComponent({item}: {item: {key: string}, ...}) {
        return <View style={{height: 50, flex: 1}} collapsable={false} />;
      }
      Fantom.runTask(() => {
        root.render(
          <FlatList
            data={[{key: '1'}, {key: '2'}, {key: '3'}]}
            ListItemComponent={ListItemComponent}
            numColumns={2}
          />,
        );
      });

      // Items 1 and 2 share the first row (each 200px wide),
      // item 3 is alone on the second row (full 400px width).
      expect(
        root
          .getRenderedOutput({
            includeLayoutMetrics: true,
            props: ['layoutMetrics-frame'],
          })
          .toJSX(),
      ).toEqual(
        <rn-scrollView layoutMetrics-frame="{x:0,y:0,width:400,height:600}">
          <rn-view layoutMetrics-frame="{x:0,y:0,width:400,height:100}">
            <rn-view
              key="0"
              layoutMetrics-frame="{x:0,y:0,width:200,height:50}"
            />
            <rn-view
              key="1"
              layoutMetrics-frame="{x:200,y:0,width:200,height:50}"
            />
            <rn-view
              key="2"
              layoutMetrics-frame="{x:0,y:50,width:400,height:50}"
            />
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('data variants', () => {
    it('renders an empty list', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <FlatList
            data={[]}
            renderItem={({item}) => <Text>{item.key}</Text>}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view />
        </rn-scrollView>,
      );
    });

    it('renders array-like data', () => {
      const root = Fantom.createRoot();
      const arrayLike = {
        length: 2,
        0: {key: '1', title: 'Item 1'},
        1: {key: '2', title: 'Item 2'},
      };
      Fantom.runTask(() => {
        root.render(
          <FlatList
            // $FlowFixMe[incompatible-type] - array-like (non-array) data is supported at runtime
            data={arrayLike}
            renderItem={({item}) => <Text>{item.title}</Text>}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">Item 1</rn-paragraph>
            <rn-paragraph key="1">Item 2</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });

    it('ignores invalid data', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <FlatList
            // $FlowExpectedError[incompatible-type] - deliberately passing invalid data
            data={123456}
            // $FlowFixMe[missing-local-annot]
            renderItem={({item}) => <Text>{item.key}</Text>}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view />
        </rn-scrollView>,
      );
    });

    it('calls renderItem for every data item, including null and undefined entries', () => {
      const root = Fantom.createRoot();
      const data: Array<?{key: string}> = [
        {key: 'i1'},
        null,
        undefined,
        {key: 'i2'},
        null,
        undefined,
        {key: 'i3'},
      ];

      const renderItemInOneColumn = jest.fn();
      Fantom.runTask(() => {
        root.render(
          <FlatList data={data} renderItem={renderItemInOneColumn} />,
        );
      });
      expect(renderItemInOneColumn).toHaveBeenCalledTimes(7);

      const renderItemInThreeColumns = jest.fn();
      const multiColumnRoot = Fantom.createRoot();
      Fantom.runTask(() => {
        multiColumnRoot.render(
          <FlatList
            data={data}
            renderItem={renderItemInThreeColumns}
            numColumns={3}
          />,
        );
      });
      expect(renderItemInThreeColumns).toHaveBeenCalledTimes(7);
    });
  });
});
