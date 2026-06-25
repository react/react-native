/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {JSONSerializable} from '../inspector-proxy/types';
import type {
  CdpMessageToTarget,
  CdpResponseFromTarget,
} from './InspectorProtocolUtils';

import nullthrows from 'nullthrows';
import until from 'wait-for-expect';
import WebSocket from 'ws';

export class DebuggerAgent {
  #ws: ?WebSocket;
  #readyPromise: Promise<void>;

  constructor(
    url: string,
    signal?: AbortSignal,
    headers?: ?{[string]: unknown},
  ) {
    const ws = new WebSocket(url, {
      // The mock server uses a self-signed certificate.
      rejectUnauthorized: false,
      ...(headers != null
        ? {headers}
        : {headers: {Origin: 'http://localhost:8081'}}),
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

  __handle(message: JSONSerializable): void {}

  send(message: JSONSerializable) {
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

  // $FlowFixMe[unsafe-getters-setters]
  get socket(): WebSocket {
    return nullthrows(this.#ws);
  }
}

export class DebuggerMock extends DebuggerAgent {
  // Empty handlers
  readonly handle: JestMockFn<[message: JSONSerializable], void> = jest.fn();

  __handle(message: JSONSerializable): void {
    this.handle(message);
  }

  async sendAndGetResponse(
    message: CdpMessageToTarget,
  ): Promise<CdpResponseFromTarget> {
    const originalHandleCallsArray = this.handle.mock.calls;
    const originalHandleCallCount = originalHandleCallsArray.length;
    this.send(message);
    await until(() =>
      expect(this.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          id: message.id,
        }),
      ),
    );
    // Find the first matching handle call that wasn't already in the mock calls
    // array before we sent the message.
    const newHandleCalls =
      originalHandleCallsArray === this.handle.mock.calls
        ? this.handle.mock.calls.slice(originalHandleCallCount)
        : this.handle.mock.calls;
    // $FlowFixMe[incompatible-use]
    // $FlowFixMe[prop-missing]
    // $FlowFixMe[incompatible-type]
    const [response] = newHandleCalls.find(args => args[0].id === message.id);
    // $FlowFixMe[incompatible-type]
    // $FlowFixMe[incompatible-indexer]
    return response;
  }
}

export async function createDebuggerMock(
  url: string,
  signal: AbortSignal,
  headers?: ?{[string]: unknown},
): Promise<DebuggerMock> {
  const debuggerMock = new DebuggerMock(url, signal, headers);
  await debuggerMock.ready();
  return debuggerMock;
}
