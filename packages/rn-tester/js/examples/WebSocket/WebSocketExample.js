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
  Image,
  PixelRatio,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const DEFAULT_WS_URL = 'ws://localhost:5555/';
const DEFAULT_HTTP_URL = 'http://localhost:5556/';
const WS_EVENTS = ['close', 'error', 'message', 'open'];
const WS_STATES = [
  /* 0 */ 'CONNECTING',
  /* 1 */ 'OPEN',
  /* 2 */ 'CLOSING',
  /* 3 */ 'CLOSED',
];

class Button extends React.Component<
  Readonly<{
    disabled: boolean,
    label: string,
    onPress: () => void,
  }>,
> {
  render(): React.Node {
    const label = (
      <RNTesterText style={styles.buttonLabel}>{this.props.label}</RNTesterText>
    );
    if (this.props.disabled) {
      return (
        <View style={[styles.button, styles.disabledButton]}>{label}</View>
      );
    }
    return (
      <TouchableOpacity onPress={this.props.onPress} style={styles.button}>
        {label}
      </TouchableOpacity>
    );
  }
}

class Row extends React.Component<
  Readonly<{
    children?: React.Node,
    label: string,
    value?: ?string,
  }>,
> {
  render(): React.Node {
    return (
      <View style={styles.row}>
        <RNTesterText>{this.props.label}</RNTesterText>
        {this.props.value == null ? null : (
          <RNTesterText>{this.props.value}</RNTesterText>
        )}
        {this.props.children}
      </View>
    );
  }
}

type WebSocketImageState = Readonly<{
  blob: ?Blob,
}>;

class WebSocketImage extends React.Component<
  Readonly<{url: string}>,
  WebSocketImageState,
> {
  ws: ?WebSocket = null;
  state: WebSocketImageState = {blob: null};

  componentDidMount() {
    let ws = (this.ws = new WebSocket(this.props.url));
    ws.binaryType = 'blob';
    ws.onmessage = event => {
      if (event.data instanceof Blob) {
        const blob = event.data;
        if (this.state.blob) {
          this.state.blob.close();
        }
        this.setState({blob});
      }
    };
    ws.onopen = event => {
      ws.send('getImage');
    };
  }

  componentUnmount() {
    if (this.state.blob) {
      this.state.blob.close();
    }
    this.ws && this.ws.close();
  }

  render(): React.Node {
    if (!this.state.blob) {
      return <View />;
    }
    return (
      <Image
        source={{uri: URL.createObjectURL(this.state.blob)}}
        style={{width: 50, height: 50}}
      />
    );
  }
}

function showValue(value: $FlowFixMe): string {
  if (value === undefined || value === null) {
    return '(no value)';
  }
  if (
    typeof ArrayBuffer !== 'undefined' &&
    typeof Uint8Array !== 'undefined' &&
    value instanceof ArrayBuffer
  ) {
    return `ArrayBuffer {${String(Array.from(new Uint8Array(value)))}}`;
  }
  return value;
}

type WebSocketExampleState = {
  url: string,
  httpUrl: string,
  fetchStatus: ?string,
  socket: ?WebSocket,
  socketState: ?number,
  lastSocketEvent: ?string,
  lastMessage: ?string | ?ArrayBuffer,
  outgoingMessage: string,
};

class WebSocketExample extends React.Component<
  Readonly<{}>,
  WebSocketExampleState,
