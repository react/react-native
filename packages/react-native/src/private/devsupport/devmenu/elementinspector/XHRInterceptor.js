/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import typeof XMLHttpRequestT from '../../../../../Libraries/Network/XMLHttpRequest';

const XMLHttpRequest: XMLHttpRequestT =
  require('../../../../../Libraries/Network/XMLHttpRequest').default;
// $FlowFixMe[method-unbinding]
const originalXHROpen = XMLHttpRequest.prototype.open;
// $FlowFixMe[method-unbinding]
const originalXHRSend = XMLHttpRequest.prototype.send;
// $FlowFixMe[method-unbinding]
const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

type XHRInterceptorOpenCallback = (
  method: string,
  url: string,
  request: XMLHttpRequest,
) => void;

type XHRInterceptorSendCallback = (
  data: string,
  request: XMLHttpRequest,
) => void;

type XHRInterceptorRequestHeaderCallback = (
  header: string,
  value: string,
  request: XMLHttpRequest,
) => void;

type XHRInterceptorHeaderReceivedCallback = (
  responseContentType: string | void,
  responseSize: number | void,
  allHeaders: string,
  request: XMLHttpRequest,
) => void;

type XHRInterceptorResponseCallback = (
  status: number,
  timeout: number,
  response: string,
  responseURL: string,
  responseType: string,
  request: XMLHttpRequest,
) => void;

let openCallback: XHRInterceptorOpenCallback | null;
let sendCallback: XHRInterceptorSendCallback | null;
let requestHeaderCallback: XHRInterceptorRequestHeaderCallback | null;
let headerReceivedCallback: XHRInterceptorHeaderReceivedCallback | null;
let responseCallback: XHRInterceptorResponseCallback | null;

let isInterceptorEnabled = false;

/**
 * A network interceptor which monkey-patches XMLHttpRequest methods
 * to gather all network requests/responses.
 * This supports interception with XMLHttpRequest API, including Fetch API
 * and any other third party libraries that depend on XMLHttpRequest.
 *
 * @deprecated Since React Native 0.84
 */
const XHRInterceptor = {
  /**
   * Invoked before XMLHttpRequest.open(...) is called.
   */
  setOpenCallback(callback: XHRInterceptorOpenCallback) {
    openCallback = callback;
  },

  /**
   * Invoked before XMLHttpRequest.send(...) is called.
   */
  setSendCallback(callback: XHRInterceptorSendCallback) {
    sendCallback = callback;
  },

  /**
   * Invoked after xhr's readyState becomes xhr.HEADERS_RECEIVED.
   */
  setHeaderReceivedCallback(callback: XHRInterceptorHeaderReceivedCallback) {
    headerReceivedCallback = callback;
  },

  /**
   * Invoked after xhr's readyState becomes xhr.DONE.
   */
  setResponseCallback(callback: XHRInterceptorResponseCallback) {
    responseCallback = callback;
  },

  /**
   * Invoked before XMLHttpRequest.setRequestHeader(...) is called.
   */
  setRequestHeaderCallback(callback: XHRInterceptorRequestHeaderCallback) {
    requestHeaderCallback = callback;
  },

  isInterceptorEnabled(): boolean {
    return isInterceptorEnabled;
  },

  enableInterception() {
    if (isInterceptorEnabled) {
      return;
    }
    // Override `open` method for all XHR requests to intercept the request
    // method and url, then pass them through the `openCallback`.
    // $FlowFixMe[cannot-write]
    // $FlowFixMe[missing-this-annot]
    XMLHttpRequest.prototype.open = function (method: string, url: string) {
      if (openCallback) {
        openCallback(method, url, this);
      }
      /* $FlowFixMe[invalid-this-arg] Error exposed after fixing this typing
       * unsoundness in flow */
      originalXHROpen.apply(this, arguments);
    };

    // Override `setRequestHeader` method for all XHR requests to intercept
    // the request headers, then pass them through the `requestHeaderCallback`.
    // $FlowFixMe[cannot-write]
    // $FlowFixMe[missing-this-annot]
    XMLHttpRequest.prototype.setRequestHeader = function (
      header: string,
      value: string,
    ) {
      if (requestHeaderCallback) {
        requestHeaderCallback(header, value, this);
      }
      /* $FlowFixMe[invalid-this-arg] Error exposed after fixing this typing
       * unsoundness in flow */
      originalXHRSetRequestHeader.apply(this, arguments);
    };

    // Override `send` method of all XHR requests to intercept the data sent,
    // register listeners to intercept the response, and invoke the callbacks.
    // $FlowFixMe[cannot-write]
    // $FlowFixMe[missing-this-annot]
    XMLHttpRequest.prototype.send = function (data: string) {
      if (sendCallback) {
        sendCallback(data, this);
      }
      if (this.addEventListener) {
        this.addEventListener(
          'readystatechange',
          () => {
            if (!isInterceptorEnabled) {
              return;
            }
            if (this.readyState === this.HEADERS_RECEIVED) {
              const contentTypeString = this.getResponseHeader('Content-Type');
              const contentLengthString =
                this.getResponseHeader('Content-Length');
              let responseContentType, responseSize;
              if (contentTypeString) {
                responseContentType = contentTypeString.split(';')[0];
              }
              if (contentLengthString) {
                responseSize = parseInt(contentLengthString, 10);
              }
              if (headerReceivedCallback) {
                headerReceivedCallback(
                  responseContentType,
                  responseSize,
                  this.getAllResponseHeaders(),
                  this,
                );
              }
            }
            if (this.readyState === this.DONE) {
              if (responseCallback) {
                responseCallback(
                  this.status,
                  this.timeout,
                  this.response,
                  this.responseURL,
                  this.responseType,
                  this,
                );
              }
            }
          },
          false,
        );
      }
      /* $FlowFixMe[invalid-this-arg] Error exposed after fixing this typing
       * unsoundness in flow */
      originalXHRSend.apply(this, arguments);
    };
    isInterceptorEnabled = true;
  },

  // Unpatch XMLHttpRequest methods and remove the callbacks.
  disableInterception() {
    if (!isInterceptorEnabled) {
      return;
    }
    isInterceptorEnabled = false;
    // $FlowFixMe[cannot-write]
    XMLHttpRequest.prototype.send = originalXHRSend;
    // $FlowFixMe[cannot-write]
    XMLHttpRequest.prototype.open = originalXHROpen;
    // $FlowFixMe[cannot-write]
    XMLHttpRequest.prototype.setRequestHeader = originalXHRSetRequestHeader;
    responseCallback = null;
    openCallback = null;
    sendCallback = null;
    headerReceivedCallback = null;
    requestHeaderCallback = null;
  },
};

export default XHRInterceptor;
