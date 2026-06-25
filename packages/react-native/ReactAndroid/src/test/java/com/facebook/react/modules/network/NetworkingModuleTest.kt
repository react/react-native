/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Conflicting okhttp versions
@file:Suppress("DEPRECATION_ERROR")

package com.facebook.react.modules.network

import android.net.Uri
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.network.OkHttpCallUtil
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.testutils.shadows.ShadowArguments
import java.io.IOException
import java.io.InputStream
import java.nio.charset.StandardCharsets
import okhttp3.Call
import okhttp3.Headers
import okhttp3.MediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okio.Buffer
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.RETURNS_MOCKS
import org.mockito.Mockito.mockConstruction
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.KArgumentCaptor
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.kotlin.withSettings
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Tests [NetworkingModule] */
@Config(shadows = [ShadowArguments::class])
@RunWith(RobolectricTestRunner::class)
class NetworkingModuleTest {

  private lateinit var networkingModule: NetworkingModule
  private lateinit var httpClient: OkHttpClient
  private lateinit var context: ReactApplicationContext
  private lateinit var okHttpCallUtil: MockedStatic<OkHttpCallUtil>
  private lateinit var requestBodyUtil: MockedStatic<RequestBodyUtil>
  private lateinit var requestArgumentCaptor: KArgumentCaptor<Request>

