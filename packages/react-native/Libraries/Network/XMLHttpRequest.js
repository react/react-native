/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {
  EventCallback,
  EventListener,
} from '../../src/private/webapis/dom/events/EventTarget';

import Event from '../../src/private/webapis/dom/events/Event';
import {
  getEventHandlerAttribute,
  setEventHandlerAttribute,
} from '../../src/private/webapis/dom/events/EventHandlerAttributes';
import EventTarget from '../../src/private/webapis/dom/events/EventTarget';
import {dispatchTrustedEvent} from '../../src/private/webapis/dom/events/internals/EventTargetInternals';
import ProgressEvent from '../../src/private/webapis/xhr/events/ProgressEvent';
import {type EventSubscription} from '../vendor/emitter/EventEmitter';

const BlobManager = require('../Blob/BlobManager').default;
const RCTNetworking = require('./RCTNetworking').default;
const base64 = require('base64-js');
const invariant = require('invariant');

const DEBUG_NETWORK_SEND_DELAY: false = false; // Set to a number of milliseconds when debugging

export type NativeResponseType = 'base64' | 'blob' | 'text';
export type ResponseType =
  | ''
  | 'arraybuffer'
  | 'blob'
  | 'document'
  | 'json'
  | 'text';
export type Response = ?Object | string;

type XHRInterceptor = interface {
  requestSent(id: number, url: string, method: string, headers: Object): void,
  responseReceived(
    id: number,
    url: string,
    status: number,
    headers: Object,
  ): void,
  dataReceived(id: number, data: string): void,
  loadingFinished(id: number, encodedDataLength: number): void,
  loadingFailed(id: number, error: string): void,
};

/**
 * Minimal contract for the optional performance logger that callers may attach
 * via `setPerformanceLogger(...)`. Defined locally so this module stays
 * self-contained and does not depend on any specific logger implementation.
 * Any object satisfying these two methods structurally is accepted.
 */
type XHRPerformanceLogger = interface {
  startTimespan(key: string): void,
  stopTimespan(key: string): void,
};

// The native blob module is optional so inject it here if available.
if (BlobManager.isAvailable) {
  BlobManager.addNetworkingHandler();
}

const UNSENT = 0;
const OPENED = 1;
const HEADERS_RECEIVED = 2;
const LOADING = 3;
const DONE = 4;

const SUPPORTED_RESPONSE_TYPES = {
  arraybuffer: typeof global.ArrayBuffer === 'function',
  blob: typeof global.Blob === 'function',
  document: false,
  json: true,
  text: true,
  '': true,
};

class XMLHttpRequestEventTarget extends EventTarget {
  get onload(): EventCallback | null {
    return getEventHandlerAttribute(this, 'load');
  }
  set onload(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'load', listener);
  }
  get onloadstart(): EventCallback | null {
    return getEventHandlerAttribute(this, 'loadstart');
  }
  set onloadstart(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'loadstart', listener);
  }
  get onprogress(): EventCallback | null {
    return getEventHandlerAttribute(this, 'progress');
  }
  set onprogress(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'progress', listener);
  }
  get ontimeout(): EventCallback | null {
    return getEventHandlerAttribute(this, 'timeout');
  }
  set ontimeout(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'timeout', listener);
  }
  get onerror(): EventCallback | null {
    return getEventHandlerAttribute(this, 'error');
  }
  set onerror(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'error', listener);
  }
  get onabort(): EventCallback | null {
    return getEventHandlerAttribute(this, 'abort');
  }
  set onabort(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'abort', listener);
  }
  get onloadend(): EventCallback | null {
    return getEventHandlerAttribute(this, 'loadend');
  }
  set onloadend(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'loadend', listener);
  }
}

/**
 * Shared base for platform-specific XMLHttpRequest implementations.
 */
class XMLHttpRequest extends EventTarget {
  static UNSENT: number = UNSENT;
  static OPENED: number = OPENED;
  static HEADERS_RECEIVED: number = HEADERS_RECEIVED;
  static LOADING: number = LOADING;
  static DONE: number = DONE;

  static _interceptor: ?XHRInterceptor = null;

  UNSENT: number = UNSENT;
  OPENED: number = OPENED;
  HEADERS_RECEIVED: number = HEADERS_RECEIVED;
  LOADING: number = LOADING;
  DONE: number = DONE;

