/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {EventCallback} from '../../src/private/webapis/dom/events/EventTarget';
import type {BlobData} from '../Blob/BlobTypes';
import type {EventSubscription} from '../vendor/emitter/EventEmitter';

import Event from '../../src/private/webapis/dom/events/Event';
import {
  getEventHandlerAttribute,
  setEventHandlerAttribute,
} from '../../src/private/webapis/dom/events/EventHandlerAttributes';
import EventTarget from '../../src/private/webapis/dom/events/EventTarget';
import MessageEvent from '../../src/private/webapis/html/events/MessageEvent';
import CloseEvent from '../../src/private/webapis/websockets/events/CloseEvent';
import Blob from '../Blob/Blob';
import BlobManager from '../Blob/BlobManager';
import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import binaryToBase64 from '../Utilities/binaryToBase64';
import Platform from '../Utilities/Platform';
import NativeWebSocketModule from './NativeWebSocketModule';
import base64 from 'base64-js';
import invariant from 'invariant';

type ArrayBufferView =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | DataView;

type BinaryType = 'blob' | 'arraybuffer';

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

const CLOSE_NORMAL = 1000;

// Abnormal closure where no code is provided in a control frame
// https://www.rfc-editor.org/rfc/rfc6455.html#section-7.1.5
const CLOSE_ABNORMAL = 1006;

let nextWebSocketId = 0;

type WebSocketEventDefinitions = {
  websocketOpen: [{id: number, protocol: string}],
  websocketClosed: [{id: number, code: number, reason: string}],
  websocketMessage: [
    | {type: 'binary', id: number, data: string}
    | {type: 'text', id: number, data: string}
    | {type: 'blob', id: number, data: BlobData},
  ],
  websocketFailed: [{id: number, message: string}],
};

/**
 * Browser-compatible WebSockets implementation.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
 * See https://github.com/websockets/ws
 */
class WebSocket extends EventTarget {
  static CONNECTING: number = CONNECTING;
  static OPEN: number = OPEN;
  static CLOSING: number = CLOSING;
  static CLOSED: number = CLOSED;

  CONNECTING: number = CONNECTING;
  OPEN: number = OPEN;
  CLOSING: number = CLOSING;
  CLOSED: number = CLOSED;

  _socketId: number;
  _eventEmitter: NativeEventEmitter<WebSocketEventDefinitions>;
  _subscriptions: Array<EventSubscription>;
  _binaryType: ?BinaryType;

  bufferedAmount: number;
  extension: ?string;
  protocol: ?string;
  readyState: number = CONNECTING;
  url: ?string;

  constructor(
    url: string,
    protocols: ?string | ?Array<string>,
    options: ?{headers?: {origin?: string, ...}, ...},
  ) {
    super();
    this.url = url;
    if (typeof protocols === 'string') {
      protocols = [protocols];
    }

    const {headers = {}, ...unrecognized} = options || {};

    // Preserve deprecated backwards compatibility for the 'origin' option
    // $FlowFixMe[prop-missing]
    if (unrecognized && typeof unrecognized.origin === 'string') {
      console.warn(
        'Specifying `origin` as a WebSocket connection option is deprecated. Include it under `headers` instead.',
      );
      /* $FlowFixMe[prop-missing] (>=0.54.0 site=react_native_fb,react_native_
       * oss) This comment suppresses an error found when Flow v0.54 was
       * deployed. To see the error delete this comment and run Flow. */
      headers.origin = unrecognized.origin;
      /* $FlowFixMe[prop-missing] (>=0.54.0 site=react_native_fb,react_native_
       * oss) This comment suppresses an error found when Flow v0.54 was
       * deployed. To see the error delete this comment and run Flow. */
      delete unrecognized.origin;
    }

    // Warn about and discard anything else
    if (Object.keys(unrecognized).length > 0) {
      console.warn(
        'Unrecognized WebSocket connection option(s) `' +
          Object.keys(unrecognized).join('`, `') +
          '`. ' +
          'Did you mean to put these under `headers`?',
      );
    }

    if (!Array.isArray(protocols)) {
      protocols = null;
    }

    this._eventEmitter = new NativeEventEmitter(
      // T88715063: NativeEventEmitter only used this parameter on iOS. Now it uses it on all platforms, so this code was modified automatically to preserve its behavior
      // If you want to use the native module on other platforms, please remove this condition and test its behavior
      Platform.OS !== 'ios' ? null : NativeWebSocketModule,
    );
    this._socketId = nextWebSocketId++;
    this._registerEvents();
    const devToolsRequestId =
      global.__NETWORK_REPORTER__?.createDevToolsRequestId();
    NativeWebSocketModule.connect(
      url,
      protocols,
      {headers, unstable_devToolsRequestId: devToolsRequestId},
      this._socketId,
    );
  }

