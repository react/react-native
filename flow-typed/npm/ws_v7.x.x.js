/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

declare type ws$PerMessageDeflateOptions = {
  serverNoContextTakeover?: boolean,
  clientNoContextTakeover?: boolean,
  serverMaxWindowBits?: boolean | number,
  clientMaxWindowBits?: boolean | number,
  zlibDeflateOptions?: zlib$options,
  zlibInflateOptions?: zlib$options,
  threshold?: number,
  concurrencyLimit?: number,
  isServer?: boolean,
  maxPayload?: number,
};

/* $FlowFixMe[incompatible-type] - Found with Flow v0.143.1 upgrade
 * "on" definition failing with string is incompatible with string literal */
declare class ws$WebSocketServer extends events$EventEmitter {
  /**
   * Create a `WebSocketServer` instance.
   */
  constructor(
    options: {
      backlog?: number,
      clientTracking?: boolean,
      handleProtocols?: () => unknown,
      host?: string,
      maxPayload?: number,
      noServer?: boolean,
      path?: string,
      perMessageDeflate?: boolean | ws$PerMessageDeflateOptions,
      port?: number,
      server?: http$Server | https$Server,
      verifyClient?: () => unknown,
    },
    callback?: () => unknown,
  ): this;

  /**
   * Emitted when the server closes.
   */
  on(event: 'close', v1: () => unknown): this;

  /**
   * Emitted when the handshake is complete.
   */
  on(
    event: 'connection',
    v1: (socket: ws$WebSocket, request: http$IncomingMessage<>) => unknown,
  ): this;

  /**
   * Emitted when an error occurs on the underlying server.
   */
  on(event: 'error', v1: (error: Error) => unknown): this;

  /**
   * Emitted before the response headers are written to the socket as part of
   * the handshake.
   */
  on(
    event: 'headers',
    v1: (headers: Array<string>, request: http$IncomingMessage<>) => unknown,
  ): this;

  /**
   * Emitted when the underlying server has been bound.
   */
  on(event: 'listening', v1: () => unknown): this;

  /**
   * Returns the bound address, the address family name, and port of the server
   * as reported by the operating system if listening on an IP socket.
   * If the server is listening on a pipe or UNIX domain socket, the name is
   * returned as a string.
   */
  address(): null | string | {port?: number, family?: string, address?: string};

  /**
   * A set that stores all connected clients. Please note that this property is
   * only added when the `clientTracking` is truthy.
   */
  clients: Set<ws$WebSocket>;

  /**
   * Close the server.
   */
  close(callback?: () => unknown): void;

  /**
   * Handle a HTTP Upgrade request.
   */
  handleUpgrade(
    request: http$IncomingMessage<>,
    socket: net$Socket,
    head: Buffer,
    callback: (v: ?ws$WebSocket) => unknown,
  ): void;

  /**
   * See if a given request should be handled by this server instance.
   */
  shouldHandle(request: http$IncomingMessage<>): boolean;
}

declare type ws$WebSocketOptions = {
  followRedirects?: boolean,
  handshakeTimeout?: number,
  maxRedirects?: number,
  perMessageDeflate?: boolean | ws$PerMessageDeflateOptions,
  protocolVersion?: number,
  origin?: string,
  maxPayload?: number,
  ...requestOptions,
  agent?: boolean | http$Agent<> | http$Agent<tls$TLSSocket>,
  createConnection?:
    | ((options: net$connectOptions, callback?: () => unknown) => net$Socket)
    | ((
        options: tls$connectOptions,
        callback?: () => unknown,
      ) => tls$TLSSocket),
  rejectUnauthorized?: boolean,
};

declare type ws$CloseListener = (code: number, reason: string) => unknown;
declare type ws$ErrorListener = (error: Error) => unknown;
declare type ws$MessageListener = (
  data: string | Buffer | ArrayBuffer | Array<Buffer>,
  isBinary: boolean,
) => unknown;
declare type ws$OpenListener = () => unknown;
declare type ws$PingListener = (v: Buffer) => unknown;
declare type ws$PongListener = (v: Buffer) => unknown;
declare type ws$UnexpectedResponseListener = (
  request: http$ClientRequest<>,
  response: http$IncomingMessage<>,
) => unknown;
declare type ws$UpgradeListener = (response: http$IncomingMessage<>) => unknown;

/* $FlowFixMe[incompatible-type] - Found with Flow v0.143.1 upgrade
 * "on" definition failing with string is incompatible with string literal */
declare class ws$WebSocket extends events$EventEmitter {
  static Server: typeof ws$WebSocketServer;

  static createWebSocketStream: (
    WebSocket: ws$WebSocket,
    options?: duplexStreamOptions,
  ) => stream$Duplex;

  static CONNECTING: number;
  static OPEN: number;
  static CLOSING: number;
  static CLOSED: number;

