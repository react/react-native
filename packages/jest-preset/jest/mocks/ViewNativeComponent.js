/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';

import * as React from 'react';
import {createElement} from 'react';

export default class View extends React.Component<ViewProps> {
  render(): React.Node {
    // $FlowFixMe[not-a-function]
    return createElement('View', this.props, this.props.children);
  }
}

View.displayName = 'View';