  get binaryType(): ?BinaryType {
    return this._binaryType;
  }

  set binaryType(binaryType: BinaryType): void {
    if (binaryType !== 'blob' && binaryType !== 'arraybuffer') {
      throw new Error("binaryType must be either 'blob' or 'arraybuffer'");
    }
    if (this._binaryType === 'blob' || binaryType === 'blob') {
      invariant(
        BlobManager.isAvailable,
        'Native module BlobModule is required for blob support',
      );
      if (binaryType === 'blob') {
        BlobManager.addWebSocketHandler(this._socketId);
      } else {
        BlobManager.removeWebSocketHandler(this._socketId);
      }
    }
    this._binaryType = binaryType;
  }

  close(code?: number, reason?: string): void {
    if (this.readyState === this.CLOSING || this.readyState === this.CLOSED) {
      return;
    }

    this.readyState = this.CLOSING;
    this._close(code, reason);
  }

  send(data: string | ArrayBuffer | ArrayBufferView | Blob): void {
    if (this.readyState === this.CONNECTING) {
      throw new Error('INVALID_STATE_ERR');
    }

    if (data instanceof Blob) {
      invariant(
        BlobManager.isAvailable,
        'Native module BlobModule is required for blob support',
      );
      BlobManager.sendOverSocket(data, this._socketId);
      return;
    }

    if (typeof data === 'string') {
      NativeWebSocketModule.send(data, this._socketId);
      return;
    }

    if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
      NativeWebSocketModule.sendBinary(binaryToBase64(data), this._socketId);
      return;
    }

    throw new Error('Unsupported data type');
  }

  ping(): void {
    if (this.readyState === this.CONNECTING) {
      throw new Error('INVALID_STATE_ERR');
    }

    NativeWebSocketModule.ping(this._socketId);
  }

  _close(code?: number, reason?: string): void {
    // See https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
    const statusCode = typeof code === 'number' ? code : CLOSE_NORMAL;
    const closeReason = typeof reason === 'string' ? reason : '';
    NativeWebSocketModule.close(statusCode, closeReason, this._socketId);

    if (BlobManager.isAvailable && this._binaryType === 'blob') {
      BlobManager.removeWebSocketHandler(this._socketId);
    }
  }

  _unregisterEvents(): void {
    this._subscriptions.forEach(e => e.remove());
    this._subscriptions = [];
  }

  _registerEvents(): void {
    this._subscriptions = [
      this._eventEmitter.addListener('websocketMessage', ev => {
        if (ev.id !== this._socketId) {
          return;
        }
        let data: Blob | BlobData | ArrayBuffer | string = ev.data;
        switch (ev.type) {
          case 'binary':
            data = base64.toByteArray(ev.data).buffer;
            break;
          case 'blob':
            data = BlobManager.createFromOptions(ev.data);
            break;
        }
        this.dispatchEvent(new MessageEvent('message', {data}));
      }),
      this._eventEmitter.addListener('websocketOpen', ev => {
        if (ev.id !== this._socketId) {
          return;
        }
        this.readyState = this.OPEN;
        this.protocol = ev.protocol;
        this.dispatchEvent(new Event('open'));
      }),
      this._eventEmitter.addListener('websocketClosed', ev => {
        if (ev.id !== this._socketId) {
          return;
        }
        this.readyState = this.CLOSED;
        this.dispatchEvent(
          new CloseEvent('close', {
            code: ev.code,
            reason: ev.reason,
            // TODO: missing `wasClean` (exposed on iOS as `clean` but missing on Android)
          }),
        );
        this._unregisterEvents();
        this.close();
      }),
      this._eventEmitter.addListener('websocketFailed', ev => {
        if (ev.id !== this._socketId) {
          return;
        }
        this.readyState = this.CLOSED;
        this.dispatchEvent(new Event('error'));
        this.dispatchEvent(
          new CloseEvent('close', {
            code: CLOSE_ABNORMAL,
            reason: ev.message,
            // TODO: Expose `wasClean`
          }),
        );
        this._unregisterEvents();
        this.close();
      }),
    ];
  }

  get onclose(): EventCallback | null {
    return getEventHandlerAttribute(this, 'close');
  }

  set onclose(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'close', listener);
  }

  get onerror(): EventCallback | null {
    return getEventHandlerAttribute(this, 'error');
  }

  set onerror(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'error', listener);
  }

  get onmessage(): EventCallback | null {
    return getEventHandlerAttribute(this, 'message');
  }

  set onmessage(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'message', listener);
  }

  get onopen(): EventCallback | null {
    return getEventHandlerAttribute(this, 'open');
  }

  set onopen(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'open', listener);
  }
}

export default WebSocket;
