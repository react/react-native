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

import type {
  HostComponent,
  NativeSyntheticEvent,
  ViewProps,
} from 'react-native';

const {requireNativeComponent} = require('react-native');

type SnapshotReadyEvent = NativeSyntheticEvent<
  Readonly<{testIdentifier: string, ...}>,
>;

type NativeProps = Readonly<{
  ...ViewProps,
  onSnapshotReady?: ?(event: SnapshotReadyEvent) => unknown,
  testIdentifier?: ?string,
}>;

const RCTSnapshotNativeComponent: HostComponent<NativeProps> =
  requireNativeComponent<NativeProps>('RCTSnapshot');

module.exports = RCTSnapshotNativeComponent;
