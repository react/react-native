/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

declare module 'connect' {
  import type http from 'http';

  declare export type ServerHandle = HandleFunction | http.Server;

  declare type NextFunction = (err?: unknown) => void;

  declare export type NextHandleFunction = (
    req: IncomingMessage,
    res: http.ServerResponse,
    next: NextFunction,
  ) => void | Promise<void>;
  declare export type HandleFunction = NextHandleFunction;

  declare export interface IncomingMessage extends http.IncomingMessage {
    originalUrl?: http.IncomingMessage['url'];
  }

  declare export interface Server extends events$EventEmitter {
    (req: IncomingMessage, res: http.ServerResponse): void;

    use(fn: HandleFunction): Server;
    use(route: string, fn: HandleFunction): Server;

    listen(
      port: number,
      hostname?: string,
      backlog?: number,
      callback?: Function,
    ): http.Server;
    listen(port: number, hostname?: string, callback?: Function): http.Server;
    listen(path: string, callback?: Function): http.Server;
    listen(handle: any, listeningListener?: Function): http.Server;
  }

  declare type createServer = () => Server;

  declare module.exports: createServer;
}
