/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import {DeviceEventEmitter} from 'react-native';

const WebSocket = require('../WebSocket').default;

describe('WebSocket', function () {
  it('should have connection lifecycle constants defined on the class', () => {
    expect(WebSocket.CONNECTING).toEqual(0);
  });

  it('should have connection lifecycle constants defined on the instance', () => {
    expect(new WebSocket('wss://echo.websocket.org').CONNECTING).toEqual(0);
  });

  it('should ignore a queued open event after close() while connecting', () => {
    const socket = new WebSocket('wss://echo.websocket.org');
    // $FlowFixMe[prop-missing]
    const id = socket._socketId;
    const events: Array<string> = [];
    socket.onopen = () => {
      events.push('open');
    };
    socket.onclose = () => {
      events.push('close');
    };

    socket.close();
    DeviceEventEmitter.emit('websocketOpen', {id, protocol: ''});
    expect(socket.readyState).toEqual(WebSocket.CLOSING);
    expect(events).toEqual([]);

    DeviceEventEmitter.emit('websocketClosed', {id, code: 1000, reason: ''});
    expect(socket.readyState).toEqual(WebSocket.CLOSED);
    expect(events).toEqual(['close']);
  });

  it('should not dispatch message events after close() is called', () => {
    const socket = new WebSocket('wss://echo.websocket.org');
    // $FlowFixMe[prop-missing]
    const id = socket._socketId;
    const messages: Array<unknown> = [];
    socket.onmessage = event => {
      // $FlowFixMe[prop-missing]
      messages.push(event.data);
    };

    DeviceEventEmitter.emit('websocketOpen', {id, protocol: ''});
    DeviceEventEmitter.emit('websocketMessage', {type: 'text', id, data: 'a'});

    socket.close();
    DeviceEventEmitter.emit('websocketMessage', {type: 'text', id, data: 'b'});

    expect(socket.readyState).toEqual(WebSocket.CLOSING);
    expect(messages).toEqual(['a']);
  });
});