  readyState: number = UNSENT;
  responseHeaders: ?Object;
  status: number = 0;
  timeout: number = 0;
  responseURL: ?string;
  withCredentials: boolean = true;

  upload: XMLHttpRequestEventTarget = new XMLHttpRequestEventTarget();

  _requestId: ?number;
  _subscriptions: Array<EventSubscription>;

  _aborted: boolean = false;
  _cachedResponse: Response;
  _hasError: boolean = false;
  _headers: Object;
  _lowerCaseResponseHeaders: Object;
  _method: ?string = null;
  _perfKey: ?string = null;
  _responseType: ResponseType;
  _response: string = '';
  _sent: boolean;
  _url: ?string = null;
  _timedOut: boolean = false;
  _trackingName: ?string;
  _incrementalEvents: boolean = false;
  _performanceLogger: ?XHRPerformanceLogger = null;

  static __setInterceptor_DO_NOT_USE(interceptor: ?XHRInterceptor) {
    XMLHttpRequest._interceptor = interceptor;
  }

  constructor() {
    super();
    this._reset();
  }

  _reset(): void {
    this.readyState = this.UNSENT;
    this.responseHeaders = undefined;
    this.status = 0;
    delete this.responseURL;

    this._requestId = null;

    this._cachedResponse = undefined;
    this._hasError = false;
    this._headers = {};
    this._response = '';
    this._responseType = '';
    this._sent = false;
    this._lowerCaseResponseHeaders = {};

    this._clearSubscriptions();
    this._timedOut = false;
  }

  get responseType(): ResponseType {
    return this._responseType;
  }

  set responseType(responseType: ResponseType): void {
    if (this._sent) {
      throw new Error(
        "Failed to set the 'responseType' property on 'XMLHttpRequest': The " +
          'response type cannot be set after the request has been sent.',
      );
    }
    if (!SUPPORTED_RESPONSE_TYPES.hasOwnProperty(responseType)) {
      console.warn(
        `The provided value '${responseType}' is not a valid 'responseType'.`,
      );
      return;
    }

    // redboxes early, e.g. for 'arraybuffer' on ios 7
    invariant(
      SUPPORTED_RESPONSE_TYPES[responseType] || responseType === 'document',
      `The provided value '${responseType}' is unsupported in this environment.`,
    );

    if (responseType === 'blob') {
      invariant(
        BlobManager.isAvailable,
        'Native module BlobModule is required for blob support',
      );
    }
    this._responseType = responseType;
  }

  get responseText(): string {
    if (this._responseType !== '' && this._responseType !== 'text') {
      throw new Error(
        "The 'responseText' property is only available if 'responseType' " +
          `is set to '' or 'text', but it is '${this._responseType}'.`,
      );
    }
    if (this.readyState < LOADING) {
      return '';
    }
    return this._response;
  }

  get response(): Response {
    const {responseType} = this;
    if (responseType === '' || responseType === 'text') {
      return this.readyState < LOADING || this._hasError ? '' : this._response;
    }

    if (this.readyState !== DONE) {
      return null;
    }

    if (this._cachedResponse !== undefined) {
      return this._cachedResponse;
    }

    switch (responseType) {
      case 'document':
        this._cachedResponse = null;
        break;

      case 'arraybuffer':
        this._cachedResponse = base64.toByteArray(this._response).buffer;
        break;

      case 'blob':
        if (typeof this._response === 'object' && this._response) {
          this._cachedResponse = BlobManager.createFromOptions(this._response);
        } else if (this._response === '') {
          this._cachedResponse = BlobManager.createFromParts([]);
        } else {
          throw new Error(
            'Invalid response for blob - expecting object, was ' +
              `${typeof this._response}: ${this._response.trim()}`,
          );
        }
        break;

      case 'json':
        try {
          this._cachedResponse = JSON.parse(this._response);
        } catch {
          this._cachedResponse = null;
        }
        break;

      default:
        this._cachedResponse = null;
    }

    return this._cachedResponse;
  }

  // exposed for testing
  __didCreateRequest(requestId: number): void {
    this._requestId = requestId;

    XMLHttpRequest._interceptor &&
      XMLHttpRequest._interceptor.requestSent(
        requestId,
        this._url || '',
        this._method || 'GET',
        this._headers,
      );
  }

