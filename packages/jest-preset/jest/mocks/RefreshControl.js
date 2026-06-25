/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RefreshControlProps} from 'react-native/Libraries/Components/RefreshControl/RefreshControl';
import type {HostComponent} from 'react-native/src/private/types/HostComponent';

import * as React from 'react';
import requireNativeComponent from 'react-native/Libraries/ReactNative/requireNativeComponent';

const RCTRefreshControl: HostComponent<{}> = requireNativeComponent<{}>(
  'RCTRefreshControl',
);

export default class RefreshControlMock extends React.Component<RefreshControlProps> {
  static latestRef: ?RefreshControlMock;

  render(): React.Node {
    return <RCTRefreshControl />;
  }

  componentDidMount() {
    RefreshControlMock.latestRef = this;
  }
}
