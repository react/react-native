/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.modules.network

import android.os.Bundle
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.buildReadableArray
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import java.io.IOException
import java.net.SocketTimeoutException
import okhttp3.Headers
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okio.Buffer

/**
 * Utility class for reporting network lifecycle events to JavaScript and InspectorNetworkReporter.
 */
internal object NetworkEventUtil {
  private const val MAX_BODY_PREVIEW_SIZE = 512 * 1024 // 512KB

  @JvmStatic
  fun onCreateRequest(
      devToolsRequestId: String,
      requestUrl: String,
      requestMethod: String,
      requestHeaders: Map<String, String>,
      /** Request body for DevTools preview. Only populate in debug builds. */
      requestBodyForDevTools: String?,
      encodedDataLength: Long,
  ) {
    if (ReactNativeFeatureFlags.enableNetworkEventReporting()) {
      InspectorNetworkReporter.reportRequestStart(
          devToolsRequestId,
          requestUrl,
          requestMethod,
          requestHeaders,
          requestBodyForDevTools.orEmpty(),
          encodedDataLength,
      )
      InspectorNetworkReporter.reportConnectionTiming(devToolsRequestId, requestHeaders)
    }
  }

  @JvmStatic
  fun onDataSend(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      progress: Long,
      total: Long,
  ) {
    reactContext?.emitDeviceEvent(
        "didSendNetworkData",
        buildReadableArray {
          add(requestId)
          add(progress.toInt())
          add(total.toInt())
        },
    )
  }

  @JvmStatic
  fun onIncrementalDataReceived(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      devToolsRequestId: String,
      data: String?,
      progress: Long,
      total: Long,
  ) {
    if (ReactNativeFeatureFlags.enableNetworkEventReporting() && data != null) {
      InspectorNetworkReporter.reportDataReceived(devToolsRequestId, data)
      InspectorNetworkReporter.maybeStoreResponseBodyIncremental(devToolsRequestId, data)
    }
    reactContext?.emitDeviceEvent(
        "didReceiveNetworkIncrementalData",
        buildReadableArray {
          add(requestId)
          add(data)
          add(progress.toInt())
          add(total.toInt())
        },
    )
  }

  @JvmStatic
  fun onDataReceivedProgress(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      progress: Long,
      total: Long,
  ) {
    reactContext?.emitDeviceEvent(
        "didReceiveNetworkDataProgress",
        buildReadableArray {
          add(requestId)
          add(progress.toInt())
          add(total.toInt())
        },
    )
  }

  @JvmStatic
  fun onDataReceived(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      devToolsRequestId: String,
      data: String?,
      responseType: String,
  ) {
    if (ReactNativeFeatureFlags.enableNetworkEventReporting()) {
      InspectorNetworkReporter.maybeStoreResponseBody(
          devToolsRequestId,
          data.orEmpty(),
          responseType == "base64",
      )
    }
    reactContext?.emitDeviceEvent(
        "didReceiveNetworkData",
        buildReadableArray {
          add(requestId)
          add(data)
        },
    )
  }

  @JvmStatic
  fun onDataReceived(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      devToolsRequestId: String,
      data: WritableMap,
      rawData: ByteArray,
  ) {
    if (ReactNativeFeatureFlags.enableNetworkEventReporting()) {
      InspectorNetworkReporter.maybeStoreResponseBody(
          devToolsRequestId,
          Base64.encodeToString(rawData, Base64.NO_WRAP),
          true,
      )
    }
    reactContext?.emitDeviceEvent(
        "didReceiveNetworkData",
        Arguments.createArray().apply {
          pushInt(requestId)
          pushMap(data)
        },
    )
  }

  @JvmStatic
  fun onRequestError(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      devToolsRequestId: String,
      error: String?,
      e: Throwable?,
  ) {
    if (ReactNativeFeatureFlags.enableNetworkEventReporting()) {
      InspectorNetworkReporter.reportRequestFailed(devToolsRequestId, false)
    }
    reactContext?.emitDeviceEvent(
        "didCompleteNetworkResponse",
        buildReadableArray {
          add(requestId)
          add(error)
          if (e?.javaClass == SocketTimeoutException::class.java) {
            add(true) // last argument is a time out boolean
          }
        },
    )
  }

