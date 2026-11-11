/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import isAllowedOrigin from './isAllowedOrigin';
import isLocalSocket from './isLocalSocket';
import WS from 'ws';

const PROTOCOL_VERSION = 2;
const CLIENT_BROADCAST_ALLOWED_METHODS: ReadonlySet<string> = new Set([
  'reload',
  'devMenu',
]);

export type Logger = Readonly<{
  warn: (...message: ReadonlyArray<string>) => void,
  error: (...message: ReadonlyArray<string>) => void,
  ...
}>;

type Params = Readonly<{[string]: unknown}>;

type ClientMessage =
  | Readonly<{kind: 'broadcast', method: string, params: unknown}>
  | Readonly<{
      kind: 'request',
      method: string,
      target: string,
      id: unknown,
      params: unknown,
    }>
  | Readonly<{
      kind: 'response',
      requestId: unknown,
      clientId: string,
      result: unknown,
      error: unknown,
    }>;

type Client = Readonly<{
  socket: ws$WebSocket,
  query: Readonly<{[string]: string}>,
}>;

type Options = Readonly<{
  logger: Logger,
  serverBaseUrl: URL,
}>;

/**
 * The `/message` WebSocket, which connects the React Native apps and tools of
 * a dev server. It relays requests and responses between clients and
 * broadcasts server commands such as `reload` and `devMenu` to every app.
 *
 * A client may broadcast `reload` or `devMenu` itself only when it connects
 * from this machine with the dev server's own origin or none.
 */
export default function createMessageSocket({logger, serverBaseUrl}: Options): {
  server: ws$WebSocketServer,
  broadcast: (method: string, params?: Params | null) => void,
} {
  const server = new WS.Server({noServer: true});
  const clients = new Map<string, Client>();
  let nextClientId = 0;

  function send(socket: ws$WebSocket, message: Params) {
    socket.send(JSON.stringify({...message, version: PROTOCOL_VERSION}));
  }

  function getClient(clientId: string): Client {
    const client = clients.get(clientId);
    if (client == null) {
      throw new Error(
        `could not find id "${clientId}" while forwarding request`,
      );
    }
    return client;
  }

  function broadcast(
    broadcasterId: string | null,
    method: string,
    params: unknown,
  ) {
    if (clients.size === 0) {
      logger.warn(
        `No apps connected. Sending "${method}" to all React Native apps failed. Make sure your app is running in the simulator or on a phone connected via USB.`,
      );
    }
    for (const [clientId, {socket}] of clients) {
      if (clientId !== broadcasterId) {
        try {
          send(socket, {method, params});
        } catch (e) {
          logger.error(
            `Failed to send broadcast to client: '${clientId}' due to:\n ${String(e)}`,
          );
        }
      }
    }
  }

  server.on('connection', (socket, request) => {
    const clientId = `client#${nextClientId++}`;
    const {origin} = request.headers;
    const isTrustedClient =
      isLocalSocket(request.socket) &&
      (origin == null || isAllowedOrigin(origin, serverBaseUrl));

    clients.set(clientId, {
      socket,
      query: Object.fromEntries(
        new URL(request.url ?? '/', 'http://localhost').searchParams,
      ),
    });

    function handleServerRequest(message: ClientMessage) {
      if (message.kind !== 'request') {
        return;
      }
      let result: unknown;
      switch (message.method) {
        case 'getid':
          result = clientId;
          break;
        case 'getpeers': {
          const peers: {[string]: Readonly<{[string]: string}>} = {};
          for (const [otherId, {query}] of clients) {
            if (otherId !== clientId) {
              peers[otherId] = query;
            }
          }
          result = peers;
          break;
        }
        default:
          throw new Error(`unknown method: ${message.method}`);
      }
      send(socket, {result, id: message.id});
    }

    function handleMessage(message: ClientMessage) {
      switch (message.kind) {
        case 'broadcast':
          if (
            isTrustedClient &&
            CLIENT_BROADCAST_ALLOWED_METHODS.has(message.method)
          ) {
            broadcast(clientId, message.method, message.params);
          }
          break;
        case 'request':
          if (message.target === 'server') {
            handleServerRequest(message);
          } else {
            send(getClient(message.target).socket, {
              method: message.method,
              params: message.params,
              id:
                message.id === undefined
                  ? undefined
                  : {requestId: message.id, clientId},
            });
          }
          break;
        case 'response':
          send(getClient(message.clientId).socket, {
            result: message.result,
            error: message.error,
            id: message.requestId,
          });
          break;
      }
    }

    function removeClient() {
      socket.removeAllListeners('message');
      clients.delete(clientId);
    }
    socket.on('close', removeClient);
    socket.on('error', removeClient);

    socket.on('message', data => {
      const message = parseClientMessage(data, logger);
      if (message == null) {
        return;
      }
      try {
        handleMessage(message);
      } catch (e) {
        if (message.kind === 'request' && message.id !== undefined) {
          try {
            send(socket, {error: String(e), id: message.id});
          } catch (replyError) {
            logger.error(
              `Failed to reply to ${clientId} with error:\n${String(e)}\ndue to error: ${String(replyError)}`,
            );
          }
        } else {
          logger.error(
            `Handling message from ${clientId} failed with:\n${String(e)}`,
          );
        }
      }
    });
  });

  return {
    server,
    broadcast: (method, params) => broadcast(null, method, params),
  };
}

function parseClientMessage(data: unknown, logger: Logger): ?ClientMessage {
  if (typeof data !== 'string') {
    logger.error('Expected text message, got binary!');
    return null;
  }
  let message;
  try {
    message = JSON.parse(data);
  } catch {
    logger.error(`Failed to parse the message as JSON:\n${data}`);
    return null;
  }
  if (message == null || typeof message !== 'object') {
    logger.error('Received message not matching protocol');
    return null;
  }
  if (message.version !== PROTOCOL_VERSION) {
    logger.error(
      `Received message had wrong protocol version: ${String(message.version)}`,
    );
    return null;
  }

  const {method, target, id, params, result, error} = message;
  if (typeof method === 'string' && id === undefined && target === undefined) {
    return {kind: 'broadcast', method, params};
  }
  if (typeof method === 'string' && typeof target === 'string') {
    return {kind: 'request', method, target, id, params};
  }
  if (
    id != null &&
    typeof id === 'object' &&
    id.requestId !== undefined &&
    typeof id.clientId === 'string' &&
    (result !== undefined || error !== undefined)
  ) {
    return {
      kind: 'response',
      requestId: id.requestId,
      clientId: id.clientId,
      result,
      error,
    };
  }
  logger.error('Received message not matching protocol');
  return null;
}
