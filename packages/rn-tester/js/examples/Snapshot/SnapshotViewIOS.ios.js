/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {NativeSyntheticEvent, ViewProps} from 'react-native';

const React = require('react');
const {NativeModules, StyleSheet, UIManager, View} = require('react-native');

const {TestModule} = NativeModules;

// Verify that RCTSnapshot is part of the UIManager since it is only loaded
// if you have linked against RCTTest like in tests, otherwise we will have
// a warning printed out
const RCTSnapshot = UIManager.hasViewManagerConfig('RCTSnapshot')
  ? require('../../../RCTTest/RCTSnapshotNativeComponent')
  : View;

type SnapshotReadyEvent = NativeSyntheticEvent<
  Readonly<{testIdentifier: string, ...}>,
>;

type Props = Readonly<{
  ...ViewProps,
  onSnapshotReady?: ?(event: SnapshotReadyEvent) => unknown,
  testIdentifier?: ?string,
}>;

class SnapshotViewIOS extends React.Component<Props> {
  onDefaultAction: (event: SnapshotReadyEvent) => void = (
    event: SnapshotReadyEvent,
  ) => {
    TestModule.verifySnapshot(TestModule.markTestPassed);
  };

  render(): React.Node {
    const testIdentifier = this.props.testIdentifier || 'test';
    const onSnapshotReady = this.props.onSnapshotReady || this.onDefaultAction;
    return (
      // $FlowFixMe[incompatible-type] - Typing ReactNativeComponent revealed errors
      <RCTSnapshot
        style={style.snapshot}
        {...this.props}
        onSnapshotReady={onSnapshotReady}
        testIdentifier={testIdentifier}
      />
    );
  }
}

const style = StyleSheet.create({
  snapshot: {
    flex: 1,
  },
});

module.exports = SnapshotViewIOS;
