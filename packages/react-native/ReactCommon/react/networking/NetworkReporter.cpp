/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NetworkReporter.h"

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
#include <jsinspector-modern/network/CdpNetwork.h>
#include <jsinspector-modern/network/NetworkHandler.h>
#include <jsinspector-modern/tracing/PerformanceTracer.h>
#endif
#include <jsinspector-modern/network/HttpUtils.h>
#include <react/performance/timeline/PerformanceEntryReporter.h>

namespace facebook::react {

NetworkReporter& NetworkReporter::getInstance() {
  static NetworkReporter instance;
  return instance;
}

bool NetworkReporter::isDebuggingEnabled() const {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  return jsinspector_modern::NetworkHandler::getInstance().isEnabled();
#else
  return false;
#endif
}

void NetworkReporter::reportRequestStart(
    const std::string& requestId,
    const RequestInfo& requestInfo,
    int encodedDataLength,
    const std::optional<ResponseInfo>& redirectResponse) {
  auto now = HighResTimeStamp::now();

  // All builds: Annotate PerformanceResourceTiming metadata
  {
    std::lock_guard<std::mutex> lock(perfTimingsMutex_);
    perfTimingsBuffer_.emplace(
        requestId,
        ResourceTimingData{
            .url = requestInfo.url,
            .fetchStart = now,
            .requestStart = now,
        });
  }

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  auto headers = requestInfo.headers.value_or(Headers{});

  // Debugger enabled: CDP event handling
  jsinspector_modern::NetworkHandler::getInstance().onRequestWillBeSent(
      requestId,
      {
          .url = requestInfo.url,
          .method = requestInfo.httpMethod,
          .headers = headers,
          .postData = requestInfo.httpBody,
      },
      redirectResponse.has_value()
          ? std::optional<jsinspector_modern::cdp::network::Response>(
                jsinspector_modern::cdp::network::Response::fromInputParams(
                    redirectResponse->url,
                    redirectResponse->statusCode,
                    redirectResponse->headers.value_or(Headers{}),
                    encodedDataLength))
          : std::nullopt);

  // Debugger enabled: Add trace events to Performance timeline
  auto& performanceTracer =
      jsinspector_modern::tracing::PerformanceTracer::getInstance();
  performanceTracer.reportResourceSendRequest(
      requestId, now, requestInfo.url, requestInfo.httpMethod, headers);
#endif
}

void NetworkReporter::reportConnectionTiming(
    const std::string& requestId,
    const std::optional<Headers>& headers) {
  auto now = HighResTimeStamp::now();

  // All builds: Annotate PerformanceResourceTiming metadata
  {
    std::lock_guard<std::mutex> lock(perfTimingsMutex_);
    auto it = perfTimingsBuffer_.find(requestId);
    if (it != perfTimingsBuffer_.end()) {
      it->second.connectStart = now;
    }
  }

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debugger enabled: CDP event handling
  jsinspector_modern::NetworkHandler::getInstance()
      .onRequestWillBeSentExtraInfo(requestId, headers.value_or(Headers{}));
#endif
}

void NetworkReporter::reportResponseStart(
    const std::string& requestId,
    const ResponseInfo& responseInfo,
    int encodedDataLength) {
  auto now = HighResTimeStamp::now();
  auto headers = responseInfo.headers.value_or(Headers{});

  // All builds: Annotate PerformanceResourceTiming metadata
  {
    std::lock_guard<std::mutex> lock(perfTimingsMutex_);
    auto it = perfTimingsBuffer_.find(requestId);
    if (it != perfTimingsBuffer_.end()) {
      auto contentType = jsinspector_modern::mimeTypeFromHeaders(headers);
      it->second.connectEnd = now;
      it->second.responseStart = now;
      it->second.responseStatus = responseInfo.statusCode;
      it->second.contentType = contentType;
      it->second.encodedBodySize = encodedDataLength;
      it->second.decodedBodySize = encodedDataLength;
    }
  }

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debugger enabled: CDP event handling
  jsinspector_modern::NetworkHandler::getInstance().onResponseReceived(
      requestId,
      jsinspector_modern::cdp::network::Response::fromInputParams(
          responseInfo.url,
          responseInfo.statusCode,
          headers,
          encodedDataLength));

  // Debugger enabled: Add trace event to Performance timeline
  {
    folly::dynamic timingData = folly::dynamic::object();

    std::lock_guard<std::mutex> lock(perfTimingsMutex_);
    auto it = perfTimingsBuffer_.find(requestId);
    if (it != perfTimingsBuffer_.end()) {
      // TODO(T238364329): All relative values in timingData should be based on
      // fetchStart, once implemented.
      auto requestStart = it->second.requestStart;
      timingData["requestTime"] = requestStart.toDOMHighResTimeStamp() / 1000;
      timingData["sendStart"] = 0;
      timingData["sendEnd"] =
          (*it->second.connectStart - requestStart).toDOMHighResTimeStamp();
      timingData["receiveHeadersStart"] =
          (*it->second.connectStart - requestStart).toDOMHighResTimeStamp();
      timingData["receiveHeadersEnd"] =
          (now - requestStart).toDOMHighResTimeStamp();
    }

    jsinspector_modern::tracing::PerformanceTracer::getInstance()
        .reportResourceReceiveResponse(
            requestId,
            now,
            responseInfo.statusCode,
            headers,
            encodedDataLength,
            std::move(timingData));
  }
#endif
}

void NetworkReporter::reportDataReceived(
    const std::string& requestId,
    int dataLength,
    const std::optional<int>& encodedDataLength) {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  auto now = HighResTimeStamp::now();

  // Debugger enabled: CDP event handling
  jsinspector_modern::NetworkHandler::getInstance().onDataReceived(
      requestId, dataLength, encodedDataLength.value_or(dataLength));

  // Debugger enabled: Add trace event to Performance timeline
  jsinspector_modern::tracing::PerformanceTracer::getInstance()
      .reportResourceReceivedData(
          requestId, now, encodedDataLength.value_or(dataLength));
#endif
}

void NetworkReporter::reportResponseEnd(
    const std::string& requestId,
    int encodedDataLength) {
  auto now = HighResTimeStamp::now();

  // All builds: Report PerformanceResourceTiming event
  {
    std::lock_guard<std::mutex> lock(perfTimingsMutex_);
    auto it = perfTimingsBuffer_.find(requestId);
    if (it != perfTimingsBuffer_.end()) {
      auto& eventData = it->second;
      PerformanceEntryReporter::getInstance()->reportResourceTiming(
          eventData.url,
          eventData.fetchStart,
          eventData.requestStart,
          eventData.connectStart.value_or(now),
          eventData.connectEnd.value_or(now),
          eventData.responseStart.value_or(now),
          now,
          eventData.responseStatus,
          eventData.contentType,
          eventData.encodedBodySize,
          eventData.decodedBodySize);
      perfTimingsBuffer_.erase(requestId);
    }
  }

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debugger enabled: CDP event handling
  jsinspector_modern::NetworkHandler::getInstance().onLoadingFinished(
      requestId, encodedDataLength);

  // Debugger enabled: Add trace event to Performance timeline
  {
    int decodedBodyLength = 0;

    std::lock_guard<std::mutex> lock(perfTimingsMutex_);
    auto it = perfTimingsBuffer_.find(requestId);
    if (it != perfTimingsBuffer_.end() &&
        it->second.contentType.starts_with("image/")) {
      decodedBodyLength = it->second.decodedBodySize;
    }

    jsinspector_modern::tracing::PerformanceTracer::getInstance()
        .reportResourceFinish(
            requestId, now, encodedDataLength, decodedBodyLength);
  }
#endif
}

void NetworkReporter::reportRequestFailed(
    const std::string& requestId,
    bool cancelled) const {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debugger enabled: CDP event handling
  jsinspector_modern::NetworkHandler::getInstance().onLoadingFailed(
      requestId, cancelled);
#endif
}

void NetworkReporter::reportWebSocketCreated(
    const std::string& requestId,
    const std::string& url) const {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debugger enabled: CDP event handling
  jsinspector_modern::NetworkHandler::getInstance().onWebSocketCreated(
      requestId, url);
#endif
}

void NetworkReporter::reportWebSocketWillSendHandshakeRequest(
    const std::string& requestId,
    const Headers& headers) const {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debugger enabled: CDP event handling
  jsinspector_modern::NetworkHandler::getInstance()
      .onWebSocketWillSendHandshakeRequest(requestId, headers);
#endif
}

void NetworkReporter::reportWebSocketHandshakeResponseReceived(
    const std::string& requestId,
    uint16_t statusCode,
    const Headers& headers) const {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debugger enabled: CDP event handling
  jsinspector_modern::NetworkHandler::getInstance()
      .onWebSocketHandshakeResponseReceived(requestId, statusCode, headers);
#endif
}

void NetworkReporter::reportWebSocketMessageSent(
    const std::string& requestId,
    const std::string& payloadData,
    bool isBinary) const {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debugger enabled: CDP event handling
  jsinspector_modern::NetworkHandler::getInstance().onWebSocketFrameSent(
      requestId, payloadData, isBinary);
#endif
}

void NetworkReporter::reportWebSocketMessageReceived(
    const std::string& requestId,
    const std::string& payloadData,
    bool isBinary) const {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debugger enabled: CDP event handling
  jsinspector_modern::NetworkHandler::getInstance().onWebSocketFrameReceived(
      requestId, payloadData, isBinary);
#endif
}

void NetworkReporter::reportWebSocketClosed(
    const std::string& requestId) const {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debugger enabled: CDP event handling
  jsinspector_modern::NetworkHandler::getInstance().onWebSocketClosed(
      requestId);
#endif
}

void NetworkReporter::storeResponseBody(
    const std::string& requestId,
    std::string_view body,
    bool base64Encoded) {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debugger enabled: Store fetched response body for later CDP retrieval
  jsinspector_modern::NetworkHandler::getInstance().storeResponseBody(
      requestId, body, base64Encoded);
#endif
}

} // namespace facebook::react
