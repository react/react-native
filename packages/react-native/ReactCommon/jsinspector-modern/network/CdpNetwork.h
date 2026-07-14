/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>

#include <string>

// Data containers for CDP Network domain types, supporting serialization to
// folly::dynamic objects.

namespace facebook::react::jsinspector_modern::cdp::network {

using Headers = std::map<std::string, std::string>;

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-Request
 */
struct Request {
  std::string url;
  std::string method;
  Headers headers;
  std::optional<std::string> postData;

  folly::dynamic toDynamic() const;
};

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-Response
 */
struct Response {
  std::string url;
  uint16_t status;
  std::string statusText;
  Headers headers;
  std::string mimeType;
  int encodedDataLength;

  /**
   * Convenience function to construct a `Response` from the generic
   * `ResponseInfo` input object.
   */
  static Response
  fromInputParams(const std::string &url, uint16_t status, const Headers &headers, int encodedDataLength);

  folly::dynamic toDynamic() const;
};

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-ConnectTiming
 */
struct ConnectTiming {
  double requestTime;
};

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-requestWillBeSent
 */
struct RequestWillBeSentParams {
  std::string requestId;
  std::string loaderId;
  std::string documentURL;
  Request request;
  double timestamp;
  double wallTime;
  folly::dynamic initiator;
  bool redirectHasExtraInfo;
  std::optional<Response> redirectResponse;

  folly::dynamic toDynamic() const;
};

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-requestWillBeSentExtraInfo
 */
struct RequestWillBeSentExtraInfoParams {
  std::string requestId;
  Headers headers;
  ConnectTiming connectTiming;

  folly::dynamic toDynamic() const;
};

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-responseReceived
 */
struct ResponseReceivedParams {
  std::string requestId;
  std::string loaderId;
  double timestamp;
  std::string type;
  Response response;
  bool hasExtraInfo;

  folly::dynamic toDynamic() const;
};

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-dataReceived
 */
struct DataReceivedParams {
  std::string requestId;
  double timestamp;
  int dataLength;
  int encodedDataLength;

  folly::dynamic toDynamic() const;
};

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-loadingFailed
 */
struct LoadingFailedParams {
  std::string requestId;
  double timestamp;
  std::string type;
  std::string errorText;
  bool canceled;

  folly::dynamic toDynamic() const;
};

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-loadingFinished
 */
struct LoadingFinishedParams {
  std::string requestId;
  double timestamp;
  int encodedDataLength;

  folly::dynamic toDynamic() const;
};

/**
 * HTTP response data for a WebSocket handshake (upgrade) request.
 *
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-WebSocketResponse
 */
struct WebSocketResponse {
  uint16_t status;
  std::string statusText;
  Headers headers;

  /**
   * Convenience function to construct a `WebSocketResponse` from generic
   * input params, deriving the status text.
   */
  static WebSocketResponse fromInputParams(uint16_t status, const Headers &headers);

  folly::dynamic toDynamic() const;
};

/**
 * A WebSocket message payload. NOTE: Despite the CDP type name, this
 * represents a complete WebSocket message, not a wire-level frame.
 *
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-WebSocketFrame
 */
struct WebSocketFrame {
  int opcode;
  bool mask;
  std::string payloadData;

  folly::dynamic toDynamic() const;
};

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-webSocketCreated
 */
struct WebSocketCreatedParams {
  std::string requestId;
  std::string url;
  folly::dynamic initiator;

  folly::dynamic toDynamic() const;
};

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-webSocketWillSendHandshakeRequest
 */
struct WebSocketWillSendHandshakeRequestParams {
  std::string requestId;
  double timestamp;
  double wallTime;
  /** Serialized as the `headers` field of the CDP `WebSocketRequest` type. */
  Headers headers;

  folly::dynamic toDynamic() const;
};

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-webSocketHandshakeResponseReceived
 */
struct WebSocketHandshakeResponseReceivedParams {
  std::string requestId;
  double timestamp;
  WebSocketResponse response;

  folly::dynamic toDynamic() const;
};

/**
 * Shared params type for the `Network.webSocketFrameSent` and
 * `Network.webSocketFrameReceived` events.
 *
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-webSocketFrameSent
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-webSocketFrameReceived
 */
struct WebSocketFrameParams {
  std::string requestId;
  double timestamp;
  WebSocketFrame response;

  folly::dynamic toDynamic() const;
};

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-webSocketClosed
 */
struct WebSocketClosedParams {
  std::string requestId;
  double timestamp;

  folly::dynamic toDynamic() const;
};

/**
 * Get the CDP `ResourceType` for a given MIME type.
 *
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-ResourceType
 */
std::string resourceTypeFromMimeType(const std::string &mimeType);

} // namespace facebook::react::jsinspector_modern::cdp::network
