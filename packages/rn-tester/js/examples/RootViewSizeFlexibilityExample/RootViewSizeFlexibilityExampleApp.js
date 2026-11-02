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

const React = require('react');
const {StyleSheet, Text, TouchableHighlight, View} = require('react-native');

class RootViewSizeFlexibilityExampleApp extends React.Component<
  {toggled: boolean, ...},
  any,
> {
  constructor(props: {toggled: boolean, ...}) {
    super(props);
    this.state = {toggled: false};
  }

  _onPressButton() {
    this.setState({toggled: !this.state.toggled});
  }

  render(): React.Node {
    const viewStyle = this.state.toggled
      ? styles.bigContainer
      : styles.smallContainer;

    return (
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      // $FlowFixMe[invalid-tuple-arity]
      <TouchableHighlight onPress={this._onPressButton.bind(this)}>
        <View style={viewStyle}>
          <View style={styles.center}>
            <Text style={styles.whiteText}>React Native Button</Text>
          </View>
        </View>
      </TouchableHighlight>
    );
  }
}

const styles = StyleSheet.create({
  bigContainer: {
    flex: 1,
    height: 60,
    backgroundColor: 'gray',
  },
  smallContainer: {
    flex: 1,
    height: 40,
    backgroundColor: 'gray',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteText: {
    color: 'white',
  },
});

module.exports = RootViewSizeFlexibilityExampleApp;
