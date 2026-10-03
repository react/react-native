/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import {maxContentWidthStyle} from './RNTesterLayout';
import {RNTesterThemeContext} from './RNTesterTheme';
import RNTPressableRow from './RNTPressableRow';
import {memo} from 'react';

const RNTesterExampleFilter = require('./RNTesterExampleFilter');
const React = require('react');
const {SectionList, StyleSheet, Text, View} = require('react-native');

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
function ExampleModuleRow({
  onShowUnderlay,
  onHideUnderlay,
  item,
  handlePress,
}): React.Node {
  return (
    <RNTPressableRow
      title={item.module.title}
      description={item.module.description}
      testID={item.module.title}
      onPressIn={onShowUnderlay}
      onPressOut={onHideUnderlay}
      accessibilityLabel={item.module.title + ' ' + item.module.description}
      onPress={() =>
        handlePress({
          exampleType: item.exampleType,
          key: item.key,
          title: item.module.title,
        })
      }
    />
  );
}

const renderSectionHeader = ({section}: {section: any, ...}) => (
  <RNTesterThemeContext.Consumer>
    {theme => {
      return (
        <Text
          style={[
            styles.sectionHeader,
            {
              color: theme.SecondaryLabelColor,
              backgroundColor: theme.GroupedBackgroundColor,
            },
          ]}>
          {section.title}
        </Text>
      );
    }}
  </RNTesterThemeContext.Consumer>
);

const RNTesterModuleList: React.ComponentType<any> = memo(
  ({sections, handleModuleCardPress}: any) => {
    const filter = ({example, filterRegex, category}: any) =>
      filterRegex.test(example.module.title) &&
      (!category || example.category === category);

    /* $FlowFixMe[missing-local-annot] The type annotation(s) required by
     * Flow's LTI update could not be added via codemod */
    const renderListItem = ({item, section, separators}) => {
      return (
        <ExampleModuleRow
          item={item}
          section={section}
          onShowUnderlay={separators.highlight}
          onHideUnderlay={separators.unhighlight}
          handlePress={handleModuleCardPress}
        />
      );
    };

    return (
      <View style={styles.listContainer}>
        <RNTesterExampleFilter
          testID="explorer_search"
          page="components_page"
          sections={sections}
          filter={filter}
          hideFilterPills={true}
          render={({filteredSections}) => (
            <SectionList
              sections={filteredSections}
              extraData={filteredSections}
              renderItem={renderListItem}
              contentContainerStyle={maxContentWidthStyle}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustContentInsets={false}
              keyboardDismissMode="on-drag"
              renderSectionHeader={renderSectionHeader}
              // eslint-disable-next-line react/no-unstable-nested-components
              ListFooterComponent={() => <View style={{height: 80}} />}
            />
          )}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  sectionHeader: {
    padding: 5,
    fontWeight: '500',
    fontSize: 11,
  },
  topRowStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  imageViewStyle: {
    height: 30,
    width: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    bottom: 5,
  },
  imageStyle: {
    height: 25,
    width: 25,
  },
});

module.exports = RNTesterModuleList;
