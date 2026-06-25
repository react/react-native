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
import type {FlatListProps} from 'react-native/Libraries/Lists/FlatList';

import ensureInstance from '../../../src/private/__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {FlatList, Text, View} from 'react-native';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

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
      const scrollView = ensureInstance(
        nullthrows(flatListRef.current).getNativeScrollRef(),
        ReactNativeElement,
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

      const scrollView = ensureInstance(
        nullthrows(flatListRef.current).getNativeScrollRef(),
        ReactNativeElement,
      );

      Fantom.scrollTo(scrollView, {x: 0, y: 800});

      expect(onEndReached).toHaveBeenCalled();
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
