/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION", "DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.modules.network

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.testutils.shadows.ShadowArguments
import java.io.ByteArrayInputStream
import java.net.SocketTimeoutException
import okhttp3.MediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentCaptor
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@Config(shadows = [ShadowArguments::class])
@RunWith(RobolectricTestRunner::class)
class NetworkEventUtilTest {
  private lateinit var reactContext: ReactApplicationContext

  @Before
  fun setUp() {
    reactContext = mock()

    ReactNativeFeatureFlagsForTests.setUp()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableNetworkEventReporting(): Boolean = false
        }
    )
  }

  @After
  fun tearDown() {
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun testOnDataSend() {
    val requestId = 1
    val progress = 100L
    val total = 1000L

    NetworkEventUtil.onDataSend(reactContext, requestId, progress, total)

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didSendNetworkData")

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(3)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.getInt(1)).isEqualTo(progress.toInt())
    assertThat(args.getInt(2)).isEqualTo(total.toInt())
  }

  @Test
  fun testOnIncrementalDataReceived() {
    val requestId = 1
    val data = "some data"
    val progress = 100L
    val total = 1000L

    NetworkEventUtil.onIncrementalDataReceived(
        reactContext,
        requestId,
        "test_devtools_request_$requestId",
        data,
        progress,
        total,
    )

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didReceiveNetworkIncrementalData")

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(4)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.getString(1)).isEqualTo(data)
    assertThat(args.getInt(2)).isEqualTo(progress.toInt())
    assertThat(args.getInt(3)).isEqualTo(total.toInt())
  }

  @Test
  fun testOnDataReceivedProgress() {
    val requestId = 1
    val progress = 500L
    val total = 1000L

    NetworkEventUtil.onDataReceivedProgress(reactContext, requestId, progress, total)

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didReceiveNetworkDataProgress")

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(3)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.getInt(1)).isEqualTo(progress.toInt())
    assertThat(args.getInt(2)).isEqualTo(total.toInt())
  }

  @Test
  fun testOnDataReceived() {
    val requestId = 1
    val data = "response data"

    NetworkEventUtil.onDataReceived(
        reactContext,
        requestId,
        "test_devtools_request_$requestId",
        data,
        "string",
    )

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didReceiveNetworkData")

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(2)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.getString(1)).isEqualTo(data)
  }

  @Test
  fun testOnDataReceivedMap() {
    val requestId = 1
    val data: WritableMap = Arguments.createMap().apply { putString("key", "value") }

    NetworkEventUtil.onDataReceived(
        reactContext,
        requestId,
        "test_devtools_request_$requestId",
        data,
        ByteArray(0),
    )

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didReceiveNetworkData")

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(2)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.getMap(1)).isEqualTo(data)
  }

  @Test
  fun testOnRequestError() {
    val requestId = 1
    val error = "An error occurred"
    val e: Throwable? = null

    NetworkEventUtil.onRequestError(
        reactContext,
        requestId,
        "test_devtools_request_$requestId",
        error,
        e,
    )

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didCompleteNetworkResponse")

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(2)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.getString(1)).isEqualTo(error)
  }

  @Test
  fun testOnRequestErrorWithException() {
    val requestId = 1
    val error = "Timeout error"
    val e: Throwable = SocketTimeoutException()

    NetworkEventUtil.onRequestError(
        reactContext,
        requestId,
        "test_devtools_request_$requestId",
        error,
        e,
    )

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didCompleteNetworkResponse")

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(3)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.getString(1)).isEqualTo(error)
    assertThat(args.getBoolean(2)).isTrue
  }

  @Test
  fun testOnRequestSuccess() {
    val requestId = 1

    NetworkEventUtil.onRequestSuccess(
        reactContext,
        requestId,
        "test_devtools_request_$requestId",
        128,
    )

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didCompleteNetworkResponse")

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(2)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.isNull(1)).isTrue()
  }

  @Test
  fun testOnResponseReceived() {
    val requestId = 1
    val statusCode = 200
    val headersMap = mapOf("Content-Type" to "application/json")
    val url = "http://example.com"

    NetworkEventUtil.onResponseReceived(
        reactContext,
        requestId,
        "test_devtools_request_$requestId",
        url,
        statusCode,
        headersMap,
        0L,
    )

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didReceiveNetworkResponse")

    val expectedHeadersMap: WritableMap =
        Arguments.createMap().apply { putString("Content-Type", "application/json") }

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(4)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.getInt(1)).isEqualTo(statusCode)
    assertThat(args.getMap(2)).isEqualTo(expectedHeadersMap)
    assertThat(args.getString(3)).isEqualTo(url)
  }

  @Test
  fun testGetRequestBodyPreviewReturnsNullForNullBody() {
    assertThat(NetworkEventUtil.getRequestBodyPreview(null)).isNull()
  }

  @Test
  fun testGetRequestBodyPreviewReturnsBodyForStringRequest() {
    val payload = """{"key":"value"}"""
    val body = RequestBody.create(MediaType.parse("application/json"), payload)

    assertThat(NetworkEventUtil.getRequestBodyPreview(body)).isEqualTo(payload)
  }

  @Test
  fun testGetRequestBodyPreviewUnwrapsProgressRequestBody() {
    val payload = "hello world"
    val inner = RequestBody.create(MediaType.parse("text/plain"), payload)
    val wrapped = ProgressRequestBody(inner) { _, _, _ -> }

    assertThat(NetworkEventUtil.getRequestBodyPreview(wrapped)).isEqualTo(payload)
  }

  @Test
  fun testGetRequestBodyPreviewMultipartWithTextParts() {
    val body =
        MultipartBody.Builder("test-boundary")
            .setType(MultipartBody.FORM)
            .addFormDataPart("field1", "value1")
            .addFormDataPart("field2", "value2")
            .build()

    val preview = NetworkEventUtil.getRequestBodyPreview(body)

    assertThat(preview).isNotNull()
    assertThat(preview).contains("--test-boundary")
    assertThat(preview).contains("--test-boundary--")
    assertThat(preview).contains("name=\"field1\"")
    assertThat(preview).contains("value1")
    assertThat(preview).contains("name=\"field2\"")
    assertThat(preview).contains("value2")
    assertThat(preview).doesNotContain("[Preview unavailable]")
  }

  @Test
  fun testGetRequestBodyPreviewMultipartWithFilePartReplacesBinaryContent() {
    val fileBytes = ByteArray(2048) { it.toByte() }
    val streamingPart =
        RequestBodyUtil.create(
            MediaType.parse("application/octet-stream"),
            ByteArrayInputStream(fileBytes),
        )
    val body =
        MultipartBody.Builder("test-boundary")
            .setType(MultipartBody.FORM)
            .addFormDataPart("description", "an image")
            .addFormDataPart("file", "photo.jpg", streamingPart)
            .build()

    val preview = NetworkEventUtil.getRequestBodyPreview(body)

    assertThat(preview).isNotNull()
    assertThat(preview).contains("--test-boundary")
    assertThat(preview).contains("name=\"description\"")
    assertThat(preview).contains("an image")
    assertThat(preview).contains("name=\"file\"")
    assertThat(preview).contains("filename=\"photo.jpg\"")
    assertThat(preview).contains("[Binary data, 2048 bytes]")
    assertThat(preview).doesNotContain("[Preview unavailable]")
  }

  @Test
  fun testGetRequestBodyPreviewSingleOneShotBodyShowsPlaceholder() {
    val fileBytes = ByteArray(512) { it.toByte() }
    val body =
        RequestBodyUtil.create(
            MediaType.parse("application/octet-stream"),
            ByteArrayInputStream(fileBytes),
        )

    val preview = NetworkEventUtil.getRequestBodyPreview(body)

    assertThat(preview).isEqualTo("[Binary data, 512 bytes]")
  }

  @Test
  fun testGetRequestBodyPreviewDoesNotConsumeMultipartOneShotStream() {
    // Regression guard: previewMultipartWithBinaryParts must not call writeTo() on a
    // one-shot part. If it ever does, the underlying stream will be drained and the
    // real upload will fail at request time.
    val fileBytes = ByteArray(2048) { it.toByte() }
    val stream = ByteArrayInputStream(fileBytes)
    val streamingPart = RequestBodyUtil.create(MediaType.parse("application/octet-stream"), stream)
    val body =
        MultipartBody.Builder("test-boundary")
            .setType(MultipartBody.FORM)
            .addFormDataPart("description", "an image")
            .addFormDataPart("file", "photo.jpg", streamingPart)
            .build()

    NetworkEventUtil.getRequestBodyPreview(body)

    assertThat(stream.available()).isEqualTo(fileBytes.size)
  }

  @Test
  fun testGetRequestBodyPreviewDoesNotConsumeSingleOneShotStream() {
    // Regression guard for the top-level one-shot branch: getRequestBodyPreview must
    // only read contentLength() / contentType() on a one-shot body, never writeTo().
    val fileBytes = ByteArray(512) { it.toByte() }
    val stream = ByteArrayInputStream(fileBytes)
    val body = RequestBodyUtil.create(MediaType.parse("application/octet-stream"), stream)

    NetworkEventUtil.getRequestBodyPreview(body)

    assertThat(stream.available()).isEqualTo(fileBytes.size)
  }

  @Test
  fun testNullReactContext() {
    val url = "http://example.com"

    NetworkEventUtil.onDataSend(null, 1, 100, 1000)
    NetworkEventUtil.onIncrementalDataReceived(
        null,
        1,
        "test_devtools_request_1",
        "data",
        100,
        1000,
    )
    NetworkEventUtil.onDataReceivedProgress(null, 1, 100, 1000)
    NetworkEventUtil.onDataReceived(null, 1, "test_devtools_request_1", "data", "string")
    NetworkEventUtil.onDataReceived(
        null,
        1,
        "test_devtools_request_1",
        Arguments.createMap(),
        ByteArray(0),
    )
    NetworkEventUtil.onRequestError(null, 1, "test_devtools_request_1", "error", null)
    NetworkEventUtil.onRequestSuccess(null, 1, "test_devtools_request_1", 0)
    NetworkEventUtil.onResponseReceived(
        null,
        1,
        "test_devtools_request_1",
        url,
        200,
        emptyMap(),
        0L,
    )

    verify(reactContext, never()).emitDeviceEvent(any<String>(), any())
  }
}