  @JvmStatic
  fun onRequestSuccess(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      devToolsRequestId: String,
      encodedDataLength: Long,
  ) {
    if (ReactNativeFeatureFlags.enableNetworkEventReporting()) {
      InspectorNetworkReporter.reportResponseEnd(devToolsRequestId, encodedDataLength)
    }
    reactContext?.emitDeviceEvent(
        "didCompleteNetworkResponse",
        buildReadableArray {
          add(requestId)
          addNull()
        },
    )
  }

  @JvmStatic
  fun onResponseReceived(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      devToolsRequestId: String,
      requestUrl: String?,
      statusCode: Int,
      headers: Map<String, String>,
      contentLength: Long,
  ) {
    val headersBundle = Bundle()
    for ((headerName, headerValue) in headers) {
      headersBundle.putString(headerName, headerValue)
    }

    if (ReactNativeFeatureFlags.enableNetworkEventReporting()) {
      InspectorNetworkReporter.reportResponseStart(
          devToolsRequestId,
          requestUrl.orEmpty(),
          statusCode,
          headers,
          contentLength,
      )
    }
    reactContext?.emitDeviceEvent(
        "didReceiveNetworkResponse",
        Arguments.createArray().apply {
          pushInt(requestId)
          pushInt(statusCode)
          pushMap(Arguments.fromBundle(headersBundle))
          pushString(requestUrl)
        },
    )
  }

  @JvmStatic
  fun okHttpHeadersToMap(headers: Headers): Map<String, String> {
    val responseHeaders = mutableMapOf<String, String>()
    for (i in 0 until headers.size()) {
      val headerName = headers.name(i)
      // multiple values for the same header
      if (responseHeaders.containsKey(headerName)) {
        responseHeaders[headerName] = "${responseHeaders[headerName]}, ${headers.value(i)}"
      } else {
        responseHeaders[headerName] = headers.value(i)
      }
    }
    return responseHeaders
  }

  @JvmStatic
  fun getRequestBodyPreview(requestBody: RequestBody?): String? {
    if (requestBody == null) {
      return null
    }

    // Unwrap ProgressRequestBody
    val body = (requestBody as? ProgressRequestBody)?.innerBody() ?: requestBody

    if (body.isOneShot()) {
      // Reading would drain the underlying stream and break the real upload,
      // so fall back to a placeholder that includes the byte count when known
      return binaryPartLabel(body)
    }

    // MultipartBody does not propagate isOneShot() from its parts, so check each
    // part explicitly. Reading a one-shot part here would drain the underlying
    // stream and cause the real request to fail.
    if (body is MultipartBody && body.parts().any { it.body().isOneShot() }) {
      return previewMultipartWithBinaryParts(body)
    }

    return try {
      val buffer = Buffer()
      body.writeTo(buffer)

      val size = buffer.size()
      if (size <= MAX_BODY_PREVIEW_SIZE) {
        buffer.readUtf8()
      } else {
        buffer.readUtf8(MAX_BODY_PREVIEW_SIZE.toLong()) + "... (truncated, ${size} bytes total)"
      }
    } catch (e: IOException) {
      "[Preview unavailable]"
    }
  }

  private fun previewMultipartWithBinaryParts(body: MultipartBody): String {
    val boundary = body.boundary()
    val out = StringBuilder()

    for (part in body.parts()) {
      out.append("--").append(boundary).append("\r\n")

      part.headers()?.let { headers ->
        for (i in 0 until headers.size()) {
          out.append(headers.name(i)).append(": ").append(headers.value(i)).append("\r\n")
        }
      }
      val partBody = part.body()
      partBody.contentType()?.let { out.append("Content-Type: ").append(it).append("\r\n") }
      out.append("\r\n")

      if (partBody.isOneShot()) {
        out.append(binaryPartLabel(partBody))
      } else {
        try {
          val partBuffer = Buffer()
          partBody.writeTo(partBuffer)
          out.append(partBuffer.readUtf8())
        } catch (e: IOException) {
          out.append("[Preview unavailable]")
        }
      }
      out.append("\r\n")
    }
    out.append("--").append(boundary).append("--\r\n")

    return if (out.length <= MAX_BODY_PREVIEW_SIZE) {
      out.toString()
    } else {
      out.substring(0, MAX_BODY_PREVIEW_SIZE) + "... (truncated, ${out.length} bytes total)"
    }
  }

  /** Placeholder for a one-shot body, including the byte count when known. */
  private fun binaryPartLabel(body: RequestBody): String {
    val length =
        try {
          body.contentLength()
        } catch (e: IOException) {
          -1L
        }
    return if (length >= 0) "[Binary data, $length bytes]" else "[Binary data]"
  }
}
