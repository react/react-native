/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// Very incomplete types for the undici package.

declare interface undici$Agent$Options {
  connect?: tls$connectOptions;
}

declare module 'undici' {
  declare export type RequestOptions = Readonly<{
    dispatcher?: Dispatcher,
    method?: string,
    headers?: HeadersInit,
    ...
  }>;

  declare export class Dispatcher extends events$EventEmitter {
    constructor(): void;
  }

  declare export class Agent extends Dispatcher {
    constructor(opts?: undici$Agent$Options): void;
  }

  declare export function request(
    url: string | URL,
    options: RequestOptions,
  ): Promise<{
    statusCode: number,
    headers: Headers,
    body: {
      read(): Promise<Buffer>,
      ...
    },
    ...
  }>;
}
