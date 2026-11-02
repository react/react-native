/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import CloseEvent from '../../../src/private/webapis/websockets/events/CloseEvent';
import RCTDeviceEventEmitter from '../../EventEmitter/RCTDeviceEventEmitter';
import NativeWebSocketModule from '../NativeWebSocketModule';
import WebSocket from '../WebSocket';

describe('WebSocket connection failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(['ws://localhost:0/', 'ws://localhost:4000/a|b'])(
    'dispatches error and abnormal close for a native rejection of %s',
    url => {
      const connect = jest.spyOn(NativeWebSocketModule, 'connect');
      const socket = new WebSocket(url);
      const socketId = connect.mock.calls[0][3];
      const events = [];
      socket.onerror = () => {
        events.push(['error', socket.readyState]);
      };
      socket.onclose = event => {
        if (!(event instanceof CloseEvent)) {
          throw new Error('Expected a CloseEvent');
        }
        events.push(['close', socket.readyState, event.code, event.reason]);
      };

      RCTDeviceEventEmitter.emit('websocketFailed', {
        id: socketId + 1,
        message: 'unrelated socket',
      });
      expect(events).toEqual([]);
      expect(socket.readyState).toBe(WebSocket.CONNECTING);

      RCTDeviceEventEmitter.emit('websocketFailed', {
        id: socketId,
        message: 'Invalid WebSocket URL',
      });

      expect(events).toEqual([
        ['error', WebSocket.CLOSED],
        ['close', WebSocket.CLOSED, 1006, 'Invalid WebSocket URL'],
      ]);

      RCTDeviceEventEmitter.emit('websocketFailed', {
        id: socketId,
        message: 'duplicate failure',
      });
      expect(events).toHaveLength(2);
      expect(NativeWebSocketModule.close).not.toHaveBeenCalled();
    },
  );
});
