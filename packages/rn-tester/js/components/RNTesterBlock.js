/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import {RNTesterThemeContext} from './RNTesterTheme';
import * as React from 'react';
import {useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';

type Props = Readonly<{
  children?: React.Node,
  title?: ?string,
  description?: ?string,
}>;

const RNTesterBlock = ({description, title, children}: Props): React.Node => {
  const theme = useContext(RNTesterThemeContext);
  return (
    <View
      style={[
        [styles.container],
        {
          borderColor: theme.SeparatorColor,
          backgroundColor: theme.SecondaryGroupedBackgroundColor,
        },
      ]}>
      <View style={[styles.titleContainer]}>
        {title && (
          <Text style={[styles.titleText, {color: theme.LabelColor}]}>
            {title}
          </Text>
        )}
        {description && (
          <Text
            style={[
              styles.descriptionText,
              // $FlowFixMe[constant-condition]
              {color: theme.LabelColor, marginTop: description ? 10 : 0},
            ]}>
            {description}
          </Text>
        )}
      </View>
      <View style={styles.children}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 0,
    borderWidth: 1,
    marginHorizontal: 20,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '300',
  },
  titleContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  descriptionText: {
    fontSize: 12,
    opacity: 0.5,
  },
  children: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
});

module.exports = RNTesterBlock;
