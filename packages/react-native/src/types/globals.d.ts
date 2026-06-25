/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {ErrorUtils} from '../../Libraries/vendor/core/ErrorUtils';

declare global {
  interface NodeRequire {
    (id: string): any;
  }

  var require: NodeRequire;

  /**
   * Console polyfill
   * @see https://reactnative.dev/docs/javascript-environment#polyfills
   */
  interface Console {
    error(message?: any, ...optionalParams: any[]): void;
    info(message?: any, ...optionalParams: any[]): void;
    log(message?: any, ...optionalParams: any[]): void;
    warn(message?: any, ...optionalParams: any[]): void;
    trace(message?: any, ...optionalParams: any[]): void;
    debug(message?: any, ...optionalParams: any[]): void;
    table(...data: any[]): void;
    groupCollapsed(label?: string): void;
    groupEnd(): void;
    group(label?: string): void;
  }

  var console: Console;

  /**
   * This contains the non-native `XMLHttpRequest` object, which you can use if you want to route network requests
   * through DevTools (to trace them):
   *
   *   global.XMLHttpRequest = global.originalXMLHttpRequest;
   *
   * @see https://github.com/facebook/react-native/issues/934
   */
  const originalXMLHttpRequest: any;

  const __BUNDLE_START_TIME__: number;
  const ErrorUtils: ErrorUtils;

  /**
   * This variable is set to true when react-native is running in Dev mode
   * @example
   * if (__DEV__) console.log('Running in dev mode')
   */
  const __DEV__: boolean;

  const HermesInternal: null | {};

  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly) */
  interface DOMRectReadOnly {
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/bottom) */
    readonly bottom: number;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/height) */
    readonly height: number;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/left) */
    readonly left: number;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/right) */
    readonly right: number;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/top) */
    readonly top: number;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/width) */
    readonly width: number;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/x) */
    readonly x: number;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/y) */
    readonly y: number;
    toJSON(): any;
  }

  interface DOMRect extends DOMRectReadOnly {
    height: number;
    width: number;
    x: number;
    y: number;
  }

  interface DOMRectInit {
    height?: number | undefined;
    width?: number | undefined;
    x?: number | undefined;
    y?: number | undefined;
  }

  var DOMRect: {
    prototype: DOMRect;
    new (x?: number, y?: number, width?: number, height?: number): DOMRect;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRect/fromRect_static) */
    fromRect(other?: DOMRectInit): DOMRect;
  };

  // #region Timer Functions

  function clearInterval(handle: number | null | undefined): void;
  function clearTimeout(handle: number | null | undefined): void;
  function setInterval(handler: () => void, timeout: number): number;
  function setInterval<Args extends any[]>(
    handler: (...args: Args) => void,
    timeout?: number,
    ...args: Args
  ): number;
  function setTimeout(handler: () => void, timeout: number): number;
  function setTimeout<Args extends any[]>(
    handler: (...args: Args) => void,
    timeout?: number,
    ...args: Args
  ): number;
  function clearImmediate(handle: number | null | undefined): void;
  function setImmediate(handler: () => void): number;
  function setImmediate<Args extends any[]>(
    handler: (...args: Args) => void,
    ...args: Args
  ): number;

  function cancelAnimationFrame(handle: number | null | undefined): void;
  function requestAnimationFrame(callback: (time: number) => void): number;

  function fetchBundle(
    bundleId: number,
    callback: (error?: Error | null) => void,
  ): void;

  // #endregion
  // #region Fetch API

  interface GlobalFetch {
    fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
  }

  function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;

  interface WindowOrWorkerGlobalScope {
    fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
  }

  type EndingType = 'native' | 'transparent';
  type BlobPart = BufferSource | Blob | string;
  type BufferSource = ArrayBufferView | ArrayBuffer;

  interface BlobPropertyBag {
    endings?: EndingType | undefined;
    type?: string | undefined;
  }

  interface Blob {
    readonly size: number;
    readonly type: string;
    slice(start?: number, end?: number, contentType?: string): Blob;
  }

  interface BlobOptions {
    type: string;
    lastModified: number;
  }

  var Blob: {
    prototype: Blob;
    new (blobParts?: Array<Blob | string>, options?: BlobOptions): Blob;
  };

  interface FilePropertyBag extends BlobPropertyBag {
    lastModified?: number | undefined;
  }

  interface File extends Blob {
    readonly name: string;
    readonly lastModified: number;
  }

  var File: {
    prototype: File;
    new (fileParts: BlobPart[], name: string, options?: FilePropertyBag): File;
  };

  type FormDataValue =
    | string
    | {name?: string | undefined; type?: string | undefined; uri: string};

  type FormDataPart =
    | {
        string: string;
        headers: {[name: string]: string};
      }
    | {
        uri: string;
        headers: {[name: string]: string};
        name?: string | undefined;
        type?: string | undefined;
      };

  class FormData {
    append(key: string, value: any): void;
    getAll(key: string): Array<FormDataValue>;
    getParts(): Array<FormDataPart>;
  }

  interface Body {
    readonly bodyUsed: boolean;
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob>;
    json(): Promise<any>;
    text(): Promise<string>;
    formData(): Promise<FormData>;
  }

  interface Headers {
    append(name: string, value: string): void;
    delete(name: string): void;
    forEach(
      callbackfn: (value: string, key: string, parent: Headers) => void,
      thisArg?: any,
    ): void;
    get(name: string): string | null;
    has(name: string): boolean;
    set(name: string, value: string): void;
    entries(): IterableIterator<[string, string]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<string>;
    [Symbol.iterator](): IterableIterator<[string, string]>;
  }

  var Headers: {
    prototype: Headers;
    new (init?: HeadersInit_): Headers;
  };

  /**
   * React Native's implementation of fetch allows this syntax for uploading files from
   * local filesystem.
   * See https://github.com/facebook/react-native/blob/master/Libraries/Network/convertRequestBody.js#L22
   */
  interface _SourceUri {
    uri: string;
    [key: string]: any;
  }

  type BodyInit_ =
    | _SourceUri
    | Blob
    | Int8Array
    | Int16Array
    | Int32Array
    | Uint8Array
    | Uint16Array
    | Uint32Array
    | Uint8ClampedArray
    | Float32Array
    | Float64Array
    | DataView
    | ArrayBuffer
    | FormData
    | string
    | null;

  interface RequestInit {
    body?: BodyInit_ | null | undefined;
    credentials?: RequestCredentials_ | undefined;
    headers?: HeadersInit_ | undefined;
    integrity?: string | undefined;
    keepalive?: boolean | undefined;
    method?: string | undefined;
    mode?: RequestMode_ | undefined;
    referrer?: string | undefined;
    window?: null | undefined;
    signal?: AbortSignal | undefined;
  }

  interface Request extends Object, Body {
    readonly credentials: RequestCredentials_;
    readonly headers: Headers;
    readonly method: string;
    readonly mode: RequestMode_;
    readonly referrer: string;
    readonly url: string;
    readonly signal: AbortSignal;
    clone(): Request;
  }

  var Request: {
    prototype: Request;
    new (input: Request | string, init?: RequestInit): Request;
  };

  type RequestInfo = Request | string;

  interface ResponseInit {
    headers?: HeadersInit_ | undefined;
    status?: number | undefined;
    statusText?: string | undefined;
  }

  interface Response extends Object, Body {
    readonly headers: Headers;
    readonly ok: boolean;
    readonly status: number;
    readonly statusText: string;
    readonly type: ResponseType_;
    readonly url: string;
    readonly redirected: boolean;
    clone(): Response;
  }

  var Response: {
    prototype: Response;
    new (body?: BodyInit_ | null, init?: ResponseInit): Response;
    error(): Response;
    json(data: any, init?: ResponseInit): Response;
    redirect: (url: string | URL, status?: number) => Response;
  };

  type HeadersInit_ = [string, string][] | Record<string, string> | Headers;
  type RequestCredentials_ = 'omit' | 'same-origin' | 'include';
  type RequestMode_ = 'navigate' | 'same-origin' | 'no-cors' | 'cors';
  type ResponseType_ =
    | 'basic'
    | 'cors'
    | 'default'
    | 'error'
    | 'opaque'
    | 'opaqueredirect';

  // #endregion
  // #region XMLHttpRequest

  interface ProgressEvent<T extends EventTarget = EventTarget> extends Event {
    readonly lengthComputable: boolean;
    readonly loaded: number;
    readonly total: number;
    readonly target: T | null;
  }

  interface XMLHttpRequestEventMap extends XMLHttpRequestEventTargetEventMap {
    readystatechange: Event;
  }

  interface XMLHttpRequest extends EventTarget, XMLHttpRequestEventTarget {
    onreadystatechange: ((this: XMLHttpRequest, ev: Event) => any) | null;
    readonly readyState: number;
    readonly response: any;
    readonly responseText: string;
    responseType: XMLHttpRequestResponseType;
    readonly responseURL: string;
    readonly responseXML: Document | null;
    readonly status: number;
    readonly statusText: string;
    timeout: number;
    readonly upload: XMLHttpRequestUpload;
    withCredentials: boolean;
    abort(): void;
    getAllResponseHeaders(): string;
    getResponseHeader(header: string): string | null;
    open(
      method: string,
      url: string,
      async?: boolean,
      user?: string | null,
      password?: string | null,
    ): void;
    overrideMimeType(mime: string): void;
    send(data?: any): void;
    setRequestHeader(header: string, value: string): void;
    readonly DONE: 4;
    readonly HEADERS_RECEIVED: 2;
    readonly LOADING: 3;
    readonly OPENED: 1;
    readonly UNSENT: 0;
    addEventListener<K extends keyof XMLHttpRequestEventMap>(
      type: K,
      listener: (this: XMLHttpRequest, ev: XMLHttpRequestEventMap[K]) => any,
    ): void;
    removeEventListener<K extends keyof XMLHttpRequestEventMap>(
      type: K,
      listener: (this: XMLHttpRequest, ev: XMLHttpRequestEventMap[K]) => any,
    ): void;
  }

  var XMLHttpRequest: {
    prototype: XMLHttpRequest;
    new (): XMLHttpRequest;
    readonly DONE: 4;
    readonly HEADERS_RECEIVED: 2;
    readonly LOADING: 3;
    readonly OPENED: 1;
    readonly UNSENT: 0;
  };

  interface XMLHttpRequestEventTargetEventMap {
    abort: ProgressEvent;
    error: ProgressEvent;
    load: ProgressEvent;
    loadend: ProgressEvent;
    loadstart: ProgressEvent;
    progress: ProgressEvent;
    timeout: ProgressEvent;
  }

  interface XMLHttpRequestEventTarget {
    onabort: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    onerror: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    onload: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    onloadend: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    onloadstart: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    ontimeout: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    addEventListener<K extends keyof XMLHttpRequestEventTargetEventMap>(
      type: K,
      listener: (
        this: XMLHttpRequestEventTarget,
        ev: XMLHttpRequestEventTargetEventMap[K],
      ) => any,
    ): void;
    removeEventListener<K extends keyof XMLHttpRequestEventTargetEventMap>(
      type: K,
      listener: (
        this: XMLHttpRequestEventTarget,
        ev: XMLHttpRequestEventTargetEventMap[K],
      ) => any,
    ): void;
  }

  interface XMLHttpRequestUpload
    extends EventTarget,
      XMLHttpRequestEventTarget {
    addEventListener<K extends keyof XMLHttpRequestEventTargetEventMap>(
      type: K,
      listener: (
        this: XMLHttpRequestUpload,
        ev: XMLHttpRequestEventTargetEventMap[K],
      ) => any,
    ): void;
    removeEventListener<K extends keyof XMLHttpRequestEventTargetEventMap>(
      type: K,
      listener: (
        this: XMLHttpRequestUpload,
        ev: XMLHttpRequestEventTargetEventMap[K],
      ) => any,
    ): void;
  }

  var XMLHttpRequestUpload: {
    prototype: XMLHttpRequestUpload;
    new (): XMLHttpRequestUpload;
  };

  type XMLHttpRequestResponseType =
    | ''
    | 'arraybuffer'
    | 'blob'
    | 'document'
    | 'json'
    | 'text';

  interface URL {
    readonly hash: string;
    readonly host: string;
    readonly hostname: string;
    readonly href: string;
    readonly origin: string;
    readonly password: string;
    readonly pathname: string;
    readonly port: string;
    readonly protocol: string;
    search: string;
    readonly searchParams: URLSearchParams;
    readonly username: string;

    toJSON(): string;
    toString(): string;
  }

  var URL: {
    prototype: URL;
    new (url: string | URL, base?: string | URL): URL;
    createObjectURL(obj: Blob): string;
    revokeObjectURL(url: string): void;
  };

  /**
   * Based on definitions of lib.dom and lib.dom.iterable
   */
  interface URLSearchParams {
    /**
     * Returns the number of search parameter entries.
     */
    readonly size: number;

    append(key: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | null;
    getAll(name: string): string[];
    has(name: string): boolean;
    set(name: string, value: string): void;
    sort(): void;
    toString(): string;
    forEach(
      callbackfn: (value: string, key: string, parent: URLSearchParams) => void,
      thisArg?: any,
    ): void;

    keys(): IterableIterator<string>;
    values(): IterableIterator<string>;
    entries(): IterableIterator<[string, string]>;

    [Symbol.iterator](): IterableIterator<[string, string]>;
  }

  var URLSearchParams: {
    prototype: URLSearchParams;
    new (
      init?: string[][] | Record<string, string> | string | URLSearchParams,
    ): URLSearchParams;
  };

  interface WebSocketMessageEvent extends Event {
    data?: any | undefined;
  }
  interface WebSocketErrorEvent extends Event {
    message: string;
  }
  interface WebSocketCloseEvent extends Event {
    code?: number | undefined;
    reason?: string | undefined;
    message?: string | undefined;
  }

  type WebsocketMessageEventListener = (
    event: 'message',
    handler: (e: WebSocketMessageEvent) => void,
  ) => void;
  type WebsocketErrorEventListener = (
    event: 'error',
    handler: (e: WebSocketErrorEvent) => void,
  ) => void;
  type WebsocketOpenEventListener = (
    event: 'open',
    handler: () => void,
  ) => void;
  type WebsocketCloseEventListener = (
    event: 'close',
    handler: (e: WebSocketCloseEvent) => void,
  ) => void;

  type WebsocketEventListener = WebsocketMessageEventListener &
    WebsocketErrorEventListener &
    WebsocketOpenEventListener &
    WebsocketCloseEventListener;

  interface WebSocket extends EventTarget {
    readonly readyState: number;
    send(data: string | ArrayBuffer | ArrayBufferView | Blob): void;
    close(code?: number, reason?: string): void;
    ping(): void;
    onopen: (() => void) | null;
    onmessage: ((event: WebSocketMessageEvent) => void) | null;
    onerror: ((event: WebSocketErrorEvent) => void) | null;
    onclose: ((event: WebSocketCloseEvent) => void) | null;
    addEventListener: WebsocketEventListener;
    removeEventListener: WebsocketEventListener;
  }

  var WebSocket: {
    prototype: WebSocket;
    new (
      uri: string,
      protocols?: string | string[] | null,
      options?: {
        headers: {[headerName: string]: string};
        [optionName: string]: any;
      } | null,
    ): WebSocket;
    readonly CLOSED: number;
    readonly CLOSING: number;
    readonly CONNECTING: number;
    readonly OPEN: number;
  };

  // #endregion
  // #region Abort Controller

  interface AbortEvent extends Event {
    type: 'abort';
  }

  class AbortSignal implements EventTarget {
    /**
     * AbortSignal cannot be constructed directly.
     */
    constructor();
    /**
     * Returns `true` if this `AbortSignal`'s `AbortController` has signaled to abort, and `false` otherwise.
     */
    readonly aborted: boolean;

    onabort: (event: AbortEvent) => void;

    addEventListener: (
      type: 'abort',
      listener: (this: AbortSignal, event: any) => any,
      options?:
        | boolean
        | {
            capture?: boolean | undefined;
            once?: boolean | undefined;
            passive?: boolean | undefined;
          },
    ) => void;

    dispatchEvent(event: Event): boolean;

    removeEventListener: (
      type: 'abort',
      listener: (this: AbortSignal, event: any) => any,
      options?:
        | boolean
        | {
            capture?: boolean | undefined;
          },
    ) => void;
  }

  class AbortController {
    /**
     * Initialize this controller.
     */
    constructor();
    /**
     * Returns the `AbortSignal` object associated with this object.
     */
    readonly signal: AbortSignal;
    /**
     * Abort and signal to any observers that the associated activity is to be aborted.
     */
    abort(): void;
  }

  interface FileReaderEventMap {
    abort: ProgressEvent<FileReader>;
    error: ProgressEvent<FileReader>;
    load: ProgressEvent<FileReader>;
    loadend: ProgressEvent<FileReader>;
    loadstart: ProgressEvent<FileReader>;
    progress: ProgressEvent<FileReader>;
  }

  interface FileReader extends EventTarget {
    readonly error: Error | null;
    onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
    onloadend:
      | ((this: FileReader, ev: ProgressEvent<FileReader>) => any)
      | null;
    onloadstart:
      | ((this: FileReader, ev: ProgressEvent<FileReader>) => any)
      | null;
    onprogress:
      | ((this: FileReader, ev: ProgressEvent<FileReader>) => any)
      | null;
    readonly readyState: number;
    readonly result: string | ArrayBuffer;
    abort(): void;
    readAsArrayBuffer(blob: Blob): void;
    readAsDataURL(blob: Blob): void;
    readAsText(blob: Blob, encoding?: string): void;
    readonly DONE: 2;
    readonly EMPTY: 0;
    readonly LOADING: 1;
    addEventListener<K extends keyof FileReaderEventMap>(
      type: K,
      listener: (this: FileReader, ev: FileReaderEventMap[K]) => any,
      options?: boolean,
    ): void;
    removeEventListener<K extends keyof FileReaderEventMap>(
      type: K,
      listener: (this: FileReader, ev: FileReaderEventMap[K]) => any,
      options?: boolean,
    ): void;
  }

  var FileReader: {
    prototype: FileReader;
    new (): FileReader;
    readonly DONE: 2;
    readonly EMPTY: 0;
    readonly LOADING: 1;
  };

  // #endregion
}
