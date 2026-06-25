/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {Item} from '../../components/ListExampleShared';
import type {SectionBase} from 'react-native';

import {
  FooterComponent,
  HeaderComponent,
  ItemComponent,
  PlainInput,
  SeparatorComponent,
  Spindicator,
  genNewerItems,
  pressItem,
  renderSmallSwitchOption,
  renderStackedItem,
} from '../../components/ListExampleShared';
import RNTesterPage from '../../components/RNTesterPage';
import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Button,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const VIEWABILITY_CONFIG = {
  minimumViewTime: 3000,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

const CONSTANT_SECTION_EXAMPLES = [
  {
    key: 'empty section',
    data: [],
  },
  {
    renderItem: renderStackedItem,
    key: 's1',
    data: [
      {
        title: 'Item In Header Section',
        text: 'Section s1',
        key: 'header item',
      },
    ],
  },
  {
    key: 's2',
    data: [
      {
        noImage: true,
        title: '1st item',
        text: 'Section s2',
        key: 'noimage0',
      },
      {
        noImage: true,
        title: '2nd item',
        text: 'Section s2',
        key: 'noimage1',
      },
    ],
  },
];

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
const renderSectionHeader = ({section}) => (
  <View style={styles.header}>
    <Text style={styles.headerText}>SECTION HEADER: {section.key}</Text>
    <SeparatorComponent />
  </View>
);

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
const renderSectionFooter = ({section}) => (
  <View style={styles.header}>
    <Text style={styles.headerText}>SECTION FOOTER: {section.key}</Text>
    <SeparatorComponent />
  </View>
);

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
const CustomSeparatorComponent = ({highlighted, text}) => (
  <View
    style={[
      styles.customSeparator,
      highlighted && {backgroundColor: 'rgb(217, 217, 217)'},
    ]}>
    <Text style={styles.separatorText}>{text}</Text>
  </View>
);

const EmptySectionList = () => (
  <View style={{alignItems: 'center'}}>
    <RNTesterText style={{fontSize: 20}}>
      This is rendered when the list is empty
    </RNTesterText>
  </View>
);

const renderItemComponent =
  (setItemState: (item: Item) => void) =>
  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  ({item, separators}) => {
    if (isNaN(item.key)) {
      return;
    }
    const onPress = () => {
      const updatedItem = pressItem(item);
      setItemState(updatedItem);
    };

    return (
      <ItemComponent
        item={item}
        onPress={onPress}
        onHideUnderlay={separators.unhighlight}
        onShowUnderlay={separators.highlight}
      />
    );
  };

const onScrollToIndexFailed = (info: {
  index: number,
  highestMeasuredFrameIndex: number,
  averageItemLength: number,
  ...
}) => {
  console.warn('onScrollToIndexFailed. See comment in callback', info);
  /**
   * scrollToLocation() can only scroll to viewable area.
   * For any failure cases this callback will get triggered with `info` object
   *
   * The idea is to calculate a yPosition from `info` to call scrollResponder.scrollTo on.
   *
   * const scrollResponder = ref.current?.getScrollResponder();
   * const positionY = some value we calculate from `info`;
   * if (scrollResponder != null) {
   *    scrollResponder.scrollTo({x, y:positionY, animated: true});
   * }
   */
};

// $FlowFixMe[missing-local-annot]
const ItemSeparatorComponent = info => (
  <CustomSeparatorComponent {...info} text="ITEM SEPARATOR" />
);

// $FlowFixMe[missing-local-annot]
const SectionSeparatorComponent = info => (
  <CustomSeparatorComponent {...info} text="SECTION SEPARATOR" />
);

export component SectionList_scrollable() {
  const scrollPos = new Animated.Value(0);
  const scrollSinkY = Animated.event(
    [{nativeEvent: {contentOffset: {y: scrollPos}}}],
    {useNativeDriver: true},
  );
  const [filterText, setFilterText] = useState('');
  const [virtualized, setVirtualized] = useState(true);
  const [logViewable, setLogViewable] = useState(false);
  const [debug, setDebug] = useState(false);
  const [inverted, setInverted] = useState(false);
  const [data, setData] = useState(genNewerItems(1000));

  const filterRegex = new RegExp(String(filterText), 'i');
  const filter = (item: Item) =>
    filterRegex.test(item.text) || filterRegex.test(item.title);
  const filteredData = data.filter(filter);
  const filteredSectionData = [...CONSTANT_SECTION_EXAMPLES];

  let startIndex = 0;
  const endIndex = filteredData.length - 1;
  for (let ii = 10; ii <= endIndex + 10; ii += 10) {
    // $FlowFixMe[incompatible-type]
    filteredSectionData.push({
      key: `${filteredData[startIndex].key} - ${
        filteredData[Math.min(ii - 1, endIndex)].key
      }`,
      data: filteredData.slice(startIndex, ii),
    });
    startIndex = ii;
  }

  const setItemPress = (item: Item) => {
    if (isNaN(item.key)) {
      return;
    }
    const index = Number(item.key);
    setData([...data.slice(0, index), item, ...data.slice(index + 1)]);
  };

  const ref = useRef<?SectionList<SectionBase<any>>>(null);
  const scrollToLocation = (sectionIndex: number, itemIndex: number) => {
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    if (ref != null && ref.current?.scrollToLocation != null) {
      ref.current.scrollToLocation({sectionIndex, itemIndex});
    }
  };

  const onViewableItemsChanged = (info: {
    changed: Array<{
      key: string,
      isViewable: boolean,
      item: {columns: Array<any>, ...},
      index: ?number,
      section?: any,
      ...
    }>,
    ...
  }) => {
    // Impressions can be logged here
    if (logViewable) {
      console.log(
        'onViewableItemsChanged: ',
        info.changed.map((v: Object) => ({
          ...v,
          item: '...',
          section: v.section.key,
        })),
      );
    }
  };

  return (
    <RNTesterPage noScroll={true}>
      <View style={styles.searchRow}>
        <PlainInput
          onChangeText={text => setFilterText(text)}
          placeholder="Search..."
          value={filterText}
        />
        <View style={styles.optionSection}>
          {renderSmallSwitchOption('Virtualized', virtualized, setVirtualized)}
          {renderSmallSwitchOption('Log Viewable', logViewable, setLogViewable)}
          {renderSmallSwitchOption('Debug', debug, setDebug)}
          {renderSmallSwitchOption('Inverted', inverted, setInverted)}
          <Spindicator value={scrollPos} />
        </View>
        <View style={styles.scrollToColumn}>
          <RNTesterText>scroll to:</RNTesterText>
          <View style={styles.button}>
            <Button
              title="Top"
              onPress={() => scrollToLocation(Math.max(0, 2), 0)}
            />
          </View>
          <View style={styles.button}>
            <Button
              title="3rd Section"
              onPress={() => scrollToLocation(Math.max(0, 3), 0)}
            />
          </View>
          <View style={styles.button}>
            <Button
              title="6th Section"
              onPress={() => scrollToLocation(Math.max(0, 6), 0)}
            />
          </View>
          <View style={styles.button}>
            <Button
              title="Out of Viewable Area (See warning) "
              onPress={() =>
                scrollToLocation(filteredSectionData.length - 1, 0)
              }
            />
          </View>
        </View>
      </View>
      <SeparatorComponent />
      <Animated.SectionList
        ref={ref}
        ListHeaderComponent={HeaderComponent}
        ListFooterComponent={FooterComponent}
        SectionSeparatorComponent={SectionSeparatorComponent}
        ItemSeparatorComponent={ItemSeparatorComponent}
        accessibilityRole="list"
        debug={debug}
        inverted={inverted}
        disableVirtualization={!virtualized}
        onRefresh={() => Alert.alert('onRefresh: nothing to refresh :P')}
        onScroll={scrollSinkY}
        onViewableItemsChanged={onViewableItemsChanged}
        onScrollToIndexFailed={onScrollToIndexFailed}
        refreshing={false}
        renderItem={renderItemComponent(setItemPress)}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        stickySectionHeadersEnabled
        initialNumToRender={10}
        ListEmptyComponent={EmptySectionList}
        onEndReached={() =>
          Alert.alert(
            'onEndReached called',
            'You have reached the end of this list',
          )
        }
        onEndReachedThreshold={0}
        // $FlowFixMe[incompatible-type] - incompatible redenerItem type
        sections={filteredSectionData}
        style={styles.list}
        viewabilityConfig={VIEWABILITY_CONFIG}
      />
    </RNTesterPage>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 5,
  },
  customSeparator: {
    backgroundColor: 'rgb(200, 199, 204)',
  },
  header: {
    backgroundColor: '#e9eaed',
  },
  headerText: {
    padding: 4,
    fontWeight: '600',
  },
  list: {
    backgroundColor: 'white',
  },
  optionSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchRow: {
    paddingHorizontal: 10,
  },
  scrollToColumn: {
    flexDirection: 'column',
    paddingHorizontal: 8,
  },
  separatorText: {
    color: 'gray',
    alignSelf: 'center',
    fontSize: 7,
  },
});

export default {
  title: 'SectionList scrollable',
  name: 'scrollable',
  render: function (): React.MixedElement {
    return <SectionList_scrollable />;
  },
};
