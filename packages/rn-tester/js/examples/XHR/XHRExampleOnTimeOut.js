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

import RNTesterText from '../../components/RNTesterText';

const React = require('react');
const {StyleSheet, Text, TouchableHighlight, View} = require('react-native');

class XHRExampleOnTimeOut extends React.Component<any, any> {
  xhr: XMLHttpRequest;

  constructor(props: any) {
    super(props);
    this.state = {
      status: '',
      loading: false,
    };
  }

  loadTimeOutRequest() {
    this.xhr && this.xhr.abort();

    const xhr = this.xhr || new XMLHttpRequest();

    xhr.onerror = () => {
      console.log('Status ', xhr.status);
      console.log('Error ', xhr.responseText);
    };

    xhr.ontimeout = () => {
      this.setState({
        status: xhr.responseText,
        loading: false,
      });
    };

    xhr.onload = () => {
      console.log('Status ', xhr.status);
      console.log('Response ', xhr.responseText);
    };

    xhr.open('GET', 'https://httpbin.org/delay/5'); // request to take 5 seconds to load
    xhr.timeout = 2000; // request times out in 2 seconds
    xhr.send();
    this.xhr = xhr;

    this.setState({loading: true});
  }

  componentWillUnmount() {
    this.xhr && this.xhr.abort();
  }

  render(): React.Node {
    const button = this.state.loading ? (
      <View style={styles.wrapper}>
        <View style={styles.button}>
          <Text>Loading...</Text>
        </View>
      </View>
    ) : (
      <TouchableHighlight
        style={styles.wrapper}
        // $FlowFixMe[method-unbinding] added when improving typing for this parameters
        // $FlowFixMe[invalid-tuple-arity]
        onPress={this.loadTimeOutRequest.bind(this)}>
        <View style={styles.button}>
          <Text>Make Time Out Request</Text>
        </View>
      </TouchableHighlight>
    );

    return (
      <View>
        {button}
        <RNTesterText>{this.state.status}</RNTesterText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 5,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#eeeeee',
    padding: 8,
  },
});

module.exports = XHRExampleOnTimeOut;
