/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  RNTesterModule,
  RNTesterModuleExample,
} from '../types/RNTesterTypes';

import {type RNTesterTheme, RNTesterThemeContext} from './RNTesterTheme';
import RNTPressableRow from './RNTPressableRow';
import * as React from 'react';
import {useContext} from 'react';
import {Platform, ScrollView, StyleSheet, Text, View} from 'react-native';

const RNTesterBlock = require('./RNTesterBlock');
const RNTesterExampleFilter = require('./RNTesterExampleFilter');

type Props = {
  module: RNTesterModule,
  example?: ?RNTesterModuleExample,
  onExampleCardPress?: ?(exampleName: string) => unknown,
};

function getExampleTitle(title: $FlowFixMe, platform: $FlowFixMe) {
  return platform != null ? `${title} (${platform} only)` : title;
}

export default function RNTesterModuleContainer(props: Props): React.Node {
  const {module, example, onExampleCardPress} = props;
  const theme = useContext(RNTesterThemeContext);
  const renderExample = (e: $FlowFixMe, i: $FlowFixMe) => {
    // Filter platform-specific es
    const {title, description, platform, render: ExampleComponent} = e;
    if (platform != null && Platform.OS !== platform) {
      return null;
    }
    return module.showIndividualExamples === true ? (
      <RNTPressableRow
        key={e.name}
        onPress={() => onExampleCardPress?.(e.name)}
        title={title}
        description={description}
        accessibilityLabel={e.name + ' ' + description}
        style={StyleSheet.compose(styles.separator, {
          borderBottomColor: theme.SeparatorColor,
        })}
      />
    ) : (
      <RNTesterBlock
        key={i}
        title={getExampleTitle(title, platform)}
        description={description}>
        <ExampleComponent />
      </RNTesterBlock>
    );
  };

  const filter = ({example: e, filterRegex}: $FlowFixMe) =>
    filterRegex.test(e.title);

  const removeHiddenExamples = (ex: RNTesterModuleExample) =>
    ex.hidden !== true;
  const sections = [
    {
      data: module.examples.filter(removeHiddenExamples),
      title: 'EXAMPLES',
      key: 'e',
    },
  ];

  const singleModule =
    example ?? (module.examples.length === 1 ? module.examples[0] : null);

  return singleModule != null ? (
    <>
      {singleModule.scrollable === true ? (
        <ScrollView style={styles.examplesContainer} testID="example-container">
          <singleModule.render />
        </ScrollView>
      ) : (
        <View style={styles.examplesContainer} testID="example-container">
          <singleModule.render />
        </View>
      )}
    </>
  ) : (
    <>
      <Header description={module.description} noBottomPadding theme={theme} />
      <View style={styles.examplesContainer}>
        <RNTesterExampleFilter
          testID="example_search"
          page="examples_page"
          hideFilterPills={true}
          sections={sections}
          filter={filter}
          render={({filteredSections}) =>
            module.showIndividualExamples === true ? (
              filteredSections[0].data.map(renderExample)
            ) : (
              <View style={styles.sectionContainer}>
                {filteredSections[0].data.map(renderExample)}
              </View>
            )
          }
        />
      </View>
    </>
  );
}

function Header(props: {
  description: string,
  theme: RNTesterTheme,
  noBottomPadding?: ?boolean,
}) {
  return (
    <View
      style={[
        styles.headerContainer,
        props.noBottomPadding === true ? styles.headerNoBottomPadding : null,
        {
          backgroundColor:
            Platform.OS === 'ios'
              ? props.theme.SystemBackgroundColor
              : props.theme.BackgroundColor,
        },
      ]}>
      <Text style={[styles.headerDescription, {color: props.theme.LabelColor}]}>
        {props.description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: Platform.OS === 'android' ? 15 : 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  headerDescription: {
    fontSize: 14,
  },
  headerNoBottomPadding: {
    paddingBottom: 0,
  },
  examplesContainer: {
    flexGrow: 1,
    flex: 1,
  },
  separator: {
    borderBottomWidth: Platform.select({
      ios: StyleSheet.hairlineWidth,
      android: 0,
    }),
    marginHorizontal: 15,
  },
  sectionContainer: {
    rowGap: 30,
    paddingVertical: 30,
  },
});
