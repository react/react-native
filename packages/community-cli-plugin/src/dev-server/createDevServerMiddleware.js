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
import type {Server} from 'connect';

import createEventsSocket from './createEventsSocket';
import createMessageSocket from './createMessageSocket';
import openStackFrameMiddleware from './openStackFrameMiddleware';
import openURLMiddleware from './openURLMiddleware';
import securityHeadersMiddleware from './securityHeadersMiddleware';
import statusMiddleware from './statusMiddleware';
import compression from 'compression';
import connect from 'connect';
import nocache from 'nocache';

type Options = Readonly<{
  serverBaseUrl: URL,
  projectRoot: string,
  watchFolders: ReadonlyArray<string>,
  logger: Logger,
}>;

type DevServerMiddleware = Readonly<{
  middleware: Server,
  websocketEndpoints: {[path: string]: ws$WebSocketServer},
  messageSocket: Readonly<{
    broadcast: (method: string, params?: ?{[string]: unknown}) => void,
  }>,
  eventsSocket: Readonly<{
    reportEvent: (event: unknown) => void,
  }>,
}>;

/**
 * The dev server routes and WebSockets that React Native tooling and apps
 * call outside Metro and `@react-native/dev-middleware`.
 */
export default function createDevServerMiddleware({
  serverBaseUrl,
  projectRoot,
  watchFolders,
  logger,
}: Options): DevServerMiddleware {
  const messageSocket = createMessageSocket({logger, serverBaseUrl});
  const eventsSocket = createEventsSocket({
    logger,
    serverBaseUrl,
    broadcast: messageSocket.broadcast,
  });

  const middleware = connect()
    .use(securityHeadersMiddleware({serverBaseUrl}))
    .use(compression())
    .use(nocache())
    .use('/open-stack-frame', openStackFrameMiddleware({watchFolders}))
    .use('/open-url', openURLMiddleware())
    .use('/status', statusMiddleware({projectRoot}))
    .use('/reload', (req, res) => {
      messageSocket.broadcast('reload');
      res.end('OK');
    });

  return {
    middleware,
    websocketEndpoints: {
      '/message': messageSocket.server,
      '/events': eventsSocket.server,
    },
    messageSocket: {broadcast: messageSocket.broadcast},
    eventsSocket: {reportEvent: eventsSocket.reportEvent},
  };
}