  /**
   * Create a `WebSocket` instance.
   */
  constructor(
    address: string | URL,
    protocols?: string | Array<string>,
    options?: ws$WebSocketOptions,
  ): this;
  constructor(address: string | URL, options: ws$WebSocketOptions): this;

  /*
   * Emitted when the connection is closed.
   */
  on(v0: 'close', v1: ws$CloseListener): this;

  /*
   * Emitted when an error occurs.
   */
  on(v0: 'error', v1: ws$ErrorListener): this;

  /*
   * Emitted when a message is received from the server.
   */
  on(v0: 'message', v1: ws$MessageListener): this;

  /*
   * Emitted when the connection is established.
   */
  on(v0: 'open', v1: ws$OpenListener): this;

  /*
   * Emitted when a ping is received from the server.
   */
  on(v0: 'ping', v1: ws$PingListener): this;

  /*
   * Emitted when a pong is received from the server.
   */
  on(v0: 'pong', v1: ws$PongListener): this;

  /*
   * Emitted when the server response is not the expected one,
   * for example a 401 response.
   */
  on(v0: 'unexpected-response', v1: ws$UnexpectedResponseListener): this;

  /*
   * Emitted when response headers are received from the server as part of the
   * handshake.
   */
  on(v0: 'upgrade', v1: ws$UpgradeListener): this;

  /**
   * Register an event listener emulating the `EventTarget` interface.
   */
  addEventListener(
    type: 'close',
    listener: ws$CloseListener,
    options?: {once?: boolean},
  ): this;
  addEventListener(
    type: 'error',
    listener: ws$ErrorListener,
    options?: {once?: boolean},
  ): this;
  addEventListener(
    type: 'message',
    listener: ws$MessageListener,
    options?: {once?: boolean},
  ): this;
  addEventListener(
    type: 'open',
    listener: ws$OpenListener,
    options?: {once?: boolean},
  ): this;
  addEventListener(
    type: 'ping',
    listener: ws$PingListener,
    options?: {once?: boolean},
  ): this;
  addEventListener(
    type: 'pong',
    listener: ws$PongListener,
    options?: {once?: boolean},
  ): this;
  addEventListener(
    type: 'unexpected-response',
    v1: ws$UnexpectedResponseListener,
    options?: {once?: boolean},
  ): this;
  addEventListener(
    type: 'upgrade',
    listener: ws$UpgradeListener,
    options?: {once?: boolean},
  ): this;

  /**
   * A string indicating the type of binary data being transmitted by the
   * connection.
   */
  binaryType: string;

  /**
   * The number of bytes of data that have been queued using calls to send()
   * but not yet transmitted to the network.
   */
  bufferedAmount: number;

  /**
   * Initiate a closing handshake.
   */
  close(code?: number, reason?: string): void;

  /**
   * The negotiated extensions.
   */
  extensions: string;

  /**
   * Send a ping.
   */
  ping(data?: any, mask?: boolean, callback?: () => unknown): void;
  ping(data: any, callback: () => unknown): void;
  ping(callback: () => unknown): void;

  /**
   * Send a pong.
   */
  pong(data?: any, mask?: boolean, callback?: () => unknown): void;
  pong(data: any, callback: () => unknown): void;
  pong(callback: () => unknown): void;

  /**
   * The subprotocol selected by the server.
   */
  protocol: string;

  /**
   * The current state of the connection.
   */
  readyState: number;

  /**
   * Removes an event listener emulating the `EventTarget` interface.
   */
  removeEventListener(type: 'close', listener: ws$CloseListener): this;
  removeEventListener(type: 'error', listener: ws$ErrorListener): this;
  removeEventListener(type: 'message', listener: ws$MessageListener): this;
  removeEventListener(type: 'open', listener: ws$OpenListener): this;
  removeEventListener(type: 'ping', listener: ws$PingListener): this;
  removeEventListener(type: 'pong', listener: ws$PongListener): this;
  removeEventListener(
    type: 'unexpected-response',
    v1: ws$UnexpectedResponseListener,
  ): this;
  removeEventListener(type: 'upgrade', listener: ws$UpgradeListener): this;

  /**
   * Send a data message.
   */
  send(
    data?: any,
    options?: {
      compress?: boolean,
      binary?: boolean,
      mask?: boolean,
      fin?: boolean,
    },
    callback?: () => unknown,
  ): void;
  send(data: any, callback: () => unknown): void;

  /**
   * Forcibly close the connection.
   */
  terminate(): void;
}

declare module 'ws' {
  declare export type Server = ws$WebSocketServer;
  declare module.exports: typeof ws$WebSocket;
}

declare module 'ws/lib/websocket-server' {
  declare module.exports: typeof ws$WebSocketServer;
}