  // exposed for testing
  __didUploadProgress(
    requestId: number,
    progress: number,
    total: number,
  ): void {
    if (requestId === this._requestId) {
      dispatchTrustedEvent(
        this.upload,
        new ProgressEvent('progress', {
          lengthComputable: true,
          loaded: progress,
          total,
        }),
      );
    }
  }

  __didReceiveResponse(
    requestId: number,
    status: number,
    responseHeaders: ?Object,
    responseURL: ?string,
  ): void {
    if (requestId === this._requestId) {
      const performanceLogger = this._performanceLogger;
      if (this._perfKey != null && performanceLogger != null) {
        performanceLogger.stopTimespan(this._perfKey);
      }
      this.status = status;
      this.setResponseHeaders(responseHeaders);
      this.setReadyState(this.HEADERS_RECEIVED);
      if (responseURL || responseURL === '') {
        this.responseURL = responseURL;
      } else {
        delete this.responseURL;
      }

      XMLHttpRequest._interceptor &&
        XMLHttpRequest._interceptor.responseReceived(
          requestId,
          responseURL || this._url || '',
          status,
          responseHeaders || {},
        );
    }
  }

  __didReceiveData(requestId: number, response: string): void {
    if (requestId !== this._requestId) {
      return;
    }
    this._response = response;
    this._cachedResponse = undefined; // force lazy recomputation
    this.setReadyState(this.LOADING);

    XMLHttpRequest._interceptor &&
      XMLHttpRequest._interceptor.dataReceived(requestId, response);
  }

  __didReceiveIncrementalData(
    requestId: number,
    responseText: string,
    progress: number,
    total: number,
  ) {
    if (requestId !== this._requestId) {
      return;
    }

    if (!this._response) {
      this._response = responseText;
    } else {
      this._response += responseText;
    }

    XMLHttpRequest._interceptor &&
      XMLHttpRequest._interceptor.dataReceived(requestId, responseText);

    this.setReadyState(this.LOADING);
    this.__didReceiveDataProgress(requestId, progress, total);
  }

  __didReceiveDataProgress(
    requestId: number,
    loaded: number,
    total: number,
  ): void {
    if (requestId !== this._requestId) {
      return;
    }
    dispatchTrustedEvent(
      this,
      new ProgressEvent('progress', {
        lengthComputable: total >= 0,
        loaded,
        total,
      }),
    );
  }

  // exposed for testing
  __didCompleteResponse(
    requestId: number,
    error: string,
    timeOutError: boolean,
  ): void {
    if (requestId === this._requestId) {
      if (error) {
        if (this._responseType === '' || this._responseType === 'text') {
          this._response = error;
        }
        this._hasError = true;
        if (timeOutError) {
          this._timedOut = true;
        }
      }
      this._clearSubscriptions();
      this._requestId = null;
      this.setReadyState(this.DONE);

      if (error) {
        XMLHttpRequest._interceptor &&
          XMLHttpRequest._interceptor.loadingFailed(requestId, error);
      } else {
        XMLHttpRequest._interceptor &&
          XMLHttpRequest._interceptor.loadingFinished(
            requestId,
            this._response.length,
          );
      }
    }
  }

  _clearSubscriptions(): void {
    (this._subscriptions || []).forEach(sub => {
      if (sub) {
        sub.remove();
      }
    });
    this._subscriptions = [];
  }

  getAllResponseHeaders(): ?string {
    if (!this.responseHeaders) {
      // according to the spec, return null if no response has been received
      return null;
    }

    // Assign to non-nullable local variable.
    const responseHeaders = this.responseHeaders;

    const unsortedHeaders: Map<
      string,
      {lowerHeaderName: string, upperHeaderName: string, headerValue: string},
    > = new Map();
    for (const rawHeaderName of Object.keys(responseHeaders)) {
      const headerValue = responseHeaders[rawHeaderName];
      const lowerHeaderName = rawHeaderName.toLowerCase();
      const header = unsortedHeaders.get(lowerHeaderName);
      if (header) {
        header.headerValue += ', ' + headerValue;
        unsortedHeaders.set(lowerHeaderName, header);
      } else {
        unsortedHeaders.set(lowerHeaderName, {
          lowerHeaderName,
          upperHeaderName: rawHeaderName.toUpperCase(),
          headerValue,
        });
      }
    }

    // Sort in ascending order, with a being less than b if a's name is legacy-uppercased-byte less than b's name.
    const sortedHeaders = [...unsortedHeaders.values()].sort((a, b) => {
      if (a.upperHeaderName < b.upperHeaderName) {
        return -1;
      }
      if (a.upperHeaderName > b.upperHeaderName) {
        return 1;
      }
      return 0;
    });

    // Combine into single text response.
    return (
      sortedHeaders
        .map(header => {
          return header.lowerHeaderName + ': ' + header.headerValue;
        })
        .join('\r\n') + '\r\n'
    );
  }

