/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type LogBoxLog from './Data/LogBoxLog';

import View from '../Components/View/View';
import StyleSheet from '../StyleSheet/StyleSheet';
import BackHandler from '../Utilities/BackHandler';
import * as LogBoxData from './Data/LogBoxData';
import LogBoxInspector from './UI/LogBoxInspector';
import * as React from 'react';

type Props = Readonly<{
  logs: ReadonlyArray<LogBoxLog>,
  selectedLogIndex: number,
  isDisabled?: ?boolean,
}>;

export class _LogBoxInspectorContainer extends React.Component<Props> {
  _backHandler: ?{remove: () => void, ...} = null;

  componentDidMount() {
    this._backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (this.props.selectedLogIndex < 0) {
          return false;
        }
        this._handleMinimize();
        return true;
      },
    );
  }

  componentWillUnmount() {
    if (this._backHandler) {
      this._backHandler.remove();
    }
  }

  render(): React.Node {
    return (
      <View style={StyleSheet.absoluteFill}>
        <LogBoxInspector
          onDismiss={this._handleDismiss}
          onMinimize={this._handleMinimize}
          onChangeSelectedIndex={this._handleSetSelectedLog}
          logs={this.props.logs}
          selectedIndex={this.props.selectedLogIndex}
        />
      </View>
    );
  }

  _handleDismiss = (): void => {
    // Here we handle the cases when the log is dismissed and it
    // was either the last log, or when the current index
    // is now outside the bounds of the log array.
    const {selectedLogIndex, logs} = this.props;
    const logsArray = Array.from(logs);
    if (selectedLogIndex != null) {
      if (logsArray.length - 1 <= 0) {
        LogBoxData.setSelectedLog(-1);
      } else if (selectedLogIndex >= logsArray.length - 1) {
        LogBoxData.setSelectedLog(selectedLogIndex - 1);
      }

      LogBoxData.dismiss(logsArray[selectedLogIndex]);
    }
  };

  _handleMinimize = (): void => {
    LogBoxData.setSelectedLog(-1);
  };

  _handleSetSelectedLog = (index: number): void => {
    LogBoxData.setSelectedLog(index);
  };
}

export default LogBoxData.withSubscription(
  _LogBoxInspectorContainer,
) as React.ComponentType<{}>;
