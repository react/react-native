/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

declare module 'actual-request-url' {
  declare interface ActualRequestUrl$Sock {
    readonly encrypted?: boolean;
    readonly localPort?: number;
  }

  declare export interface Req {
    readonly url?: string | URL | null;
    readonly headers?: Object;
    readonly socket?: ActualRequestUrl$Sock;
  }

  declare function actualRequestUrl(req: Req): URL | null;
  declare function getForwardVal(req: Req): string | null;
  declare function getHost(req: Req): string;
  declare function getPath(req: Req): string;
  declare function getPort(req: Req): string | null;
  declare function getProto(req: Req): string;

  declare export {
    actualRequestUrl,
    getForwardVal,
    getHost,
    getPath,
    getPort,
    getProto,
  };
}
