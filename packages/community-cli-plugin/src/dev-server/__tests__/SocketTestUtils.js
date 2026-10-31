/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import http from 'node:http';
import WebSocket from 'ws';

export type TestServer = Readonly<{
  baseUrl: URL,
  mount: (path: string, wss: ws$WebSocketServer) => void,
  server: http$Server,
  connect: (
    path: string,
    options?: Readonly<{origin?: string}>,
  ) => Promise<TestClient>,
  close: () => Promise<void>,
}>;

export type TestClient = Readonly<{
  send: (message: unknown) => void,
  sendRaw: (data: string | Buffer) => void,
  next: () => Promise<unknown>,
  /**
   * Resolves with the messages received before the server answers a `getid`
   * request, which it handles after everything this client was sent earlier.
   */
  drain: () => Promise<Array<unknown>>,
  getId: () => Promise<string>,
  close: () => void,
}>;

/**
 * Retry an assertion until it passes, for an effect the server applies after
 * the client has already sent its message.
 */
export async function waitUntil(assertion: () => void): Promise<void> {
  const deadline = Date.now() + 2000;
  for (;;) {
    try {
      assertion();
      return;
    } catch (e) {
      if (Date.now() > deadline) {
        throw e;
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

export async function startTestServer(): Promise<TestServer> {
  const endpoints = new Map<string, ws$WebSocketServer>();
  const sockets = new Set<WebSocket>();
  const server = http.createServer();
  server.on('upgrade', (req, socket, head) => {
    const wss = endpoints.get(new URL(req.url, 'http://localhost').pathname);
    if (wss == null) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
  });
  await new Promise(resolve => server.listen(0, 'localhost', resolve));
  const address = server.address();
  if (address == null || typeof address === 'string') {
    throw new Error('Expected the server to listen on a TCP port');
  }
  const baseUrl = new URL(`http://localhost:${address.port}`);

  return {
    baseUrl,
    mount: (path, wss) => {
      endpoints.set(path, wss);
    },
    server,
    connect: async (path, options) => {
      const socket = new WebSocket(`ws://localhost:${address.port}${path}`, {
        headers: options?.origin == null ? {} : {Origin: options.origin},
      });
      sockets.add(socket);
      const received: Array<unknown> = [];
      const waiting: Array<(message: unknown) => void> = [];
      socket.on('message', data => {
        const message = JSON.parse(String(data));
        const resolve = waiting.shift();
        if (resolve != null) {
          resolve(message);
        } else {
          received.push(message);
        }
      });
      await new Promise((resolve, reject) => {
        socket.once('open', resolve);
        socket.once('error', reject);
        socket.once('unexpected-response', (req, res) =>
          reject(new Error(`HTTP ${res.statusCode}`)),
        );
      });

      const next = (): Promise<unknown> =>
        received.length > 0
          ? Promise.resolve(received.shift())
          : new Promise(resolve => waiting.push(resolve));

      return {
        send: message => socket.send(JSON.stringify(message)),
        sendRaw: data => socket.send(data),
        next,
        drain: async () => {
          socket.send(
            JSON.stringify({
              version: 2,
              method: 'getid',
              target: 'server',
              id: 'drain',
            }),
          );
          const before = [];
          let message = await next();
          while (!isReplyTo(message, 'drain')) {
            before.push(message);
            message = await next();
          }
          return before;
        },
        getId: async () => {
          socket.send(
            JSON.stringify({
              version: 2,
              method: 'getid',
              target: 'server',
              id: 'getid',
            }),
          );
          const message = await next();
          if (
            message == null ||
            typeof message !== 'object' ||
            message.id !== 'getid' ||
            typeof message.result !== 'string'
          ) {
            throw new Error('Expected a getid reply');
          }
          return message.result;
        },
        close: () => socket.close(),
      };
    },
    close: async () => {
      sockets.forEach(socket => socket.terminate());
      server.closeAllConnections();
      await new Promise(resolve => server.close(() => resolve()));
    },
  };
}

function isReplyTo(message: unknown, id: string): boolean {
  return message != null && typeof message === 'object' && message.id === id;
}
