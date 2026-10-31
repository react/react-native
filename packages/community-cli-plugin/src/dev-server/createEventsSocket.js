/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Logger} from './createMessageSocket';

import isAllowedOrigin from './isAllowedOrigin';
import {format as prettyFormat, plugins} from 'pretty-format';
import WS from 'ws';

const PROTOCOL_VERSION = 2;

type Options = Readonly<{
  logger: Logger,
  serverBaseUrl: URL,
  broadcast: (method: string, params?: ?{[string]: unknown}) => void,
}>;

/**
 * The `/events` WebSocket, for developer tools that monitor a dev server. It
 * sends every Metro reporter event, including the console output of connected
 * apps as `client_log`, to each client, and forwards a client's `command`
 * message (such as `reload` or `devMenu`) to the connected apps.
 *
 * Commands reach the apps, so only a client with no `Origin` or a local one
 * may connect.
 */
export default function createEventsSocket({
  logger,
  serverBaseUrl,
  broadcast,
}: Options): {
  server: ws$WebSocketServer,
  reportEvent: (event: unknown) => void,
} {
  const server = new WS.Server({
    noServer: true,
    verifyClient: ({origin}) =>
      origin == null ||
      origin === '' ||
      isAllowedOrigin(origin, serverBaseUrl) ||
      origin.startsWith('file:'),
  });
  const clients = new Set<ws$WebSocket>();

  server.on('connection', socket => {
    clients.add(socket);

    function removeClient() {
      clients.delete(socket);
    }
    socket.on('close', removeClient);
    socket.on('error', removeClient);

    socket.on('message', data => {
      const message = parseCommand(data, logger);
      if (message == null) {
        return;
      }
      try {
        broadcast(message.command, message.params);
      } catch (e) {
        logger.error('Failed to forward message to clients: ', String(e));
      }
    });
  });

  return {
    server,
    reportEvent: event => {
      if (clients.size === 0) {
        return;
      }
      const serialized = serializeEvent(event, logger);
      if (serialized == null) {
        return;
      }
      for (const socket of clients) {
        try {
          socket.send(serialized);
        } catch (e) {
          logger.error(
            `Failed to send broadcast to client due to:\n ${String(e)}`,
          );
        }
      }
    },
  };
}

function parseCommand(
  data: unknown,
  logger: Logger,
): ?Readonly<{command: string, params: ?{[string]: unknown}}> {
  let message;
  try {
    message = JSON.parse(String(data));
  } catch {
    logger.error('Failed to parse the message as JSON:\n' + String(data));
    return null;
  }
  if (message == null || typeof message !== 'object') {
    logger.error('Unknown message type: ', String(message));
    return null;
  }
  if (message.version !== PROTOCOL_VERSION) {
    logger.error(
      'Received message had wrong protocol version: ' + String(message.version),
    );
    return null;
  }
  if (message.type !== 'command' || typeof message.command !== 'string') {
    logger.error('Unknown message type: ', String(message.type));
    return null;
  }
  return {command: message.command, params: message.params};
}

// Metro events are not guaranteed to be serializable. Errors and the
// arguments of a `client_log` event are formatted first.
function serializeEvent(event: unknown, logger: Logger): ?string {
  let toSerialize = event;
  if (event != null && typeof event === 'object') {
    if (event.error instanceof Error) {
      toSerialize = {
        ...event,
        error: prettyFormat(event.error, {
          escapeString: true,
          highlight: true,
          maxDepth: 3,
          min: true,
        }),
      };
    } else if (event.type === 'client_log' && Array.isArray(event.data)) {
      toSerialize = {
        ...event,
        data: event.data.map(item =>
          typeof item === 'string'
            ? item
            : prettyFormat(item, {
                escapeString: true,
                highlight: true,
                maxDepth: 3,
                min: true,
                plugins: [plugins.ReactElement],
              }),
        ),
      };
    }
  }
  try {
    return JSON.stringify(toSerialize);
  } catch (e) {
    logger.error('Failed to serialize: ' + String(e));
    return null;
  }
}
