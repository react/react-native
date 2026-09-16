/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import Platform from '../Utilities/Platform';
import NativeWebSocketModule from './NativeWebSocketModule';
import base64 from 'base64-js';

const originalRCTWebSocketConnect = NativeWebSocketModule.connect;
const originalRCTWebSocketSend = NativeWebSocketModule.send;
const originalRCTWebSocketSendBinary = NativeWebSocketModule.sendBinary;
const originalRCTWebSocketClose = NativeWebSocketModule.close;

let eventEmitter;
let subscriptions;

let closeCallback;
let sendCallback;
let connectCallback;
let onOpenCallback;
let onMessageCallback;
let onErrorCallback;
let onCloseCallback;

let isInterceptorEnabled = false;

/**
 * A network interceptor which monkey-patches RCTWebSocketModule methods
 * to gather all websocket network events.
 *
 * @deprecated Since React Native 0.84
 */
const WebSocketInterceptor = {
  /**
   * Invoked when RCTWebSocketModule.close(...) is called.
   * The callback is invoked with the following parameters:
   * - `'code'` - The status code explaining why the connection was closed,
   * - `'reason'` - The reason explaining why the connection was closed,
   * - `'socketId'` - The id of the socket.
   */
  setCloseCallback(callback: ?(number | null, string | null, number) => void) {
    closeCallback = callback;
  },

  /**
   * Invoked when RCTWebSocketModule.send(...) or sendBinary(...) is called.
   * The callback is invoked with the following parameters:
   * - `'data'` - The data sent,
   * - `'socketId'` - The id of the socket.
   */
  setSendCallback(callback: ?(string | ArrayBuffer, number) => void) {
    sendCallback = callback;
  },

  /**
   * Invoked when RCTWebSocketModule.connect(...) is called.
   * The callback is invoked with the following parameters:
   * - `'url'` - The url of the socket,
   * - `'protocols'` - The protocols of the socket,
   * - `'options'` - The options of the socket,
   * - `'socketId'` - The id of the socket.
   */
  setConnectCallback(
    callback: ?(string, Array<string> | null, Array<string>, number) => void,
  ) {
    connectCallback = callback;
  },

  /**
   * Invoked when event "websocketOpen" happens.
   * The callback is invoked with the following parameters:
   * - `'socketId'` - The id of the socket.
   */
  setOnOpenCallback(callback: ?(number) => void) {
    onOpenCallback = callback;
  },

  /**
   * Invoked when event "websocketMessage" happens.
   * The callback is invoked with the following parameters:
   * - `'data'` - The data received,
   * - `'socketId'` - The id of the socket.
   */
  setOnMessageCallback(callback: ?(string | ArrayBuffer, number) => void) {
    onMessageCallback = callback;
  },

  /**
   * Invoked when event "websocketFailed" happens.
   * The callback is invoked with the following parameters:
   * - `'message'` - The error message,
   * - `'socketId'` - The id of the socket.
   */
  setOnErrorCallback(callback: ?({message: string}, number) => void) {
    onErrorCallback = callback;
  },

  /**
   * Invoked when event "websocketClosed" happens.
   * The callback is invoked with the following parameters:
   * - `'code'` - The status code explaining why the connection was closed,
   * - `'reason'` - The reason explaining why the connection was closed,
   * - `'socketId'` - The id of the socket.
   */
  setOnCloseCallback(
    callback: ?({code: number, reason: ?string}, number) => void,
  ) {
    onCloseCallback = callback;
  },

  isInterceptorEnabled(): boolean {
    return isInterceptorEnabled;
  },

  _unregisterEvents() {
    subscriptions.forEach(e => e.remove());
    subscriptions = [];
  },

  /**
   * Add listeners to the RCTWebSocketModule events to intercept them.
   */
  _registerEvents() {
    subscriptions = [
      // $FlowFixMe[incompatible-type]
      eventEmitter.addListener('websocketMessage', ev => {
        if (onMessageCallback) {
          onMessageCallback(
            ev.type === 'binary'
              ? WebSocketInterceptor._arrayBufferToString(ev.data)
              : ev.data,
            ev.id,
          );
        }
      }),
      // $FlowFixMe[incompatible-type]
      eventEmitter.addListener('websocketOpen', ev => {
        if (onOpenCallback) {
          onOpenCallback(ev.id);
        }
      }),
      // $FlowFixMe[incompatible-type]
      eventEmitter.addListener('websocketClosed', ev => {
        if (onCloseCallback) {
          onCloseCallback({code: ev.code, reason: ev.reason}, ev.id);
        }
      }),
      // $FlowFixMe[incompatible-type]
      eventEmitter.addListener('websocketFailed', ev => {
        if (onErrorCallback) {
          onErrorCallback({message: ev.message}, ev.id);
        }
      }),
    ];
  },

  enableInterception() {
    if (isInterceptorEnabled) {
      return;
    }
    // $FlowFixMe[underconstrained-implicit-instantiation]
    eventEmitter = new NativeEventEmitter(
      // T88715063: NativeEventEmitter only used this parameter on iOS. Now it uses it on all platforms, so this code was modified automatically to preserve its behavior
      // If you want to use the native module on other platforms, please remove this condition and test its behavior
      Platform.OS !== 'ios' ? null : NativeWebSocketModule,
    );
    WebSocketInterceptor._registerEvents();

    // Override `connect` method for all RCTWebSocketModule requests
    // to intercept the request url, protocols, options and socketId,
    // then pass them through the `connectCallback`.
    // $FlowFixMe[cannot-write]
    // $FlowFixMe[missing-this-annot]
    NativeWebSocketModule.connect = function (
      url: string,
      protocols: Array<string> | null,
      options: $FlowFixMe,
      socketId: number,
    ) {
      if (connectCallback) {
        connectCallback(url, protocols, options, socketId);
      }
      originalRCTWebSocketConnect.apply(this, arguments);
    };

    // Override `send` method for all RCTWebSocketModule requests to intercept
    // the data sent, then pass them through the `sendCallback`.
    // $FlowFixMe[cannot-write]
    // $FlowFixMe[missing-this-annot]
    NativeWebSocketModule.send = function (data, socketId) {
      if (sendCallback) {
        sendCallback(data, socketId);
      }
      originalRCTWebSocketSend.apply(this, arguments);
    };

    // Override `sendBinary` method for all RCTWebSocketModule requests to
    // intercept the data sent, then pass them through the `sendCallback`.
    // $FlowFixMe[cannot-write]
    // $FlowFixMe[missing-this-annot]
    NativeWebSocketModule.sendBinary = function (data, socketId) {
      if (sendCallback) {
        sendCallback(WebSocketInterceptor._arrayBufferToString(data), socketId);
      }
      originalRCTWebSocketSendBinary.apply(this, arguments);
    };

    // Override `close` method for all RCTWebSocketModule requests to intercept
    // the close information, then pass them through the `closeCallback`.
    // $FlowFixMe[cannot-write]
    // $FlowFixMe[missing-this-annot]
    NativeWebSocketModule.close = function () {
      if (closeCallback) {
        if (arguments.length === 3) {
          closeCallback(arguments[0], arguments[1], arguments[2]);
        } else {
          closeCallback(null, null, arguments[0]);
        }
      }
      originalRCTWebSocketClose.apply(this, arguments);
    };

    isInterceptorEnabled = true;
  },

  _arrayBufferToString(data: string): ArrayBuffer | string {
    const value = base64.toByteArray(data).buffer;
    /* $FlowFixMe[invalid-compare] Error discovered during Constant Condition
     * roll out. See https://fburl.com/workplace/5whu3i34. */
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
    // $FlowFixMe[incompatible-type]
    return value;
  },

  // Unpatch RCTWebSocketModule methods and remove the callbacks.
  disableInterception() {
    if (!isInterceptorEnabled) {
      return;
    }
    isInterceptorEnabled = false;
    // $FlowFixMe[cannot-write]
    NativeWebSocketModule.send = originalRCTWebSocketSend;
    // $FlowFixMe[cannot-write]
    NativeWebSocketModule.sendBinary = originalRCTWebSocketSendBinary;
    // $FlowFixMe[cannot-write]
    NativeWebSocketModule.close = originalRCTWebSocketClose;
    // $FlowFixMe[cannot-write]
    NativeWebSocketModule.connect = originalRCTWebSocketConnect;

    connectCallback = null;
    closeCallback = null;
    sendCallback = null;
    onOpenCallback = null;
    onMessageCallback = null;
    onCloseCallback = null;
    onErrorCallback = null;

    WebSocketInterceptor._unregisterEvents();
  },
};

export default WebSocketInterceptor;
