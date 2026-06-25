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

import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import * as React from 'react';
import {
  Button,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

class XHRExampleFetch extends React.Component<any, any> {
  responseURL: ?string;
  responseHeaders: ?Object;
  intervalId: ?IntervalID;

  constructor(props: any) {
    super(props);
    this.state = {
      responseText: null,
    };
    this.responseURL = null;
    this.responseHeaders = null;
    this.intervalId = null;
  }

  componentWillUnmount() {
    if (this.intervalId != null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  submit(uri: string) {
    // $FlowFixMe[unused-promise]
    fetch(uri)
      .then(response => {
        this.responseURL = response.url;
        this.responseHeaders = response.headers;
        return response.text();
      })
      .then(body => {
        this.setState({responseText: body});
      });
  }

  _renderHeaders(): null | Array<React.Node> {
    if (!this.responseHeaders) {
      return null;
    }

    const responseHeaders: Array<React.Node> = [];
    const keys = Object.keys(this.responseHeaders.map);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      // $FlowFixMe[incompatible-use]
      const value = this.responseHeaders.get(key);
      responseHeaders.push(
        <Text>
          {key}: {value}
        </Text>,
      );
    }
    return responseHeaders;
  }

  startRepeatedlyFetch() {
    // Clear any existing interval first
    if (this.intervalId != null) {
      clearInterval(this.intervalId);
    }

    const doRequest = () => {
      const url =
        'https://microsoftedge.github.io/Demos/json-dummy-data/5MB-min.json';
      fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(() => {
          console.log('fetch one time');
        })
        .catch(error => console.error(error));
    };
    this.intervalId = setInterval(doRequest, 500);
  }

  render(): React.Node {
    const responseURL = this.responseURL ? (
      <View style={{marginTop: 10}}>
        <Text style={styles.label}>Server response URL:</Text>
        <Text>{this.responseURL}</Text>
      </View>
    ) : null;

    const responseHeaders = this.responseHeaders ? (
      <View style={{marginTop: 10}}>
        <Text style={styles.label}>Server response headers:</Text>
        {this._renderHeaders()}
      </View>
    ) : null;

    const response = this.state.responseText ? (
      <View style={{marginTop: 10}}>
        <Text style={styles.label}>Server response:</Text>
        <TextInput
          editable={false}
          multiline={true}
          defaultValue={this.state.responseText}
          style={styles.textOutput}
        />
      </View>
    ) : null;

    return (
      <RNTesterThemeContext.Consumer>
        {theme => (
          <>
            <Button
              title="RepeatedlyFetch"
              onPress={() => this.startRepeatedlyFetch()}
            />
            <Text style={styles.label}>Edit URL to submit:</Text>
            <TextInput
              returnKeyType="go"
              defaultValue="http://www.posttestserver.com/post.php"
              onSubmitEditing={event => {
                this.submit(event.nativeEvent.text);
              }}
              style={[
                styles.textInput,
                {
                  color: theme.LabelColor,
                },
              ]}
            />
            {responseURL}
            {responseHeaders}
            {response}
          </>
        )}
      </RNTesterThemeContext.Consumer>
    );
  }
}

const styles = StyleSheet.create({
  textInput: {
    flex: 1,
    borderRadius: 3,
    borderColor: 'grey',
    borderWidth: 1,
    height: Platform.OS === 'android' ? 44 : 30,
    paddingLeft: 8,
  },
  label: {
    flex: 1,
    color: '#aaa',
    fontWeight: '500',
    height: 20,
  },
  textOutput: {
    flex: 1,
    fontSize: 17,
    borderRadius: 3,
    borderColor: 'grey',
    borderWidth: 1,
    height: 200,
    paddingLeft: 8,
  },
});

module.exports = XHRExampleFetch;