  getResponseHeader(header: string): ?string {
    const value = this._lowerCaseResponseHeaders[header.toLowerCase()];
    return value !== undefined ? value : null;
  }

  setRequestHeader(header: string, value: any): void {
    if (this.readyState !== this.OPENED) {
      throw new Error('Request has not been opened');
    }
    this._headers[header.toLowerCase()] = String(value);
  }

  /**
   * Custom extension for tracking origins of request.
   */
  setTrackingName(trackingName: ?string): XMLHttpRequest {
    this._trackingName = trackingName;
    return this;
  }

  /**
   * Custom extension that lets callers attach a performance logger receiving
   * a `network_XMLHttpRequest_<friendlyName>` start/stop timespan around each
   * dispatched request. The logger only needs to implement
   * `startTimespan(key)` / `stopTimespan(key)` (see the `XHRPerformanceLogger`
   * interface above). When no logger is set the timespan is not emitted.
   */
  setPerformanceLogger(
    performanceLogger: XHRPerformanceLogger,
  ): XMLHttpRequest {
    this._performanceLogger = performanceLogger;
    return this;
  }

  open(method: string, url: string, async: ?boolean): void {
    /* Other optional arguments are not supported yet */
    if (this.readyState !== this.UNSENT) {
      throw new Error('Cannot open, already sending');
    }
    if (async !== undefined && !async) {
      // async is default
      throw new Error('Synchronous http requests are not supported');
    }
    if (!url) {
      throw new Error('Cannot load an empty url');
    }
    this._method = method.toUpperCase();
    this._url = url;
    this._aborted = false;
    this.setReadyState(this.OPENED);
  }

  send(data: any): void {
    if (this.readyState !== this.OPENED) {
      throw new Error('Request has not been opened');
    }
    if (this._sent) {
      throw new Error('Request has already been sent');
    }
    this._sent = true;
    const incrementalEvents =
      this._incrementalEvents || !!this.onreadystatechange || !!this.onprogress;

    this._subscriptions.push(
      RCTNetworking.addListener('didSendNetworkData', args =>
        this.__didUploadProgress(...args),
      ),
    );
    this._subscriptions.push(
      RCTNetworking.addListener('didReceiveNetworkResponse', args =>
        this.__didReceiveResponse(...args),
      ),
    );
    this._subscriptions.push(
      RCTNetworking.addListener('didReceiveNetworkData', args =>
        this.__didReceiveData(...args),
      ),
    );
    this._subscriptions.push(
      RCTNetworking.addListener('didReceiveNetworkIncrementalData', args =>
        this.__didReceiveIncrementalData(...args),
      ),
    );
    this._subscriptions.push(
      RCTNetworking.addListener('didReceiveNetworkDataProgress', args =>
        this.__didReceiveDataProgress(...args),
      ),
    );
    this._subscriptions.push(
      RCTNetworking.addListener('didCompleteNetworkResponse', args =>
        this.__didCompleteResponse(...args),
      ),
    );

    let nativeResponseType: NativeResponseType = 'text';
    if (this._responseType === 'arraybuffer') {
      nativeResponseType = 'base64';
    }
    if (this._responseType === 'blob') {
      nativeResponseType = 'blob';
    }

    const doSend = () => {
      const friendlyName = this._trackingName ?? this._url;
      const performanceLogger = this._performanceLogger;
      if (performanceLogger != null) {
        this._perfKey = 'network_XMLHttpRequest_' + String(friendlyName);
        performanceLogger.startTimespan(this._perfKey);
      }
      invariant(
        this._method,
        'XMLHttpRequest method needs to be defined (%s).',
        friendlyName,
      );
      invariant(
        this._url,
        'XMLHttpRequest URL needs to be defined (%s).',
        friendlyName,
      );
      RCTNetworking.sendRequest(
        this._method,
        this._trackingName ?? undefined,
        this._url,
        this._headers,
        data,
        nativeResponseType,
        incrementalEvents,
        this.timeout,
        // $FlowFixMe[method-unbinding] added when improving typing for this parameters
        this.__didCreateRequest.bind(this),
        this.withCredentials,
      );
    };
    /* $FlowFixMe[constant-condition] Error discovered during Constant
     * Condition roll out. See https://fburl.com/workplace/1v97vimq. */
    if (DEBUG_NETWORK_SEND_DELAY) {
      setTimeout(doSend, DEBUG_NETWORK_SEND_DELAY);
    } else {
      doSend();
    }
  }

