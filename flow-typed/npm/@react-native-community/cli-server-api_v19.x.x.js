/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

declare module '@react-native-community/cli-server-api' {
  import type {NextHandleFunction, Server} from 'connect';

  declare type MiddlewareOptions = {
    host?: string,
    watchFolders: ReadonlyArray<string>,
    port: number,
  };

  declare export function createDevServerMiddleware(
    options: MiddlewareOptions,
  ): {
    middleware: Server,
    websocketEndpoints: {
      [path: string]: ws$WebSocketServer,
    },
    debuggerProxyEndpoint: {
      server: ws$WebSocketServer,
      isDebuggerConnected: () => boolean,
    },
    messageSocketEndpoint: {
      server: ws$WebSocketServer,
      broadcast: (
        method: string,
        params?: Record<string, unknown> | null,
      ) => void,
    },
    eventsSocketEndpoint: {
      server: ws$WebSocketServer,
      reportEvent: (event: any) => void,
    },
    ...
  };
}
