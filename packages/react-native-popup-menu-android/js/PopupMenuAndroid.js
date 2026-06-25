/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RefObject} from 'react';
import type {Node} from 'react';

import * as React from 'react';
import {StyleSheet, View} from 'react-native';

/**
 * Common implementation for a simple stubbed view. Simply applies the view's styles to the inner
 * View component and renders its children.
 */
class UnimplementedView extends React.Component<{children: Node}> {
  render(): React.Node {
    return (
      <View style={[styles.unimplementedView]}>{this.props.children}</View>
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

export type PopupMenuAndroidInstance = {
  readonly show: () => void,
};

type Props = {
  menuItems: ReadonlyArray<string>,
  onSelectionChange: number => void,
  onDismiss?: () => void,
  children: Node,
  instanceRef: RefObject<?PopupMenuAndroidInstance>,
};

function PopupMenuAndroid(props: Props): Node {
  return <UnimplementedView>{props.children}</UnimplementedView>;
}

export default PopupMenuAndroid;