  abort(): void {
    this._aborted = true;
    if (this._requestId) {
      RCTNetworking.abortRequest(this._requestId);
    }
    // only call onreadystatechange if there is something to abort,
    // below logic is per spec
    if (
      !(
        this.readyState === this.UNSENT ||
        (this.readyState === this.OPENED && !this._sent) ||
        this.readyState === this.DONE
      )
    ) {
      this._reset();
      this.setReadyState(this.DONE);
    }
    // Reset again after, in case modified in handler
    this._reset();
  }

  setResponseHeaders(responseHeaders: ?Object): void {
    this.responseHeaders = responseHeaders || null;
    const headers = responseHeaders || {};
    this._lowerCaseResponseHeaders = Object.keys(headers).reduce<{
      [string]: any,
    }>((lcaseHeaders, headerName) => {
      // $FlowFixMe[invalid-computed-prop]
      lcaseHeaders[headerName.toLowerCase()] = headers[headerName];
      return lcaseHeaders;
    }, {});
  }

  setReadyState(newState: number): void {
    this.readyState = newState;
    dispatchTrustedEvent(this, new Event('readystatechange'));
    if (newState === this.DONE) {
      if (this._aborted) {
        dispatchTrustedEvent(this, new Event('abort'));
      } else if (this._hasError) {
        if (this._timedOut) {
          dispatchTrustedEvent(this, new Event('timeout'));
        } else {
          dispatchTrustedEvent(this, new Event('error'));
        }
      } else {
        dispatchTrustedEvent(this, new Event('load'));
      }
      dispatchTrustedEvent(this, new Event('loadend'));
    }
  }

  addEventListener(type: string, listener: EventListener | null): void {
    // If we dont' have a 'readystatechange' event handler, we don't
    // have to send repeated LOADING events with incremental updates
    // to responseText, which will avoid a bunch of native -> JS
    // bridge traffic.
    if (type === 'readystatechange' || type === 'progress') {
      this._incrementalEvents = true;
    }
    super.addEventListener(type, listener);
  }

  /*
   * `on<event>` event handling (without JS prototype magic).
   */

  get onabort(): EventCallback | null {
    return getEventHandlerAttribute(this, 'abort');
  }

  set onabort(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'abort', listener);
  }

  get onerror(): EventCallback | null {
    return getEventHandlerAttribute(this, 'error');
  }

  set onerror(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'error', listener);
  }

  get onload(): EventCallback | null {
    return getEventHandlerAttribute(this, 'load');
  }

  set onload(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'load', listener);
  }

  get onloadstart(): EventCallback | null {
    return getEventHandlerAttribute(this, 'loadstart');
  }

  set onloadstart(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'loadstart', listener);
  }

  get onprogress(): EventCallback | null {
    return getEventHandlerAttribute(this, 'progress');
  }

  set onprogress(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'progress', listener);
  }

  get ontimeout(): EventCallback | null {
    return getEventHandlerAttribute(this, 'timeout');
  }

  set ontimeout(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'timeout', listener);
  }

  get onloadend(): EventCallback | null {
    return getEventHandlerAttribute(this, 'loadend');
  }

  set onloadend(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'loadend', listener);
  }

  get onreadystatechange(): EventCallback | null {
    return getEventHandlerAttribute(this, 'readystatechange');
  }

  set onreadystatechange(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'readystatechange', listener);
  }
}

export default XMLHttpRequest;
