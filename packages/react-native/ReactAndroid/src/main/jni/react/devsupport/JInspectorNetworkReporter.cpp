/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JInspectorNetworkReporter.h"

#include <react/networking/NetworkReporter.h>

#include <cstddef>
#include <string>
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
#include <mutex>
#include <unordered_map>
#endif

using namespace facebook::jni;

namespace facebook::react::jsinspector_modern {

namespace {

Headers convertJavaMapToHeaders(
    jni::alias_ref<jni::JMap<jstring, jstring>> headers) {
  Headers responseHeaders;

  for (auto it : *headers) {
    auto key = it.first->toStdString();
    auto value = it.second->toStdString();
    responseHeaders[key] = value;
  }

  return responseHeaders;
}

std::string limitRequestBodySize(std::string requestBody) {
  const size_t maxBodySize = 1024 * 1024; // 1MB
  auto bodyLength = requestBody.size();
  auto bytesToRead = std::min(bodyLength, maxBodySize);

  requestBody.resize(bytesToRead);

  if (bytesToRead < bodyLength) {
    requestBody += "\n... [truncated, showing " + std::to_string(bytesToRead) +
        " of " + std::to_string(bodyLength) + " bytes]";
  }

  return requestBody;
}

RequestInfo convertToRequestInfo(
    jni::alias_ref<jstring> requestUrl,
    jni::alias_ref<jstring> requestMethod,
    jni::alias_ref<jni::JMap<jstring, jstring>> requestHeaders,
    jni::alias_ref<jstring> requestBody) {
  RequestInfo requestInfo;
  requestInfo.url = requestUrl->toStdString();
  requestInfo.httpMethod = requestMethod->toStdString();
  requestInfo.headers = convertJavaMapToHeaders(requestHeaders);
  requestInfo.httpBody = limitRequestBodySize(requestBody->toStdString());
  return requestInfo;
}

} // namespace

#ifdef REACT_NATIVE_DEBUGGER_ENABLED

// Dictionary to buffer incremental response bodies (CDP debugging active only)
static std::unordered_map<std::string, std::string> responseBuffers;
// Requests report from different threads, so every access holds this
static std::mutex responseBuffersMutex;

#endif

/* static */ jboolean JInspectorNetworkReporter::isDebuggingEnabled(
    jni::alias_ref<jclass> /*unused*/) {
  return static_cast<jboolean>(
      NetworkReporter::getInstance().isDebuggingEnabled());
}

/* static */ void JInspectorNetworkReporter::reportRequestStart(
    jni::alias_ref<jclass> /*unused*/,
    jni::alias_ref<jstring> requestId,
    jni::alias_ref<jstring> requestUrl,
    jni::alias_ref<jstring> requestMethod,
    jni::alias_ref<jni::JMap<jstring, jstring>> requestHeaders,
    jni::alias_ref<jstring> requestBody,
    jlong encodedDataLength) {
  NetworkReporter::getInstance().reportRequestStart(
      requestId->toStdString(),
      convertToRequestInfo(
          requestUrl, requestMethod, requestHeaders, requestBody),
      encodedDataLength,
      std::nullopt);
}

/* static */ void JInspectorNetworkReporter::reportRequestStartWithRedirect(
    jni::alias_ref<jclass> /*unused*/,
    jni::alias_ref<jstring> requestId,
    jni::alias_ref<jstring> requestUrl,
    jni::alias_ref<jstring> requestMethod,
    jni::alias_ref<jni::JMap<jstring, jstring>> requestHeaders,
    jni::alias_ref<jstring> requestBody,
    jlong encodedDataLength,
    jni::alias_ref<jstring> redirectResponseUrl,
    jint redirectResponseStatus,
    jni::alias_ref<jni::JMap<jstring, jstring>> redirectResponseHeaders) {
  ResponseInfo redirectResponse;
  redirectResponse.url = redirectResponseUrl->toStdString();
  redirectResponse.statusCode = redirectResponseStatus;
  redirectResponse.headers = convertJavaMapToHeaders(redirectResponseHeaders);

  NetworkReporter::getInstance().reportRequestStart(
      requestId->toStdString(),
      convertToRequestInfo(
          requestUrl, requestMethod, requestHeaders, requestBody),
      encodedDataLength,
      redirectResponse);
}

/* static */ void JInspectorNetworkReporter::reportConnectionTiming(
    jni::alias_ref<jclass> /*unused*/,
    jni::alias_ref<jstring> requestId,
    jni::alias_ref<jni::JMap<jstring, jstring>> headers) {
  NetworkReporter::getInstance().reportConnectionTiming(
      requestId->toStdString(), convertJavaMapToHeaders(headers));
}

/* static */ void JInspectorNetworkReporter::reportResponseStart(
    jni::alias_ref<jclass> /*unused*/,
    jni::alias_ref<jstring> requestId,
    jni::alias_ref<jstring> requestUrl,
    jint responseStatus,
    jni::alias_ref<jni::JMap<jstring, jstring>> responseHeaders,
    jlong encodedDataLength) {
  ResponseInfo responseInfo;
  responseInfo.url = requestUrl->toStdString();
  responseInfo.statusCode = responseStatus;
  responseInfo.headers = convertJavaMapToHeaders(responseHeaders);

  NetworkReporter::getInstance().reportResponseStart(
      requestId->toStdString(),
      responseInfo,
      static_cast<std::int64_t>(encodedDataLength));
}

/* static */ void JInspectorNetworkReporter::reportDataReceivedImpl(
    jni::alias_ref<jclass> /*unused*/,
    jni::alias_ref<jstring> requestId,
    jint dataLength) {
  NetworkReporter::getInstance().reportDataReceived(
      requestId->toStdString(), dataLength, std::nullopt);
}

/* static */ void JInspectorNetworkReporter::reportResponseEnd(
    jni::alias_ref<jclass> /*unused*/,
    jni::alias_ref<jstring> requestId,
    jlong encodedDataLength) {
  auto requestIdStr = requestId->toStdString();
  NetworkReporter::getInstance().reportResponseEnd(
      requestIdStr, static_cast<std::int64_t>(encodedDataLength));

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: Check for buffered response body and flush to NetworkReporter
  std::string body;
  {
    std::lock_guard<std::mutex> lock(responseBuffersMutex);
    auto it = responseBuffers.find(requestIdStr);
    if (it != responseBuffers.end()) {
      body = std::move(it->second);
      responseBuffers.erase(it);
    }
  }
  if (!body.empty()) {
    NetworkReporter::getInstance().storeResponseBody(requestIdStr, body, false);
  }
#endif
}

/* static */ void JInspectorNetworkReporter::reportRequestFailed(
    jni::alias_ref<jclass> /*unused*/,
    jni::alias_ref<jstring> requestId,
    jboolean cancelled) {
  auto requestIdStr = requestId->toStdString();
  NetworkReporter::getInstance().reportRequestFailed(
      requestIdStr, cancelled != 0u);

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  std::lock_guard<std::mutex> lock(responseBuffersMutex);
  responseBuffers.erase(requestIdStr);
#endif
}

/* static */ void JInspectorNetworkReporter::maybeStoreResponseBodyImpl(
    jni::alias_ref<jclass> /*unused*/,
    jni::alias_ref<jstring> requestId,
    jni::alias_ref<jstring> body,
    jboolean base64Encoded) {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: Process response body and report to NetworkReporter
  auto& networkReporter = NetworkReporter::getInstance();
  if (!networkReporter.isDebuggingEnabled()) {
    return;
  }

  networkReporter.storeResponseBody(
      requestId->toStdString(), body->toStdString(), base64Encoded != 0u);
#endif
}

/* static */ void
JInspectorNetworkReporter::maybeStoreResponseBodyIncrementalImpl(
    jni::alias_ref<jclass> /*unused*/,
    jni::alias_ref<jstring> requestId,
    jni::alias_ref<jstring> data) {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: Buffer incremental response body contents
  auto& networkReporter = NetworkReporter::getInstance();
  if (!networkReporter.isDebuggingEnabled()) {
    return;
  }

  auto requestIdStr = requestId->toStdString();
  auto dataStr = data->toStdString();
  std::lock_guard<std::mutex> lock(responseBuffersMutex);
  responseBuffers[requestIdStr] += dataStr;
#endif
}

/* static */ void JInspectorNetworkReporter::reportWebSocketCreated(
    jni::alias_ref<jclass> /*unused*/,
    jni::alias_ref<jstring> requestId,
    jni::alias_ref<jstring> url) {
  NetworkReporter::getInstance().reportWebSocketCreated(
      requestId->toStdString(), url->toStdString());
}

/* static */ void
JInspectorNetworkReporter::reportWebSocketWillSendHandshakeRequest(
    jni::alias_ref<jclass> /*unused*/,
    jni::alias_ref<jstring> requestId,
    jni::alias_ref<jni::JMap<jstring, jstring>> headers) {
  NetworkReporter::getInstance().reportWebSocketWillSendHandshakeRequest(
      requestId->toStdString(), convertJavaMapToHeaders(headers));
}

/* static */ void
JInspectorNetworkReporter::reportWebSocketHandshakeResponseReceived(
    jni::alias_ref<jclass> /*unused*/,
    jni::alias_ref<jstring> requestId,
    jint statusCode,
    jni::alias_ref<jni::JMap<jstring, jstring>> headers) {
  NetworkReporter::getInstance().reportWebSocketHandshakeResponseReceived(
      requestId->toStdString(),
      static_cast<uint16_t>(statusCode),
      convertJavaMapToHeaders(headers));
}

/* static */ void JInspectorNetworkReporter::reportWebSocketMessageSentImpl(
    jni::alias_ref<jclass> /*unused*/,
    jni::alias_ref<jstring> requestId,
    jni::alias_ref<jstring> payloadData,
    jboolean isBinary) {
  NetworkReporter::getInstance().reportWebSocketMessageSent(
      requestId->toStdString(), payloadData->toStdString(), isBinary != 0u);
}

/* static */ void JInspectorNetworkReporter::reportWebSocketMessageReceivedImpl(
    jni::alias_ref<jclass> /*unused*/,
    jni::alias_ref<jstring> requestId,
    jni::alias_ref<jstring> payloadData,
    jboolean isBinary) {
  NetworkReporter::getInstance().reportWebSocketMessageReceived(
      requestId->toStdString(), payloadData->toStdString(), isBinary != 0u);
}

/* static */ void JInspectorNetworkReporter::reportWebSocketClosed(
    jni::alias_ref<jclass> /*unused*/,
    jni::alias_ref<jstring> requestId) {
  NetworkReporter::getInstance().reportWebSocketClosed(
      requestId->toStdString());
}

/* static */ void JInspectorNetworkReporter::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod(
          "isDebuggingEnabled", JInspectorNetworkReporter::isDebuggingEnabled),
      makeNativeMethod(
          "reportRequestStart", JInspectorNetworkReporter::reportRequestStart),
      makeNativeMethod(
          "reportRequestStart",
          JInspectorNetworkReporter::reportRequestStartWithRedirect),
      makeNativeMethod(
          "reportResponseStart",
          JInspectorNetworkReporter::reportResponseStart),
      makeNativeMethod(
          "reportConnectionTiming",
          JInspectorNetworkReporter::reportConnectionTiming),
      makeNativeMethod(
          "reportDataReceivedImpl",
          JInspectorNetworkReporter::reportDataReceivedImpl),
      makeNativeMethod(
          "reportResponseEnd", JInspectorNetworkReporter::reportResponseEnd),
      makeNativeMethod(
          "reportRequestFailed",
          JInspectorNetworkReporter::reportRequestFailed),
      makeNativeMethod(
          "maybeStoreResponseBodyImpl",
          JInspectorNetworkReporter::maybeStoreResponseBodyImpl),
      makeNativeMethod(
          "maybeStoreResponseBodyIncrementalImpl",
          JInspectorNetworkReporter::maybeStoreResponseBodyIncrementalImpl),
      makeNativeMethod(
          "reportWebSocketCreated",
          JInspectorNetworkReporter::reportWebSocketCreated),
      makeNativeMethod(
          "reportWebSocketWillSendHandshakeRequest",
          JInspectorNetworkReporter::reportWebSocketWillSendHandshakeRequest),
      makeNativeMethod(
          "reportWebSocketHandshakeResponseReceived",
          JInspectorNetworkReporter::reportWebSocketHandshakeResponseReceived),
      makeNativeMethod(
          "reportWebSocketMessageSentImpl",
          JInspectorNetworkReporter::reportWebSocketMessageSentImpl),
      makeNativeMethod(
          "reportWebSocketMessageReceivedImpl",
          JInspectorNetworkReporter::reportWebSocketMessageReceivedImpl),
      makeNativeMethod(
          "reportWebSocketClosed",
          JInspectorNetworkReporter::reportWebSocketClosed),
  });
}

} // namespace facebook::react::jsinspector_modern