  @Before
  fun setUp() {
    httpClient = mock()
    whenever(httpClient.cookieJar()).thenReturn(mock<CookieJarContainer>())
    whenever(httpClient.newCall(any())).thenReturn(mock())

    val clientBuilder = mock<OkHttpClient.Builder>()
    whenever(clientBuilder.build()).thenReturn(httpClient)
    whenever(httpClient.newBuilder()).thenReturn(clientBuilder)

    context = mock()
    whenever(context.hasActiveReactInstance()).thenReturn(true)

    ReactNativeFeatureFlagsForTests.setUp()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableNetworkEventReporting(): Boolean = false
        }
    )

    networkingModule = NetworkingModule(context, "", httpClient, null)

    okHttpCallUtil = mockStatic(OkHttpCallUtil::class.java)
    requestArgumentCaptor = argumentCaptor()
  }

  private fun setupRequestBodyUtil() {
    requestBodyUtil =
        mockStatic(RequestBodyUtil::class.java, withSettings().defaultAnswer(RETURNS_MOCKS))
    requestBodyUtil
        .`when`<ProgressRequestBody> { RequestBodyUtil.createProgressRequest(any(), any()) }
        .thenCallRealMethod()
  }

  @After
  fun tearDown() {
    okHttpCallUtil.close()
  }

  @Test
  fun testGetWithoutHeaders() {
    networkingModule.sendRequest(
        "GET",
        "http://somedomain/foo",
        0.0, /* requestId */
        JavaOnlyArray.of(), /* headers */
        null, /* body */
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false, /* withCredentials */
    )

    with(requestArgumentCaptor) {
      verify(httpClient).newCall(capture())

      assertThat(firstValue.url().toString()).isEqualTo("http://somedomain/foo")
      // We set the User-Agent header by default
      assertThat(firstValue.headers().size()).isEqualTo(1)
      assertThat(firstValue.method()).isEqualTo("GET")
    }
  }

  @Test
  fun testFailGetWithInvalidHeadersStruct() {
    val invalidHeaders = listOf(JavaOnlyArray.of("foo"))

    networkingModule.sendRequest(
        "GET",
        "http://somedoman/foo",
        0.0, /* requestId */
        JavaOnlyArray.from(invalidHeaders), /* headers */
        null, /* body */
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false, /* withCredentials */
    )

    verifyErrorEmit(context, 0)
  }

  @Test
  fun testFailPostWithoutContentType() {
    val body = JavaOnlyMap()
    body.putString("string", "This is request body")

    networkingModule.sendRequest(
        "POST",
        "http://somedomain/bar",
        0.0,
        JavaOnlyArray.of(),
        body,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false, /* withCredentials */
    )

    verifyErrorEmit(context, 0)
  }

  @Test
  fun testFailInvalidUrl() {
    networkingModule.sendRequest(
        "GET",
        "aaa",
        0.0, /* requestId */
        JavaOnlyArray.of(), /* headers */
        null, /* body */
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false, /* withCredentials */
    )

    verifyErrorEmit(context, 0)
  }

  private fun verifyErrorEmit(context: ReactApplicationContext, requestId: Int) {
    val captor = argumentCaptor<WritableArray>()
    verify(context).emitDeviceEvent(eq("didCompleteNetworkResponse"), captor.capture())

    val array = captor.firstValue
    assertThat(array.getInt(0)).isEqualTo(requestId)
    assertThat(array.getString(1)).isNotBlank
  }

  @Test
  fun testSuccessfulPostRequest() {
    val body = JavaOnlyMap()
    body.putString("string", "This is request body")

    networkingModule.sendRequest(
        "POST",
        "http://somedomain/bar",
        0.0,
        JavaOnlyArray.of(JavaOnlyArray.of("Content-Type", "text/plain")),
        body,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false, /* withCredentials */
    )

    with(requestArgumentCaptor) {
      verify(httpClient).newCall(capture())
      assertThat(firstValue.url().toString()).isEqualTo("http://somedomain/bar")
      assertThat(firstValue.headers().size()).isEqualTo(2)
      assertThat(firstValue.method()).isEqualTo("POST")
      assertThat(firstValue.body()?.contentType()?.type()).isEqualTo("text")
      assertThat(firstValue.body()?.contentType()?.subtype()).isEqualTo("plain")
      val contentBuffer = Buffer()
      firstValue.body()?.writeTo(contentBuffer)
      assertThat(contentBuffer.readUtf8()).isEqualTo("This is request body")
    }
  }

  @Test
  fun testHeaders() {
    val headers =
        listOf(
            JavaOnlyArray.of("Accept", "text/plain"),
            JavaOnlyArray.of("User-Agent", "React test agent/1.0"),
        )

    networkingModule.sendRequest(
        "GET",
        "http://someurl/baz",
        0.0,
        JavaOnlyArray.from(headers),
        null,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false, /* withCredentials */
    )

    with(requestArgumentCaptor) {
      verify(httpClient).newCall(capture())
      val requestHeaders = firstValue.headers()
      assertThat(requestHeaders.size()).isEqualTo(2)
      assertThat(requestHeaders["Accept"]).isEqualTo("text/plain")
      assertThat(requestHeaders["User-Agent"]).isEqualTo("React test agent/1.0")
    }
  }

  @Test
  fun testPostJsonContentTypeHeader() {
    val body = JavaOnlyMap()
    body.putString("string", "{ \"key\": \"value\" }")

    networkingModule.sendRequest(
        "POST",
        "http://somedomain/bar",
        0.0,
        JavaOnlyArray.of(JavaOnlyArray.of("Content-Type", "application/json")),
        body,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false, /* withCredentials */
    )

    verify(httpClient).newCall(requestArgumentCaptor.capture())

    // Verify okhttp does not append "charset=utf-8"
    assertThat(requestArgumentCaptor.firstValue.body()?.contentType().toString())
        .isEqualTo("application/json")
  }

  @Test
  fun testRespectsExistingCharacterSet() {
    val testString = "Friðjónsson"

    val body = JavaOnlyMap()
    body.putString("string", testString)

    networkingModule.sendRequest(
        "POST",
        "http://somedomain/bar",
        0.0,
        JavaOnlyArray.of(JavaOnlyArray.of("Content-Type", "text/plain; charset=utf-16")),
        body,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false, /* withCredentials */
    )

    verify(httpClient).newCall(requestArgumentCaptor.capture())

    val contentBuffer = Buffer()
    requestArgumentCaptor.firstValue.body()?.writeTo(contentBuffer)
    assertThat(contentBuffer.readString(StandardCharsets.UTF_16)).isEqualTo(testString)
  }

  @Test
  fun testGracefullyRecoversFromInvalidContentType() {
    val body = JavaOnlyMap()
    body.putString("string", "test")

    networkingModule.sendRequest(
        "POST",
        "http://somedomain/bar",
        0.0,
        JavaOnlyArray.of(JavaOnlyArray.of("Content-Type", "invalid")),
        body,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false, /* withCredentials */
    )

    verify(httpClient).newCall(requestArgumentCaptor.capture())

    val contentBuffer = Buffer()
    requestArgumentCaptor.firstValue.body()?.writeTo(contentBuffer)

    assertThat(contentBuffer.readString(StandardCharsets.UTF_8)).isEqualTo("test")
    assertThat(requestArgumentCaptor.firstValue.header("Content-Type")).isEqualTo("invalid")
  }

  @Test
  fun testMultipartPostRequestSimple() {
    setupRequestBodyUtil()
    val body = JavaOnlyMap()
    val formData = JavaOnlyArray()
    val bodyPart = JavaOnlyMap()
    bodyPart.putString("string", "value")
    bodyPart.putArray(
        "headers",
        JavaOnlyArray.from(listOf(JavaOnlyArray.of("content-disposition", "name"))),
    )
    formData.pushMap(bodyPart)
    body.putArray("formData", formData)

    networkingModule.sendRequest(
        "POST",
        "http://someurl/uploadFoo",
        0.0,
        JavaOnlyArray(),
        body,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false, /* withCredentials */
    )

    // verify url, method, headers
    with(requestArgumentCaptor) {
      verify(httpClient).newCall(capture())
      assertThat(firstValue.url().toString()).isEqualTo("http://someurl/uploadFoo")
      assertThat(firstValue.method()).isEqualTo("POST")
      assertThat(firstValue.body()?.contentType()?.type()).isEqualTo(FORM.type())
      assertThat(firstValue.body()?.contentType()?.subtype()).isEqualTo(FORM.subtype())
      val requestHeaders = firstValue.headers()
      assertThat(requestHeaders.size()).isEqualTo(1)
    }

    requestBodyUtil.close()
  }

  @Test
  fun testMultipartPostRequestHeaders() {
    setupRequestBodyUtil()
    val headers =
        listOf(
            JavaOnlyArray.of("Accept", "text/plain"),
            JavaOnlyArray.of("User-Agent", "React test agent/1.0"),
            JavaOnlyArray.of("content-type", "multipart/form-data"),
        )

    val body = JavaOnlyMap()
    val formData = JavaOnlyArray()
    val bodyPart = JavaOnlyMap()
    bodyPart.putString("string", "value")
    bodyPart.putArray(
        "headers",
        JavaOnlyArray.from(listOf(JavaOnlyArray.of("content-disposition", "name"))),
    )
    formData.pushMap(bodyPart)
    body.putArray("formData", formData)

    networkingModule.sendRequest(
        "POST",
        "http://someurl/uploadFoo",
        0.0,
        JavaOnlyArray.from(headers),
        body,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false, /* withCredentials */
    )

    // verify url, method, headers
    with(requestArgumentCaptor) {
      verify(httpClient).newCall(capture())
      assertThat(firstValue.url().toString()).isEqualTo("http://someurl/uploadFoo")
      assertThat(firstValue.method()).isEqualTo("POST")
      assertThat(firstValue.body()?.contentType()?.type()).isEqualTo(FORM.type())
      assertThat(firstValue.body()?.contentType()?.subtype()).isEqualTo(FORM.subtype())
      val requestHeaders = firstValue.headers()
      assertThat(requestHeaders.size()).isEqualTo(3)
      assertThat(requestHeaders["Accept"]).isEqualTo("text/plain")
      assertThat(requestHeaders["User-Agent"]).isEqualTo("React test agent/1.0")
      assertThat(requestHeaders["content-type"]).isEqualTo("multipart/form-data")
    }
    requestBodyUtil.close()
  }

  @Test
  fun testMultipartPostRequestBody() {
    val inputStream = mock<InputStream>()
    whenever(inputStream.available()).thenReturn("imageUri".length)
    setupRequestBodyUtil()
    with(requestBodyUtil) {
      `when`<InputStream> { RequestBodyUtil.getFileInputStream(any(), any()) }
          .thenReturn(inputStream)
      `when`<RequestBody> { RequestBodyUtil.create(any(), any()) }.thenCallRealMethod()
    }
    val multipartBodyBuilderMock =
        mockConstruction(MultipartBody.Builder::class.java) { mock, _ ->
          whenever(mock.setType(any())).thenReturn(mock)
          whenever(mock.addPart(any(), any())).thenReturn(mock)
          whenever(mock.build()).thenReturn(mock())
        }

    val headers = listOf(JavaOnlyArray.of("content-type", "multipart/form-data"))

    val body = JavaOnlyMap()
    val formData = JavaOnlyArray()
    body.putArray("formData", formData)

    val bodyPart = JavaOnlyMap()
    bodyPart.putString("string", "locale")
    bodyPart.putArray(
        "headers",
        JavaOnlyArray.from(listOf(JavaOnlyArray.of("content-disposition", "user"))),
    )
    formData.pushMap(bodyPart)

    val imageBodyPart = JavaOnlyMap()
    imageBodyPart.putString("uri", "imageUri")
    imageBodyPart.putArray(
        "headers",
        JavaOnlyArray.from(
            listOf(
                JavaOnlyArray.of("content-type", "image/jpg"),
                JavaOnlyArray.of(
                    "content-disposition",
                    "filename=\"测试photo.jpg\"; filename*=utf-8''%E6%B5%8B%E8%AF%95photo.jpg",
                ),
            )
        ),
    )

    formData.pushMap(imageBodyPart)

    networkingModule.sendRequest(
        "POST",
        "http://someurl/uploadFoo",
        0.0,
        JavaOnlyArray.from(headers),
        body,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false, /* withCredentials */
    )

    // verify RequestBodyPart for image
    requestBodyUtil.verify { RequestBodyUtil.getFileInputStream(any(), eq("imageUri")) }
    requestBodyUtil.verify { RequestBodyUtil.create(eq(MediaType.parse("image/jpg")), any()) }

    // verify body
    val multipartBuilder = multipartBodyBuilderMock.constructed()[0]
    verify(multipartBuilder).build()
    verify(multipartBuilder).setType(FORM)
    val headersArgumentCaptor = argumentCaptor<Headers>()
    val bodyArgumentCaptor = argumentCaptor<RequestBody>()
    verify(multipartBuilder, times(2))
        .addPart(headersArgumentCaptor.capture(), bodyArgumentCaptor.capture())

    val bodyHeaders = headersArgumentCaptor.allValues
    assertThat(bodyHeaders.size).isEqualTo(2)
    val bodyRequestBody = bodyArgumentCaptor.allValues
    assertThat(bodyRequestBody.size).isEqualTo(2)

    assertThat(bodyHeaders[0]["content-disposition"]).isEqualTo("user")
    assertThat(bodyRequestBody[0].contentType()).isNull()
    assertThat(bodyRequestBody[0].contentLength()).isEqualTo("locale".toByteArray().size.toLong())
    assertThat(bodyHeaders[1]["content-disposition"])
        .isEqualTo("filename=\"测试photo.jpg\"; filename*=utf-8''%E6%B5%8B%E8%AF%95photo.jpg")
    assertThat<MediaType?>(bodyRequestBody[1].contentType()).isEqualTo(MediaType.parse("image/jpg"))
    assertThat(bodyRequestBody[1].contentLength()).isEqualTo("imageUri".toByteArray().size.toLong())

    multipartBodyBuilderMock.close()
    requestBodyUtil.close()
  }

  @Test
  fun testCancelAllCallsInvalidate() {
    val requests = 3
    val calls = mutableListOf<Call>()
    for (idx in 0 until requests) {
      calls.add(mock<Call>())
    }

    whenever(httpClient.newCall(any())).thenAnswer { invocation ->
      val request = invocation.arguments[0] as Request
      calls[(request.tag() as Int) - 1]
    }
    networkingModule.initialize()

    for (idx in 0 until requests) {
      networkingModule.sendRequest(
          "GET",
          "http://somedomain/foo",
          (idx + 1).toDouble(),
          JavaOnlyArray.of(),
          null,
          "text", /* responseType */
          true, /* useIncrementalUpdates*/
          0.0, /* timeout */
          false, /* withCredentials */
      )
    }

    verify(httpClient, times(3)).newCall(any())

    networkingModule.invalidate()
    val requestIdArguments = argumentCaptor<Int>()
    okHttpCallUtil.verify(
        { OkHttpCallUtil.cancelTag(any(), requestIdArguments.capture()) },
        times(requests),
    )

    assertThat(requestIdArguments.allValues.size).isEqualTo(requests)
    for (idx in 0 until requests) {
      assertThat(requestIdArguments.allValues.contains(idx + 1)).isTrue
    }
  }

  @Test
  fun testCancelSomeCallsInvalidate() {
    val requests = 3
    val calls = arrayOfNulls<Call>(requests)
    for (idx in 0 until requests) {
      calls[idx] = mock<Call>()
    }
    whenever(httpClient.newCall(any())).thenAnswer { invocation ->
      val request = invocation.arguments[0] as Request
      calls[(request.tag() as Int) - 1]
    }
    for (idx in 0 until requests) {
      networkingModule.sendRequest(
          "GET",
          "http://somedomain/foo",
          (idx + 1).toDouble(),
          JavaOnlyArray.of(),
          null,
          "text", /* responseType */
          true, /* useIncrementalUpdates*/
          0.0, /* timeout */
          false, /* withCredentials */
      )
    }
    verify(httpClient, times(3)).newCall(any())

    networkingModule.abortRequest(requests.toDouble())
    var clientArguments = argumentCaptor<OkHttpClient>()
    var requestIdArguments = argumentCaptor<Int>()
    okHttpCallUtil.verify {
      OkHttpCallUtil.cancelTag(clientArguments.capture(), requestIdArguments.capture())
    }
    println(requestIdArguments.allValues)
    assertThat(requestIdArguments.allValues.size).isEqualTo(1)
    assertThat(requestIdArguments.allValues[0]).isEqualTo(requests)

    // verifyStatic actually does not clear all calls so far, so we have to check for all of
    // them.
    // If `cancelTag` would've been called again for the aborted call, we would have had
    // `requests + 1` calls.
    networkingModule.invalidate()
    clientArguments = argumentCaptor<OkHttpClient>()
    requestIdArguments = argumentCaptor<Int>()
    okHttpCallUtil.verify(
        { OkHttpCallUtil.cancelTag(clientArguments.capture(), requestIdArguments.capture()) },
        times(requests),
    )
    assertThat(requestIdArguments.allValues.size).isEqualTo(requests)
    for (idx in 0 until requests) {
      assertThat(requestIdArguments.allValues.contains(idx + 1)).isTrue
    }
  }

  @Test
  fun testFileUriHandlerEmitsSuccessEvents() {
    val testData = "file content".toByteArray()
    val blobResponse =
        JavaOnlyMap().apply {
          putString("blobId", "test-blob-id")
          putInt("offset", 0)
          putInt("size", testData.size)
        }

    val fileUriHandler =
        object : NetworkingModule.UriHandler {
          override fun supports(uri: Uri, responseType: String): Boolean =
              uri.scheme == "file" && responseType == "blob"

          @Throws(IOException::class)
          override fun fetch(uri: Uri): Pair<WritableMap, ByteArray> = blobResponse to testData
        }

    networkingModule.addUriHandler(fileUriHandler)

    networkingModule.sendRequest(
        "GET",
        "file:///storage/emulated/0/Download/test.pdf",
        1.0, /* requestId */
        JavaOnlyArray.of(), /* headers */
        null, /* body */
        "blob", /* responseType */
        false, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false, /* withCredentials */
    )

    // Should not have made an OkHttp call; fileUriHandler should have handled the request.
    verify(httpClient, times(0)).newCall(any())

    // Verify the three expected events were emitted in order:
    // didReceiveNetworkResponse, didReceiveNetworkData, didCompleteNetworkResponse
    val eventNameCaptor = argumentCaptor<String>()
    val eventArgsCaptor = argumentCaptor<WritableArray>()
    verify(context, times(3)).emitDeviceEvent(eventNameCaptor.capture(), eventArgsCaptor.capture())

    assertThat(eventNameCaptor.allValues[0]).isEqualTo("didReceiveNetworkResponse")
    assertThat(eventNameCaptor.allValues[1]).isEqualTo("didReceiveNetworkData")
    assertThat(eventNameCaptor.allValues[2]).isEqualTo("didCompleteNetworkResponse")

    // Verify response event has status 200, request ID 1, empty headers, and expected URL
    val responseArgs = eventArgsCaptor.allValues[0]
    assertThat(responseArgs.getInt(0)).isEqualTo(1)
    assertThat(responseArgs.getInt(1)).isEqualTo(200)
    assertThat(responseArgs.getMap(2)).isEqualTo(JavaOnlyMap.of())
    assertThat(responseArgs.getString(3)).isEqualTo("file:///storage/emulated/0/Download/test.pdf")

    // Verify completion event has request ID 1 and null error
    val completionArgs = eventArgsCaptor.allValues[2]
    assertThat(completionArgs.getInt(0)).isEqualTo(1)
    assertThat(completionArgs.isNull(1)).isTrue()
  }
}

private val FORM = MediaType.get("multipart/form-data")
