/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "NetworkTypes.h"

#include <react/timing/primitives.h>

#include <mutex>
#include <string>
#include <unordered_map>

namespace facebook::react {

/**
 * Container for static network event metadata aligning with the
 * `PerformanceResourceTiming` interface.
 *
 * This is a lightweight type stored in `perfTimingsBuffer_` and used for
 * reporting complete events to the Web Performance subsystem. Not used for CDP
 * reporting.
 */
struct ResourceTimingData {
  std::string url{};
  HighResTimeStamp fetchStart{};
  HighResTimeStamp requestStart{};
  std::optional<HighResTimeStamp> connectStart{};
  std::optional<HighResTimeStamp> connectEnd{};
  std::optional<HighResTimeStamp> responseStart{};
  int responseStatus = 0;
  std::string contentType{};
  int encodedBodySize = 0;
  int decodedBodySize = 0;
};

/**
 * [Experimental] An interface for reporting network events to the modern
 * debugger server and Web Performance APIs.
 *
 * In a production (non dev or profiling) build, CDP reporting is disabled.
 */
class NetworkReporter {
 public:
  static NetworkReporter &getInstance();

  /**
   * Returns whether network tracking over CDP is currently enabled.
   */
  bool isDebuggingEnabled() const;

  /**
   * Report a network request that is about to be sent.
   *
   * - Corresponds to `Network.requestWillBeSent` and the
   *   "ResourceWillSendRequest" trace event in CDP.
   * - Corresponds to `PerformanceResourceTiming.requestStart` (specifically,
   *   marking when the native request was initiated).
   *
   * https://w3c.github.io/resource-timing/#dom-performanceresourcetiming-requeststart
   */
  void reportRequestStart(
      const std::string &requestId,
      const RequestInfo &requestInfo,
      int encodedDataLength,
      const std::optional<ResponseInfo> &redirectResponse);

  /**
   * Report timestamp for sending the network request, and (in a debug build)
   * provide final headers to be reported via CDP.
   *
   * - Corresponds to `Network.requestWillBeSentExtraInfo` and the
   *   "ResourceSendRequest" trace event in CDP.
   * - Corresponds to `PerformanceResourceTiming.domainLookupStart`,
   *   `PerformanceResourceTiming.connectStart`. Defined as "immediately before
   *   the browser starts to establish the connection to the server".
   *
   * https://w3c.github.io/resource-timing/#dom-performanceresourcetiming-connectstart
   */
  void reportConnectionTiming(const std::string &requestId, const std::optional<Headers> &headers);

  /**
   * Report when HTTP response headers have been received, corresponding to
   * when the first byte of the response is available.
   *
   * - Corresponds to `Network.responseReceived` and the
   *   "ResourceReceiveResponse" trace event in CDP.
   * - Corresponds to `PerformanceResourceTiming.responseStart`.
   *
   * https://w3c.github.io/resource-timing/#dom-performanceresourcetiming-responsestart
   */
  void reportResponseStart(const std::string &requestId, const ResponseInfo &responseInfo, int encodedDataLength);

  /**
   * Report when additional chunks of the response body have been received.
   *
   * Corresponds to `Network.dataReceived` in CDP (used for progress bar
   * rendering).
   */
  void reportDataReceived(const std::string &requestId, int dataLength, const std::optional<int> &encodedDataLength);

  /**
   * Report when a network request is complete and we are no longer receiving
   * response data.
   *
   * - Corresponds to `Network.loadingFinished` and the "ResourceFinish" trace
   *   event in CDP.
   * - Corresponds to `PerformanceResourceTiming.responseEnd`.
   *
   * https://w3c.github.io/resource-timing/#dom-performanceresourcetiming-responseend
   */
  void reportResponseEnd(const std::string &requestId, int encodedDataLength);

  /**
   * Report when a network request has failed.
   *
   * Corresponds to `Network.loadingFailed` in CDP.
   */
  void reportRequestFailed(const std::string &requestId, bool cancelled) const;

  /**
   * Store the fetched response body for a text or image network response.
   * These may be retrieved by CDP clients to to render a response preview via
   * `Network.getReponseBody`.
   *
   * Reponse bodies are stored in a bounded buffer with a fixed maximum memory
   * size, where oldest responses will be evicted if the buffer is exceeded.
   *
   * Should be called after checking \ref NetworkReporter::isDebuggingEnabled.
   */
  void storeResponseBody(const std::string &requestId, std::string_view body, bool base64Encoded);

 private:
  NetworkReporter() = default;
  NetworkReporter(const NetworkReporter &) = delete;
  NetworkReporter &operator=(const NetworkReporter &) = delete;
  ~NetworkReporter() = default;

  std::unordered_map<std::string, ResourceTimingData> perfTimingsBuffer_{};
  std::mutex perfTimingsMutex_;
};

} // namespace facebook::react
