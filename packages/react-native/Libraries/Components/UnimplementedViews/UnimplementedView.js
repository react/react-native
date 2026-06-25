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
import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';

import StyleSheet from '../../StyleSheet/StyleSheet';
import * as React from 'react';

type Props = Readonly<{
  style?: ?ViewStyleProp,
  children?: React.Node,
  ...
}>;

/**
 * Common implementation for a simple stubbed view. Simply applies the view's styles to the inner
 * View component and renders its children.
 */
class UnimplementedView extends React.Component<Props> {
  render(): React.Node {
    // Workaround require cycle from requireNativeComponent
    const View = require('../View/View').default;
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

export default UnimplementedView;
