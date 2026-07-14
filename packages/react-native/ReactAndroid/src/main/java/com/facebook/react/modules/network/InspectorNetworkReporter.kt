/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.modules.network

import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.soloader.SoLoader
import okio.ByteString

/**
 * [Experimental] An interface for reporting network events to the modern debugger server and Web
 * Performance APIs.
 *
 * In a production (non dev or profiling) build, CDP reporting is disabled.
 *
 * This is a helper class wrapping `facebook::react::jsinspector_modern::NetworkReporter`.
 */
@DoNotStripAny
internal object InspectorNetworkReporter {
  init {
    SoLoader.loadLibrary("react_devsupportjni")
  }

  @JvmStatic external fun isDebuggingEnabled(): Boolean

  /**
   * Report a network request that is about to be sent.
   * - Corresponds to `Network.requestWillBeSent` in CDP.
   * - Corresponds to `PerformanceResourceTiming.requestStart` (specifically, marking when the
   *   native request was initiated).
   */
  @JvmStatic
  external fun reportRequestStart(
      requestId: String,
      requestUrl: String,
      requestMethod: String,
      requestHeaders: Map<String, String>,
      requestBody: String,
      encodedDataLength: Long,
  )

  /**
   * Report detailed timing info, such as DNS lookup, when a request has started.
   * - Corresponds to `Network.requestWillBeSentExtraInfo` in CDP.
   * - Corresponds to `PerformanceResourceTiming.domainLookupStart`,
   *   `PerformanceResourceTiming.connectStart`.
   */
  @JvmStatic external fun reportConnectionTiming(requestId: String, headers: Map<String, String>)

  /**
   * Report when HTTP response headers have been received, corresponding to when the first byte of
   * the response is available.
   * - Corresponds to `Network.responseReceived` in CDP.
   * - Corresponds to `PerformanceResourceTiming.responseStart`.
   */
  @JvmStatic
  external fun reportResponseStart(
      requestId: String,
      requestUrl: String,
      responseStatus: Int,
      responseHeaders: Map<String, String>,
      expectedDataLength: Long,
  )

  /**
   * Report when additional chunks of the response body have been received.
   *
   * Corresponds to `Network.dataReceived` in CDP.
   */
  @JvmStatic
  fun reportDataReceived(requestId: String, data: String) {
    // Guard call to CDP-only reporting method (avoid encodeToByteArray calculation)
    if (isDebuggingEnabled()) {
      reportDataReceivedImpl(requestId, data.encodeToByteArray().size)
    }
  }

  @JvmStatic external fun reportDataReceivedImpl(requestId: String, dataLength: Int)

  /**
   * Report when a network request is complete and we are no longer receiving response data.
   * - Corresponds to `Network.loadingFinished` in CDP.
   * - Corresponds to `PerformanceResourceTiming.responseEnd`.
   */
  @JvmStatic external fun reportResponseEnd(requestId: String, encodedDataLength: Long)

  /**
   * Report when a network request has failed.
   *
   * Corresponds to `Network.loadingFailed` in CDP.
   */
  @JvmStatic external fun reportRequestFailed(requestId: String, cancelled: Boolean)

  /**
   * Store response body preview. This is an optional reporting method, and is a no-op if CDP
   * debugging is disabled.
   */
  @JvmStatic
  fun maybeStoreResponseBody(requestId: String, body: String, base64Encoded: Boolean) {
    // Guard call to CDP-only reporting method (avoid sending string over JNI)
    if (isDebuggingEnabled()) {
      maybeStoreResponseBodyImpl(requestId, body, base64Encoded)
    }
  }

  @JvmStatic
  external fun maybeStoreResponseBodyImpl(requestId: String, body: String, base64Encoded: Boolean)

  /**
   * Incrementally store a response body preview, when a string response is received in chunks.
   * Buffered contents will be flushed to `NetworkReporter` with `reportResponseEnd`.
   *
   * As with `maybeStoreResponseBody`, calling this method is optional and a no-op if CDP debugging
   * is disabled.
   */
  @JvmStatic
  fun maybeStoreResponseBodyIncremental(requestId: String, data: String) {
    // Guard call to CDP-only reporting method (avoid sending string over JNI)
    if (isDebuggingEnabled()) {
      maybeStoreResponseBodyIncrementalImpl(requestId, data)
    }
  }

  @JvmStatic external fun maybeStoreResponseBodyIncrementalImpl(requestId: String, data: String)

  /**
   * Report that a WebSocket connection is about to be created.
   *
   * Corresponds to `Network.webSocketCreated` in CDP.
   */
  @JvmStatic external fun reportWebSocketCreated(requestId: String, url: String)

  /**
   * Report that a WebSocket handshake (HTTP upgrade) request is about to be sent, along with its
   * final request headers.
   *
   * Corresponds to `Network.webSocketWillSendHandshakeRequest` in CDP.
   */
  @JvmStatic
  external fun reportWebSocketWillSendHandshakeRequest(
      requestId: String,
      headers: Map<String, String>,
  )

  /**
   * Report that a WebSocket handshake response was received and the connection is established.
   *
   * Corresponds to `Network.webSocketHandshakeResponseReceived` in CDP.
   */
  @JvmStatic
  external fun reportWebSocketHandshakeResponseReceived(
      requestId: String,
      statusCode: Int,
      headers: Map<String, String>,
  )

  /**
   * Report a text WebSocket message sent over an open connection.
   *
   * Corresponds to `Network.webSocketFrameSent` in CDP.
   */
  @JvmStatic
  fun reportWebSocketMessageSent(requestId: String, message: String) {
    if (isDebuggingEnabled()) {
      reportWebSocketMessageSentImpl(requestId, message, false)
    }
  }

  /**
   * Report a binary WebSocket message sent over an open connection.
   *
   * Corresponds to `Network.webSocketFrameSent` in CDP.
   */
  @JvmStatic
  fun reportWebSocketMessageSent(requestId: String, message: ByteString) {
    // Guard call to CDP-only reporting method (avoid base64 encoding)
    if (isDebuggingEnabled()) {
      reportWebSocketMessageSentImpl(requestId, message.base64(), true)
    }
  }

  @JvmStatic
  external fun reportWebSocketMessageSentImpl(
      requestId: String,
      payloadData: String,
      isBinary: Boolean,
  )

  /**
   * Report a text WebSocket message received over an open connection.
   *
   * Corresponds to `Network.webSocketFrameReceived` in CDP.
   */
  @JvmStatic
  fun reportWebSocketMessageReceived(requestId: String, message: String) {
    if (isDebuggingEnabled()) {
      reportWebSocketMessageReceivedImpl(requestId, message, false)
    }
  }

  /**
   * Report a binary WebSocket message received over an open connection.
   *
   * Corresponds to `Network.webSocketFrameReceived` in CDP.
   */
  @JvmStatic
  fun reportWebSocketMessageReceived(requestId: String, message: ByteString) {
    // Guard call to CDP-only reporting method (avoid base64 encoding)
    if (isDebuggingEnabled()) {
      reportWebSocketMessageReceivedImpl(requestId, message.base64(), true)
    }
  }

  @JvmStatic
  external fun reportWebSocketMessageReceivedImpl(
      requestId: String,
      payloadData: String,
      isBinary: Boolean,
  )

  /**
   * Report that a WebSocket connection was closed, whether cleanly or due to an error.
   *
   * Corresponds to `Network.webSocketClosed` in CDP.
   */
  @JvmStatic external fun reportWebSocketClosed(requestId: String)
}
