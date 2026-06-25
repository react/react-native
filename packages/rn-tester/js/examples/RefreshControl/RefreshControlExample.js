/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

type Data = Readonly<{
  clicks: number,
  text: string,
}>;

const styles = StyleSheet.create({
  row: {
    borderColor: 'grey',
    borderWidth: 1,
    padding: 20,
    backgroundColor: '#3a5795',
    margin: 5,
  },
  text: {
    alignSelf: 'center',
    color: '#fff',
  },
  scrollview: {
    flex: 1,
  },
});

class Row extends React.Component<
  Readonly<{
    data: Data,
    onClick: Data => void,
  }>,
> {
  _onClick = () => {
    this.props.onClick(this.props.data);
  };

  render(): React.Node {
    return (
      <TouchableWithoutFeedback onPress={this._onClick}>
        <View style={styles.row}>
          <RNTesterText testID="refresh_control_row" style={styles.text}>
            {this.props.data.text + ' (' + this.props.data.clicks + ' clicks)'}
          </RNTesterText>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

type RefreshControlExampleState = Readonly<{
  isRefreshing: boolean,
  loaded: number,
  rowData: ReadonlyArray<Data>,
}>;

class RefreshControlExample extends React.Component<
  Readonly<{}>,
  RefreshControlExampleState,
> {
  state: RefreshControlExampleState = {
    isRefreshing: false,
    loaded: 0,
    rowData: Array.from(new Array<void>(20)).map((val, i) => ({
      text: 'Initial row ' + i,
      clicks: 0,
    })),
  };

  componentDidMount() {
    this._onRefresh();
  }

  _onClick = (row: Data) => {
    this.setState(prevState => {
      const index = prevState.rowData.indexOf(row);
      return index < 0
        ? null
        : {
            rowData: [...prevState.rowData].splice(index, 1, {
              ...row,
              clicks: row.clicks + 1,
            }),
          };
    });
  };

  render(): React.Node {
    const rows = this.state.rowData.map((row, ii) => {
      return <Row key={ii} data={row} onClick={this._onClick} />;
    });
    return (
      <ScrollView
        style={styles.scrollview}
        refreshControl={
          <RefreshControl
            refreshing={this.state.isRefreshing}
            onRefresh={this._onRefresh}
            tintColor="#ff0000"
            title="Loading..."
            titleColor="#00ff00"
            colors={['#ff0000', '#00ff00', '#0000ff']}
            progressBackgroundColor="#ffff00"
          />
        }>
        {rows}
      </ScrollView>
    );
  }

  _onRefresh = () => {
    this.setState({isRefreshing: true});
    setTimeout(() => {
      // prepend 10 items
      const rowData = Array.from(new Array<void>(10))
        .map((val, i) => ({
          text: 'Loaded row ' + (+this.state.loaded + i),
          clicks: 0,
        }))
        .concat(this.state.rowData);

      this.setState({
        loaded: this.state.loaded + 10,
        isRefreshing: false,
        rowData: rowData,
      });
    }, 5000);
  };
}

exports.title = 'RefreshControl';
exports.category = 'Basic';
exports.documentationURL = 'https://reactnative.dev/docs/refreshcontrol';
exports.description = 'Adds pull-to-refresh support to a scrollview.';
exports.examples = [
  {
    title: 'Simple refresh',
    render(): React.MixedElement {
      return <RefreshControlExample />;
    },
  },
] as Array<RNTesterModuleExample>;
