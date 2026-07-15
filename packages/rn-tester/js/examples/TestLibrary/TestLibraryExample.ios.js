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

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

const {RNTesterThemeContext} = require('../../components/RNTesterTheme');
const React = require('react');
const {Alert, Button, StyleSheet, Text, View} = require('react-native');
const {greet} = require('react-native-test-library-apple');
const {getVersion} = require('react-native-test-library-common');

class TestLibraryDemo extends React.Component<
  {...},
  {appleResult: string, commonResult: string},
> {
  state: {appleResult: string, commonResult: string} = {
    appleResult: '(not called yet)',
    commonResult: '(not called yet)',
  };

  render(): React.Node {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => (
          <View style={styles.container}>
            <View style={styles.row}>
              <Button
                onPress={this.callApple}
                testID="test_library_greet_button"
                title="Greet (apple → prefixed by common)"
              />
            </View>
            <Text style={[styles.result, {color: theme.LabelColor}]}>
              {this.state.appleResult}
            </Text>

            <View style={styles.row}>
              <Button
                onPress={this.callCommon}
                testID="test_library_get_version_button"
                title="Get version (common)"
              />
            </View>
            <Text style={[styles.result, {color: theme.LabelColor}]}>
              {this.state.commonResult}
            </Text>
          </View>
        )}
      </RNTesterThemeContext.Consumer>
    );
  }

  callApple: () => void = () => {
    greet({name: 'RNTester', language: 'en'})
      .then(appleResult => this.setState({appleResult}))
      .catch(err => Alert.alert(String(err)));
  };

  callCommon: () => void = () => {
    getVersion()
      .then(commonResult => this.setState({commonResult}))
      .catch(err => Alert.alert(String(err)));
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  row: {
    marginTop: 12,
    marginBottom: 4,
  },
  result: {
    fontFamily: 'Menlo',
    fontSize: 13,
    marginBottom: 8,
  },
});

exports.title = 'Test library (SPM autolinking fixture)';
exports.category = 'Basic';
exports.description =
  'Exercises react-native-test-library-apple and its transitive react-native-test-library-common native module to validate SPM direct + transitive autolinking.';
exports.examples = [
  {
    title: 'Call both native modules',
    render(): React.MixedElement {
      return <TestLibraryDemo />;
    },
  },
] as Array<RNTesterModuleExample>;
