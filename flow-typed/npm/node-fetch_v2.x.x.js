/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// Modified from flow-typed repo:
// https://github.com/flow-typed/flow-typed/blob/master/definitions/npm/node-fetch_v2.x.x/flow_v0.104.x-/node-fetch_v2.x.x.js

declare module 'node-fetch' {
  import type http from 'http';
  import type https from 'https';
  import type {Readable} from 'stream';

  declare type AbortSignal = {
    +aborted: boolean,
    +onabort: (event?: {...}) => void,

    +addEventListener: (name: string, cb: () => unknown) => void,
    +removeEventListener: (name: string, cb: () => unknown) => void,
    +dispatchEvent: (event: {...}) => void,
    ...
  };

  declare class Request mixins Body {
    constructor(
      input: string | {href: string, ...} | Request,
      init?: RequestInit,
    ): this;
    context: RequestContext;
    headers: Headers;
    method: string;
    redirect: RequestRedirect;
    referrer: string;
    url: string;

    // node-fetch extensions
    agent: http.Agent | https.Agent;
    compress: boolean;
    counter: number;
    follow: number;
    hostname: string;
    port: number;
    protocol: string;
    size: number;
    timeout: number;
  }

  declare type HeaderObject = {[index: string]: string | number, ...};

  declare type RequestInit = {|
    body?: BodyInit,
    headers?: HeaderObject | null,
    method?: string,
    redirect?: RequestRedirect,
    signal?: AbortSignal | null,

    // node-fetch extensions
    agent?: (URL => http.Agent | https.Agent) | http.Agent | https.Agent | null,
    compress?: boolean,
    follow?: number,
    size?: number,
    timeout?: number,
  |};

  declare interface FetchError extends Error {
    // cannot set name due to incompatible extend error
    // name: 'FetchError';
    type: string;
    code: ?number;
    errno: ?number;
  }

  declare interface AbortError extends Error {
    // cannot set name due to incompatible extend error
    // name: 'AbortError';
    type: 'aborted';
  }

  declare type RequestContext =
    | 'audio'
    | 'beacon'
    | 'cspreport'
    | 'download'
    | 'embed'
    | 'eventsource'
    | 'favicon'
    | 'fetch'
    | 'font'
    | 'form'
    | 'frame'
    | 'hyperlink'
    | 'iframe'
    | 'image'
    | 'imageset'
    | 'import'
    | 'internal'
    | 'location'
    | 'manifest'
    | 'object'
    | 'ping'
    | 'plugin'
    | 'prefetch'
    | 'script'
    | 'serviceworker'
    | 'sharedworker'
    | 'subresource'
    | 'style'
    | 'track'
    | 'video'
    | 'worker'
    | 'xmlhttprequest'
    | 'xslt';
  declare type RequestRedirect = 'error' | 'follow' | 'manual';

  declare class Headers {
    append(name: string, value: string): void;
    delete(name: string): void;
    forEach(callback: (value: string, name: string) => void): void;
    get(name: string): string;
    getAll(name: string): Array<string>;
    has(name: string): boolean;
    raw(): {[k: string]: string[], ...};
    set(name: string, value: string): void;
    entries(): Iterator<[string, string]>;
    keys(): Iterator<string>;
    values(): Iterator<string>;
    @@iterator(): Iterator<[string, string]>;
  }

  declare class Body {
    buffer(): Promise<Buffer>;
    json(): Promise<any>;
    json<T>(): Promise<T>;
    text(): Promise<string>;
    body: stream$Readable;
    bodyUsed: boolean;
  }

  declare class Response mixins Body {
    constructor(body?: BodyInit, init?: ResponseInit): this;
    clone(): Response;
    error(): Response;
    redirect(url: string, status: number): Response;
    headers: Headers;
    ok: boolean;
    status: number;
    statusText: string;
    size: number;
    timeout: number;
    type: ResponseType;
    url: string;
  }

  declare type ResponseType =
    | 'basic'
    | 'cors'
    | 'default'
    | 'error'
    | 'opaque'
    | 'opaqueredirect';

  declare interface ResponseInit {
    headers?: HeaderInit;
    status: number;
    statusText?: string;
  }

  declare type HeaderInit = Headers | Array<string>;
  declare type BodyInit =
    | string
    | null
    | Buffer
    | Blob
    | Readable
    | URLSearchParams;

  declare function fetch(
    url: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response>;

  declare module.exports: typeof fetch;
}
