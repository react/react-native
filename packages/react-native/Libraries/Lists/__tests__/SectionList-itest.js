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

import type {SectionBase} from 'react-native/Libraries/Lists/SectionList';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {SectionList, Text} from 'react-native';

type Item = {key: string};

describe('<SectionList>', () => {
  describe('renders empty list', () => {
    it('renders a scroll view with an empty content container', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[]}
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
  });

  describe('renders section with items', () => {
    it('renders section items inside the scroll view when renderSectionHeader returns null', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[{key: 's1', data: [{key: 'i1'}, {key: 'i2'}]}]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            renderSectionHeader={() => null}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">i1</rn-paragraph>
            <rn-paragraph key="1">i2</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });

    it('passes correct item, index, and section props to renderItem', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[{key: 's1', data: [{key: 'i1'}, {key: 'i2'}]}]}
            renderItem={({item, index, section}) => (
              <Text>{`item:${item.key},index:${index},section:${String(section.key)}`}</Text>
            )}
            renderSectionHeader={() => null}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">item:i1,index:0,section:s1</rn-paragraph>
            <rn-paragraph key="1">item:i2,index:1,section:s1</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('renders section header', () => {
    it('renders section header above items', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[{key: 's1', data: [{key: 'i1'}, {key: 'i2'}]}]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            renderSectionHeader={({section}) => (
              <Text>Header: {String(section.key)}</Text>
            )}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">Header: s1</rn-paragraph>
            <rn-paragraph key="1">i1</rn-paragraph>
            <rn-paragraph key="2">i2</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('sticky headers', () => {
    it('wraps section headers in sticky containers when enabled', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            stickySectionHeadersEnabled={true}
            sections={[
              {key: 's1', data: [{key: 'i1'}]},
              {key: 's2', data: [{key: 'i2'}]},
            ]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            renderSectionHeader={({section}) => (
              <Text>Header: {String(section.key)}</Text>
            )}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">i1</rn-paragraph>
            <rn-paragraph key="1">i2</rn-paragraph>
            <rn-view key="2">
              <rn-paragraph>Header: s1</rn-paragraph>
            </rn-view>
            <rn-view key="3">
              <rn-paragraph>Header: s2</rn-paragraph>
            </rn-view>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('renders section footer', () => {
    it('renders section footer when there is no data', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[{key: 's1', data: []}]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            renderSectionHeader={({section}) => (
              <Text>Header: {String(section.key)}</Text>
            )}
            renderSectionFooter={({section}) => (
              <Text>Footer: {String(section.key)}</Text>
            )}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">Header: s1</rn-paragraph>
            <rn-paragraph key="1">Footer: s1</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });

    it('renders section footer when there is no data and no header', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[{key: 's1', data: []}]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            renderSectionFooter={({section}) => (
              <Text>Footer: {String(section.key)}</Text>
            )}
          />,
        );
      });

      const actual = root.getRenderedOutput({props: []}).toJSX();
      expect(actual).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph>Footer: s1</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });

    it('renders section footer after section items', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[{key: 's1', data: [{key: 'i1'}, {key: 'i2'}]}]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            renderSectionHeader={() => null}
            renderSectionFooter={({section}) => (
              <Text>Footer: {String(section.key)}</Text>
            )}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">i1</rn-paragraph>
            <rn-paragraph key="1">i2</rn-paragraph>
            <rn-paragraph key="2">Footer: s1</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('renders multiple sections', () => {
    it('renders items from all sections', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[
              {key: 's1', data: [{key: 'i1'}, {key: 'i2'}]},
              {key: 's2', data: [{key: 'i3'}, {key: 'i4'}]},
            ]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            renderSectionHeader={() => null}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">i1</rn-paragraph>
            <rn-paragraph key="1">i2</rn-paragraph>
            <rn-paragraph key="2">i3</rn-paragraph>
            <rn-paragraph key="3">i4</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });

    it('renders sections in order', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[
              {key: 's1', data: [{key: 'i1'}]},
              {key: 's2', data: [{key: 'i2'}]},
            ]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            renderSectionHeader={({section}) => (
              <Text>Header: {String(section.key)}</Text>
            )}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">Header: s1</rn-paragraph>
            <rn-paragraph key="1">i1</rn-paragraph>
            <rn-paragraph key="2">Header: s2</rn-paragraph>
            <rn-paragraph key="3">i2</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('renders list header and footer', () => {
    it('renders list header and footer with section items', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            initialNumToRender={Infinity}
            ListHeaderComponent={() => <Text>List Header</Text>}
            ListFooterComponent={() => <Text>List Footer</Text>}
            sections={[{key: 's1', data: [{key: 'i1'}]}]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            renderSectionHeader={() => null}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-view key="0">
              <rn-paragraph>List Header</rn-paragraph>
            </rn-view>
            <rn-paragraph key="1">i1</rn-paragraph>
            <rn-paragraph key="2">List Footer</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('renders ItemSeparatorComponent', () => {
    it('renders item separator between items', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[
              {key: 's1', data: [{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]},
            ]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            ItemSeparatorComponent={() => <Text>separator</Text>}
            renderSectionHeader={() => null}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">i1</rn-paragraph>
            <rn-paragraph key="1">separator</rn-paragraph>
            <rn-paragraph key="2">i2</rn-paragraph>
            <rn-paragraph key="3">separator</rn-paragraph>
            <rn-paragraph key="4">i3</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });

    it('passes correct props to ItemSeparatorComponent', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[
              {key: 's1', data: [{key: 'i1'}, {key: 'i2'}, {key: 'i3'}]},
            ]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            ItemSeparatorComponent={({
              highlighted,
              leadingItem,
              trailingItem,
              section,
              leadingSection,
              trailingSection,
            }: $FlowFixMe) => (
              <Text>
                {`leading=${leadingItem?.key ?? 'null'},trailing=${trailingItem?.key ?? 'null'},section=${String(section?.key ?? 'null')},highlighted=${String(highlighted)},leadingSection=${String(leadingSection?.key ?? 'null')},trailingSection=${String(trailingSection?.key ?? 'null')}`}
              </Text>
            )}
            renderSectionHeader={() => null}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">i1</rn-paragraph>
            <rn-paragraph key="1">
              leading=i1,trailing=i2,section=s1,highlighted=false,leadingSection=null,trailingSection=null
            </rn-paragraph>
            <rn-paragraph key="2">i2</rn-paragraph>
            <rn-paragraph key="3">
              leading=i2,trailing=i3,section=s1,highlighted=false,leadingSection=null,trailingSection=null
            </rn-paragraph>
            <rn-paragraph key="4">i3</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });

    it('uses per-section ItemSeparatorComponent over list-wide ItemSeparatorComponent', () => {
      const s1: SectionBase<Item> = {
        key: 's1',
        data: [{key: 'i1'}, {key: 'i2'}],
        ItemSeparatorComponent: () => <Text>s1-sep</Text>,
      };
      const s2: SectionBase<Item> = {
        key: 's2',
        data: [{key: 'i3'}, {key: 'i4'}],
      };
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[s1, s2]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            ItemSeparatorComponent={() => <Text>default-sep</Text>}
            renderSectionHeader={() => null}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">i1</rn-paragraph>
            <rn-paragraph key="1">s1-sep</rn-paragraph>
            <rn-paragraph key="2">i2</rn-paragraph>
            <rn-paragraph key="3">i3</rn-paragraph>
            <rn-paragraph key="4">default-sep</rn-paragraph>
            <rn-paragraph key="5">i4</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('renders SectionSeparatorComponent', () => {
    it('renders section separator when there are multiple sections', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[
              {key: 's1', data: [{key: 'i1'}]},
              {key: 's2', data: [{key: 'i2'}]},
            ]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            SectionSeparatorComponent={() => <Text>section-sep</Text>}
            renderSectionHeader={() => null}
          />,
        );
      });

      // SectionSeparatorComponent renders before and after each section
      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">section-sep</rn-paragraph>
            <rn-paragraph key="1">i1</rn-paragraph>
            <rn-paragraph key="2">section-sep</rn-paragraph>
            <rn-paragraph key="3">section-sep</rn-paragraph>
            <rn-paragraph key="4">i2</rn-paragraph>
            <rn-paragraph key="5">section-sep</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });

    it('passes correct props to SectionSeparatorComponent', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[
              {key: 's1', data: [{key: 'i1'}]},
              {key: 's2', data: [{key: 'i2'}]},
              {key: 's3', data: [{key: 'i3'}]},
            ]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            SectionSeparatorComponent={({
              highlighted,
              leadingItem,
              trailingItem,
              section,
              leadingSection,
              trailingSection,
            }: $FlowFixMe) => (
              <Text>
                {`leading=${leadingItem?.key ?? 'null'},trailing=${trailingItem?.key ?? 'null'},section=${String(section?.key ?? 'null')},highlighted=${String(highlighted)},leadingSection=${String(leadingSection?.key ?? 'null')},trailingSection=${String(trailingSection?.key ?? 'null')}`}
              </Text>
            )}
            renderSectionHeader={() => null}
          />,
        );
      });

      // SectionSeparatorComponent renders before and after each section's items.
      // Leading separator (before first item): trailingItem is the first item in the section.
      // Trailing separator (after last item): leadingItem is the last item in the section.
      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">
              leading=null,trailing=i1,section=s1,highlighted=false,leadingSection=null,trailingSection=s2
            </rn-paragraph>
            <rn-paragraph key="1">i1</rn-paragraph>
            <rn-paragraph key="2">
              leading=i1,trailing=null,section=s1,highlighted=false,leadingSection=null,trailingSection=s2
            </rn-paragraph>
            <rn-paragraph key="3">
              leading=null,trailing=i2,section=s2,highlighted=false,leadingSection=s1,trailingSection=s3
            </rn-paragraph>
            <rn-paragraph key="4">i2</rn-paragraph>
            <rn-paragraph key="5">
              leading=i2,trailing=null,section=s2,highlighted=false,leadingSection=s1,trailingSection=s3
            </rn-paragraph>
            <rn-paragraph key="6">
              leading=null,trailing=i3,section=s3,highlighted=false,leadingSection=s2,trailingSection=null
            </rn-paragraph>
            <rn-paragraph key="7">i3</rn-paragraph>
            <rn-paragraph key="8">
              leading=i3,trailing=null,section=s3,highlighted=false,leadingSection=s2,trailingSection=null
            </rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('renders ListEmptyComponent', () => {
    it('renders ListEmptyComponent when sections is empty', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            ListEmptyComponent={() => <Text>empty list</Text>}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph>empty list</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('renders per-section renderItem', () => {
    it('uses per-section renderItem over default renderItem', () => {
      const s1: SectionBase<Item> = {
        key: 's1',
        data: [{key: 'i1s1'}, {key: 'i2s1'}],
        renderItem: ({item}) => <Text>{`custom:${item.key}`}</Text>,
      };
      const s2: SectionBase<Item> = {
        key: 's2',
        data: [{key: 'i1s2'}],
      };
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[s1, s2]}
            renderItem={({item}) => <Text>{`default:${item.key}`}</Text>}
            renderSectionHeader={() => null}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph key="0">custom:i1s1</rn-paragraph>
            <rn-paragraph key="1">custom:i2s1</rn-paragraph>
            <rn-paragraph key="2">default:i1s2</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('renders all the bells and whistles', () => {
    it('renders comprehensive list with all major features', () => {
      const s1: SectionBase<Item> = {
        key: 's1',
        data: [{key: 'i1s1'}, {key: 'i2s1'}],
        renderItem: ({item}) => <Text>{`s1-item:${item.key}`}</Text>,
        ItemSeparatorComponent: () => <Text>s1-item-sep</Text>,
      };
      const s2: SectionBase<Item> = {
        key: 's2',
        data: [{key: 'i1s2'}, {key: 'i2s2'}],
      };
      const s3: SectionBase<Item> = {
        key: 's3',
        data: [{key: 'i1s3'}, {key: 'i2s3'}],
      };
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            initialNumToRender={Infinity}
            ListHeaderComponent={() => <Text>list-header</Text>}
            ListFooterComponent={() => <Text>list-footer</Text>}
            ItemSeparatorComponent={() => <Text>item-sep</Text>}
            SectionSeparatorComponent={() => <Text>section-sep</Text>}
            sections={[s1, s2, s3]}
            renderItem={({item}) => <Text>{`default-item:${item.key}`}</Text>}
            renderSectionHeader={({section}) => (
              <Text>{`section-header:${String(section.key)}`}</Text>
            )}
            renderSectionFooter={({section}) => (
              <Text>{`section-footer:${String(section.key)}`}</Text>
            )}
          />,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-view key="0">
              <rn-paragraph>list-header</rn-paragraph>
            </rn-view>
            <rn-paragraph key="1">section-header:s1</rn-paragraph>
            <rn-paragraph key="2">section-sep</rn-paragraph>
            <rn-paragraph key="3">s1-item:i1s1</rn-paragraph>
            <rn-paragraph key="4">s1-item-sep</rn-paragraph>
            <rn-paragraph key="5">s1-item:i2s1</rn-paragraph>
            <rn-paragraph key="6">section-sep</rn-paragraph>
            <rn-paragraph key="7">section-footer:s1</rn-paragraph>
            <rn-paragraph key="8">section-header:s2</rn-paragraph>
            <rn-paragraph key="9">section-sep</rn-paragraph>
            <rn-paragraph key="10">default-item:i1s2</rn-paragraph>
            <rn-paragraph key="11">item-sep</rn-paragraph>
            <rn-paragraph key="12">default-item:i2s2</rn-paragraph>
            <rn-paragraph key="13">section-sep</rn-paragraph>
            <rn-paragraph key="14">section-footer:s2</rn-paragraph>
            <rn-paragraph key="15">section-header:s3</rn-paragraph>
            <rn-paragraph key="16">section-sep</rn-paragraph>
            <rn-paragraph key="17">default-item:i1s3</rn-paragraph>
            <rn-paragraph key="18">item-sep</rn-paragraph>
            <rn-paragraph key="19">default-item:i2s3</rn-paragraph>
            <rn-paragraph key="20">section-sep</rn-paragraph>
            <rn-paragraph key="21">section-footer:s3</rn-paragraph>
            <rn-paragraph key="22">list-footer</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('renders RefreshControl', () => {
    it('renders a RefreshControl when refreshing and onRefresh are provided', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[{key: 's1', data: [{key: 'i1'}]}]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            renderSectionHeader={() => null}
            refreshing={false}
            onRefresh={() => {}}
          />,
        );
      });

      // On Android the RefreshControl (AndroidSwipeRefreshLayout) wraps the scroll view.
      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-androidSwipeRefreshLayout>
          <rn-scrollView>
            <rn-view>
              <rn-paragraph>i1</rn-paragraph>
            </rn-view>
          </rn-scrollView>
        </rn-androidSwipeRefreshLayout>,
      );
    });
  });

  describe('event handlers', () => {
    it('list header wrapper has onLayout registered for header height tracking', () => {
      const root = Fantom.createRoot();
      const headerRef = createRef<React.ElementRef<typeof Text>>();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            initialNumToRender={Infinity}
            ListHeaderComponent={() => <Text ref={headerRef}>List Header</Text>}
            sections={[{key: 's1', data: [{key: 'i1'}]}]}
            renderItem={({item}) => <Text>{item.key}</Text>}
            renderSectionHeader={() => null}
          />,
        );
      });

      const headerText = nullthrows(headerRef.current);

      // The Text is wrapped by a ListHeader container View that tracks header height
      const listHeaderWrapper = nullthrows(headerText.parentNode);

      expect(Fantom.getDefinedEventHandlers(listHeaderWrapper)).toContain(
        'onLayout',
      );
    });

    it('scroll view has onLayout registered', () => {
      const root = Fantom.createRoot();
      const itemRef = createRef<React.ElementRef<typeof Text>>();
      Fantom.runTask(() => {
        root.render(
          <SectionList
            sections={[{key: 's1', data: [{key: 'i1'}]}]}
            renderItem={({item}) => <Text ref={itemRef}>{item.key}</Text>}
            renderSectionHeader={() => null}
          />,
        );
      });

      const itemText = nullthrows(itemRef.current);

      // Navigate: item text -> content container -> scroll view
      const contentContainer = nullthrows(itemText.parentNode);
      const scrollView = nullthrows(contentContainer.parentNode);

      expect(Fantom.getDefinedEventHandlers(scrollView)).toContain('onLayout');
    });
  });
});
