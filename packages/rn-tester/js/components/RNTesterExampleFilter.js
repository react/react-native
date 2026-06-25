/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {SectionData} from '../types/RNTesterTypes';

import {RNTesterThemeContext} from './RNTesterTheme';

const RNTesterListFilters = require('./RNTesterListFilters');
const React = require('react');
const {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} = require('react-native');

type Props<T> = {
  filter: Function,
  render: Function,
  disableSearch?: boolean,
  testID?: string,
  hideFilterPills?: boolean,
  page: 'examples_page' | 'components_page',
  sections: ReadonlyArray<SectionData<T>>,
  ...
};

type State = {filter: string, category: string, ...};

class RNTesterExampleFilter<T> extends React.Component<Props<T>, State> {
  state: State = {filter: '', category: ''};

  render(): React.Node {
    const filterText = this.state.filter;
    let filterRegex = /.*/;

    try {
      filterRegex = new RegExp(String(filterText), 'i');
    } catch (error) {
      console.warn(
        'Failed to create RegExp: %s\n%s',
        filterText,
        error.message,
      );
    }

    const filter = (example: T) => {
      const category = this.state.category;
      return (
        this.props.disableSearch ||
        this.props.filter({example, filterRegex, category})
      );
    };

    let filteredSections = this.props.sections.map(section => ({
      ...section,
      data: section.data.filter(filter),
    }));

    if (this.state.filter.trim() !== '' || this.state.category.trim() !== '') {
      filteredSections = filteredSections.filter(
        section => section.title !== 'Recently Viewed',
      );
    }

    return (
      <View style={styles.container}>
        {this._renderTextInput()}
        {this._renderFilteredSections(filteredSections)}
      </View>
    );
  }

  _renderFilteredSections(
    filteredSections: ReadonlyArray<{
      data: Array<T>,
      key: string,
      title: string,
    }>,
  ): React.Node {
    if (this.props.page === 'examples_page') {
      return (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          {this.props.render({filteredSections})}
        </ScrollView>
      );
    } else {
      return this.props.render({filteredSections});
    }
  }

  _renderTextInput(): ?React.MixedElement {
    if (this.props.disableSearch) {
      return null;
    }
    return (
      <RNTesterThemeContext.Consumer>
        {theme => {
          return (
            <View
              style={[
                styles.searchRow,
                {
                  backgroundColor:
                    Platform.OS === 'ios'
                      ? theme.SystemBackgroundColor
                      : theme.BackgroundColor,
                },
              ]}>
              <View style={styles.textInputStyle}>
                <Image
                  source={require('../assets/search-icon.png')}
                  style={styles.searchIcon}
                />
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="always"
                  onChangeText={text => {
                    this.setState(() => ({filter: text}));
                  }}
                  placeholder="Search..."
                  placeholderTextColor={theme.PlaceholderTextColor}
                  underlineColorAndroid="transparent"
                  style={[
                    styles.searchTextInput,
                    {
                      color: theme.LabelColor,
                      backgroundColor: theme.SecondaryGroupedBackgroundColor,
                      borderColor: theme.QuaternaryLabelColor,
                    },
                  ]}
                  testID={this.props.testID}
                  value={this.state.filter}
                />
              </View>
              {!this.props.hideFilterPills && (
                <RNTesterListFilters
                  onFilterButtonPress={filterLabel =>
                    this.setState({category: filterLabel})
                  }
                />
              )}
            </View>
          );
        }}
      </RNTesterThemeContext.Consumer>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchRow: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    alignItems: 'center',
  },
  searchTextInput: {
    borderRadius: 6,
    borderWidth: 1,
    paddingVertical: 0,
    height: 35,
    flex: 1,
    alignSelf: 'center',
    paddingLeft: 35,
  },
  textInputStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    right: 10,
  },
  searchIcon: {
    width: 20,
    height: 20,
    position: 'relative',
    top: 0,
    left: 27,
    zIndex: 2,
  },
});

module.exports = RNTesterExampleFilter;