> {
  state: WebSocketExampleState = {
    url: DEFAULT_WS_URL,
    httpUrl: DEFAULT_HTTP_URL,
    fetchStatus: null,
    socket: null,
    socketState: null,
    lastSocketEvent: null,
    lastMessage: null,
    outgoingMessage: '',
  };

  _connect = () => {
    const socket = new WebSocket(this.state.url);
    WS_EVENTS.forEach(ev => socket.addEventListener(ev, this._onSocketEvent));
    this.setState({
      socket,
      socketState: socket.readyState,
    });
  };

  _disconnect = () => {
    if (!this.state.socket) {
      return;
    }
    this.state.socket.close();
  };

  _onSocketEvent = (event: MessageEvent) => {
    const state: Partial<WebSocketExampleState> = {
      // $FlowFixMe[prop-missing]
      socketState: event.target.readyState,
      lastSocketEvent: event.type,
    };
    if (event.type === 'message') {
      // $FlowFixMe[incompatible-type]
      state.lastMessage = event.data;
    }
    this.setState(state);
  };

  _sendText = () => {
    if (!this.state.socket) {
      return;
    }
    this.state.socket.send(this.state.outgoingMessage);
    this.setState({outgoingMessage: ''});
  };

  _sendHttp = () => {
    this.setState({
      fetchStatus: 'fetching',
    });
    void fetch(this.state.httpUrl).then(response => {
      if (response.status >= 200 && response.status < 400) {
        this.setState({
          fetchStatus: 'OK',
        });
      }
    });
  };

  _sendBinary = () => {
    if (
      !this.state.socket ||
      typeof ArrayBuffer === 'undefined' ||
      typeof Uint8Array === 'undefined'
    ) {
      return;
    }
    const {outgoingMessage, socket} = this.state;
    const buffer = new Uint8Array(outgoingMessage.length);
    for (let i = 0; i < outgoingMessage.length; i++) {
      buffer[i] = outgoingMessage.charCodeAt(i);
    }
    socket.send(buffer);
    this.setState({outgoingMessage: ''});
  };

  render(): React.Node {
    const socketState = WS_STATES[this.state.socketState ?? -1];
    const canConnect =
      !this.state.socket || this.state.socket.readyState >= WebSocket.CLOSING;
    const canSend = socketState === 'OPEN';
    return (
      <ScrollView style={styles.container}>
        <View style={styles.note}>
          <RNTesterText>To start the WS test server:</RNTesterText>
          <RNTesterText style={styles.monospace}>
            ./RNTester/js/examples/WebSocket/websocket_test_server.js
          </RNTesterText>
        </View>
        <Row label="Current WebSocket state" value={showValue(socketState)} />
        <Row
          label="Last WebSocket event"
          value={showValue(this.state.lastSocketEvent)}
        />
        <Row
          label="Last message received"
          value={showValue(this.state.lastMessage)}
        />
        <Row label="Last image received">
          {canSend ? <WebSocketImage url={this.state.url} /> : null}
        </Row>
        <TextInput
          style={styles.textInput}
          autoCorrect={false}
          placeholder="Server URL..."
          onChangeText={url => this.setState({url})}
          value={this.state.url}
        />
        <View style={styles.buttonRow}>
          <Button
            onPress={this._connect}
            label="Connect"
            disabled={!canConnect}
          />
          <Button
            onPress={this._disconnect}
            label="Disconnect"
            disabled={canConnect}
          />
        </View>
        <TextInput
          style={styles.textInput}
          autoCorrect={false}
          placeholder="Type message here..."
          onChangeText={outgoingMessage => this.setState({outgoingMessage})}
          value={this.state.outgoingMessage}
        />
        <View style={styles.buttonRow}>
          <Button
            onPress={this._sendText}
            label="Send as text"
            disabled={!canSend}
          />
          <Button
            onPress={this._sendBinary}
            label="Send as binary"
            disabled={!canSend}
          />
        </View>
        <View style={styles.note}>
          <RNTesterText>To start the HTTP test server:</RNTesterText>
          <RNTesterText style={styles.monospace}>
            ./RNTester/js/examples/WebSocket/http_test_server.js
          </RNTesterText>
        </View>
        <TextInput
          style={styles.textInput}
          autoCorrect={false}
          placeholder="HTTP URL..."
          onChangeText={httpUrl => this.setState({httpUrl})}
          value={this.state.httpUrl}
        />
        <View style={styles.buttonRow}>
          <Button
            onPress={this._sendHttp}
            label="Send HTTP request to set cookie"
            disabled={this.state.fetchStatus === 'fetching'}
          />
        </View>
        <View style={styles.note}>
          <RNTesterText>
            {this.state.fetchStatus === 'OK'
              ? 'Done. Check your WS server console to see if the next WS requests include the cookie (should be "wstest=OK")'
              : '-'}
          </RNTesterText>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  note: {
    padding: 8,
    margin: 4,
  },
  monospace: {
    fontFamily: 'courier',
    fontSize: 11,
  },
  row: {
    height: 40,
    padding: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1 / PixelRatio.get(),
    borderColor: 'grey',
  },
  button: {
    margin: 8,
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'blue',
    alignSelf: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonLabel: {
    color: 'white',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  textInput: {
    height: 40,
    backgroundColor: 'white',
    margin: 8,
    padding: 8,
  },
});

exports.title = 'WebSocket';
exports.category = 'Basic';
exports.description = 'WebSocket API';
exports.examples = [
  {
    title: 'Basic websocket',
    render(): React.Node {
      return <WebSocketExample />;
    },
  },
] as Array<RNTesterModuleExample>;
