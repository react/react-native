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

import type {HostComponent} from 'react-native';
import typeof * as TReactNative from 'react-native';

import * as React from 'react';

const {requireNativeComponent} =
  jest.requireActual<TReactNative>('react-native');

const RCTRefreshControl: HostComponent<{}> = requireNativeComponent<{}>(
  'RCTRefreshControl',
);

export default class RefreshControlMock extends React.Component<{...}> {
  static latestRef: ?RefreshControlMock;

  render(): React.Node {
    return <RCTRefreshControl />;
  }

  componentDidMount() {
    RefreshControlMock.latestRef = this;
  }
}
