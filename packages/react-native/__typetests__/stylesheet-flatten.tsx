/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
import {View, Text, ViewStyle, StyleSheet} from 'react-native';

interface Props {
  style: ViewStyle;
}

export function App(props: Props) {
  const backgroundColor = (
    StyleSheet.flatten([styles.container, props.style]) as ViewStyle
  ).backgroundColor;

  return (
    <View style={[styles.container, props.style]}>
      <Text>{String(backgroundColor)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'red',
  },
});
