/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  ConnectRequest,
  DisconnectRequest,
  GetPagesRequest,
  GetPagesResponse,
  JSONSerializable,
  MessageFromDevice,
  MessageToDevice,
  WrappedEventToDevice,
} from '../inspector-proxy/types';

import nullthrows from 'nullthrows';
import WebSocket from 'ws';

export class DeviceAgent {
  #ws: ?WebSocket;
  #readyPromise: Promise<void>;

  constructor(url: string, signal?: AbortSignal, host?: ?string) {
    const ws = new WebSocket(url, {
      // The mock server uses a self-signed certificate.
      rejectUnauthorized: false,
      ...(host != null
        ? {
            headers: {
              Host: host,
            },
          }
        : {}),
    });
    this.#ws = ws;
    ws.on('message', data => {
      this.__handle(JSON.parse(data.toString()));
    });
    if (signal != null) {
      signal.addEventListener('abort', () => {
        this.close();
      });
    }
    this.#readyPromise = new Promise<void>((resolve, reject) => {
      ws.once('open', () => {
        resolve();
      });
      ws.once('error', error => {
        reject(error);
      });
    });
  }

  __handle(message: MessageToDevice): void {}

  send(message: MessageFromDevice) {
    if (!this.#ws) {
      return;
    }
    this.#ws.send(JSON.stringify(message));
  }

  ready(): Promise<void> {
    return this.#readyPromise;
  }

  close() {
    if (!this.#ws) {
      return;
    }
    try {
      this.#ws.terminate();
    } catch {}
    this.#ws = null;
  }

  sendWrappedEvent(pageId: string, event: JSONSerializable) {
    this.send({
      event: 'wrappedEvent',
      payload: {
        pageId,
        wrappedEvent: JSON.stringify(event),
      },
    });
  }

  // $FlowFixMe[unsafe-getters-setters]
  get socket(): WebSocket {
    return nullthrows(this.#ws);
  }
}

export class DeviceMock extends DeviceAgent {
  // Empty handlers
  readonly connect: JestMockFn<[message: ConnectRequest], void> = jest.fn();
  readonly disconnect: JestMockFn<[message: DisconnectRequest], void> =
    jest.fn();
  readonly getPages: JestMockFn<
    [message: GetPagesRequest],
    | GetPagesResponse['payload']
    | Promise<GetPagesResponse['payload'] | void>
    | void,
  > = jest.fn();
  readonly wrappedEvent: JestMockFn<[message: WrappedEventToDevice], void> =
    jest.fn();
  readonly wrappedEventParsed: JestMockFn<
    [
      payload: {
        ...WrappedEventToDevice['payload'],
        wrappedEvent: JSONSerializable,
      },
    ],
    void,
  > = jest.fn();

  __handle(message: MessageToDevice): void {
    switch (message.event) {
      case 'connect':
        this.connect(message);
        break;
      case 'disconnect':
        this.disconnect(message);
        break;
      case 'getPages':
        const result = this.getPages(message);
        this.#sendPayloadIfNonNull('getPages', result);
        break;
      case 'wrappedEvent':
        this.wrappedEvent(message);
        this.wrappedEventParsed({
          ...message.payload,
          wrappedEvent: JSON.parse(message.payload.wrappedEvent),
        });
        break;
      default:
        message as empty;
        throw new Error(`Unhandled event ${message.event}`);
    }
  }

  #sendPayloadIfNonNull<Event extends MessageFromDevice['event']>(
    event: Event,
    maybePayload:
      | MessageFromDevice['payload']
      | Promise<MessageFromDevice['payload'] | void>
      | void,
  ) {
    if (maybePayload == null) {
      return;
    }
    if (maybePayload instanceof Promise) {
      void maybePayload.then(payload => {
        if (!payload) {
          return;
        }
        // $FlowFixMe[incompatible-type] TODO(moti) Figure out the right way to type maybePayload generically
        this.send({event, payload});
      });
      return;
    }
    // $FlowFixMe[incompatible-type] TODO(moti) Figure out the right way to type maybePayload generically
    this.send({event, payload: maybePayload});
  }
}

export async function createDeviceMock(
  url: string,
  signal: AbortSignal,
  host?: ?string,
): Promise<DeviceMock> {
  const device = new DeviceMock(url, signal, host);
  await device.ready();
  return device;
}
