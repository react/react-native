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

import * as React from 'react';
import {StyleSheet, View} from 'react-native';

type Props = Readonly<{
  children?: React.Node,
  style?: React.PropOf<View, 'style'>,
  ...
}>;

class SnapshotViewIOS extends React.Component<Props> {
  render(): React.Node {
    return (
      <View style={[styles.unimplementedView, this.props.style]}>
        {this.props.children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  unimplementedView: __DEV__
    ? {
        alignSelf: 'flex-start',
        borderColor: 'red',
        borderWidth: 1,
      }
    : {},
});

export default SnapshotViewIOS;
