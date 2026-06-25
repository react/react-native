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
import * as React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type Props = Readonly<{
  title: string,
}>;

function RNTesterTitle({title}: Props): React.Node {
  return (
    <RNTesterThemeContext.Consumer>
      {theme => {
        return (
          <View
            style={[
              styles.container,
              {
                borderColor: theme.SeparatorColor,
                backgroundColor: theme.TertiaryGroupedBackgroundColor,
              },
            ]}>
            <Text style={[styles.text, {color: theme.LabelColor}]}>
              {title}
            </Text>
          </View>
        );
      }}
    </RNTesterThemeContext.Consumer>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    borderWidth: 0.5,
    margin: 10,
    marginBottom: 0,
    height: 45,
    padding: 10,
  },
  text: {
    fontSize: 19,
    fontWeight: '500',
  },
});

export default RNTesterTitle;
