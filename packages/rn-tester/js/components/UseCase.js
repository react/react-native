/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import * as React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type Props = Readonly<{
  children?: React.Node,
  title?: ?string,
  note?: ?string,
  ios?: ?boolean,
  android?: ?boolean,
}>;

export default function UseCase(props: Props): React.Node {
  const children = React.Children.toArray<any>(props.children).filter(
    child => child !== ' ',
  );
  return (
    <View style={styles.container}>
      <Text>{props.title}</Text>
      <Text>{props.note}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
