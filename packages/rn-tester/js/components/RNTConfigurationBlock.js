/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import {RNTesterThemeContext} from './RNTesterTheme';
import * as React from 'react';
import {useContext} from 'react';
import {StyleSheet, View} from 'react-native';

type Props = Readonly<{
  children?: ?React.Node,
  testID?: string,
}>;

/**
 * Container view for a block of configuration options for an example.
 */
export default function RNTConfigurationBlock(props: Props): React.Node {
  const theme = useContext(RNTesterThemeContext);
  return (
    <View
      style={StyleSheet.compose(styles.container, {
        borderColor: theme.SeparatorColor,
      })}
      testID={props.testID}>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
});
