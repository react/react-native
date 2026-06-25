/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {RNTesterThemeContext} from './RNTesterTheme';

const React = require('react');
const {StyleSheet, Text} = require('react-native');

type Props = Readonly<{
  children: string,
}>;

class RNTesterComponentTitle extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  render(): React.Node {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => (
          <Text style={[styles.titleText, {color: theme.LabelColor}]}>
            {this.props.children}
          </Text>
        )}
      </RNTesterThemeContext.Consumer>
    );
  }
}

const styles = StyleSheet.create({
  titleText: {
    fontSize: 18,
    fontWeight: '400',
  },
});

module.exports = RNTesterComponentTitle;
