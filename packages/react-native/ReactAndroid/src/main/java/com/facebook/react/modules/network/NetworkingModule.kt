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
import android.util.Base64
import com.facebook.common.logging.FLog
import com.facebook.fbreact.specs.NativeNetworkingAndroidSpec
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.common.network.OkHttpCallUtil
import com.facebook.react.module.annotations.ReactModule
import java.io.IOException
import java.nio.charset.StandardCharsets
import java.util.ArrayList
import java.util.HashSet
import java.util.UUID
import java.util.concurrent.TimeUnit
import okhttp3.Call
import okhttp3.Callback
import okhttp3.CookieJar
import okhttp3.Headers
import okhttp3.JavaNetCookieJar
import okhttp3.MediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.Response
import okhttp3.ResponseBody
import okio.ByteString
import okio.GzipSource
import okio.Okio

/** Implements the XMLHttpRequest JavaScript interface. */
@ReactModule(name = NativeNetworkingAndroidSpec.NAME)
public class NetworkingModule(
    reactContext: ReactApplicationContext,
    defaultUserAgent: String?,
    client: OkHttpClient,
    networkInterceptorCreators: List<NetworkInterceptorCreator>?,
) : NativeNetworkingAndroidSpec(reactContext) {

  /**
   * Allows to implement a custom fetching process for specific URIs. It is the handler's job to
   * fetch the URI and return the JS body payload.
   */
  internal interface UriHandler {
    /** Returns if the handler should be used for an URI. */
    public fun supports(uri: Uri, responseType: String): Boolean

    /**
     * Fetch the URI and return a tuple containing the JS body payload and the raw response body.
     */
    @Throws(IOException::class) public fun fetch(uri: Uri): Pair<WritableMap, ByteArray>
  }

  /** Allows adding custom handling to build the [RequestBody] from the JS body payload. */
  internal interface RequestBodyHandler {
    /** Returns if the handler should be used for a JS body payload. */
    public fun supports(map: ReadableMap): Boolean

    /** Returns the [RequestBody] for the JS body payload. */
    public fun toRequestBody(map: ReadableMap, contentType: String?): RequestBody?
  }

  /** Allows adding custom handling to build the JS body payload from the [ResponseBody]. */
  internal interface ResponseHandler {
    /** Returns if the handler should be used for a response type. */
    public fun supports(responseType: String): Boolean

    /** Returns the JS body payload for the [ResponseBody]. */
    @Throws(IOException::class) public fun toResponseData(data: ByteArray): WritableMap
  }

  private val client: OkHttpClient
  private val cookieHandler = ForwardingCookieHandler()
  private val defaultUserAgent: String?
  private var cookieJarContainer: CookieJarContainer? = null
  private val requestIds: MutableSet<Int> = HashSet()
  private val requestBodyHandlers: MutableList<RequestBodyHandler> = ArrayList()
  private val uriHandlers: MutableList<UriHandler> = ArrayList()
  private val responseHandlers: MutableList<ResponseHandler> = ArrayList()
  private var shuttingDown = false

  init {
    var resolvedClient: OkHttpClient = client
    if (networkInterceptorCreators != null) {
      val clientBuilder = client.newBuilder()
      for (networkInterceptorCreator in networkInterceptorCreators) {
        clientBuilder.addNetworkInterceptor(networkInterceptorCreator.create())
      }
      resolvedClient = clientBuilder.build()
    }
    this.client = resolvedClient

    val cookieJar = resolvedClient.cookieJar()
    cookieJarContainer =
        if (cookieJar is CookieJarContainer) {
          cookieJar
        } else {
          null
        }
    this.defaultUserAgent = defaultUserAgent
  }

  /**
   * @param context the ReactContext of the application
   * @param defaultUserAgent the User-Agent header that will be set for all requests where the
   *   caller does not provide one explicitly
   * @param client the [OkHttpClient] to be used for networking
   */
  internal constructor(
      context: ReactApplicationContext,
      defaultUserAgent: String?,
      client: OkHttpClient,
  ) : this(context, defaultUserAgent, client, null)

  /** @param context the ReactContext of the application */
  public constructor(
      context: ReactApplicationContext
  ) : this(context, null, OkHttpClientProvider.createClient(context.applicationContext), null)

  /**
   * @param context the ReactContext of the application
   * @param networkInterceptorCreators list of [NetworkInterceptorCreator]'s whose create() methods
   *   would be called to attach the interceptors to the client.
   */
  public constructor(
      context: ReactApplicationContext,
      networkInterceptorCreators: List<NetworkInterceptorCreator>?,
  ) : this(
      context,
      null,
      OkHttpClientProvider.createClient(context.applicationContext),
      networkInterceptorCreators,
  )

  /**
   * @param context the ReactContext of the application
   * @param defaultUserAgent the User-Agent header that will be set for all requests where the
   *   caller does not provide one explicitly
   */
  public constructor(
      context: ReactApplicationContext,
      defaultUserAgent: String?,
  ) : this(
      context,
      defaultUserAgent,
      OkHttpClientProvider.createClient(context.applicationContext),
      null,
  )

  @Deprecated(
      """To be removed in a future release. See
        https://github.com/facebook/react-native/pull/37798#pullrequestreview-1518338914"""
  )
  public interface CustomClientBuilder : com.facebook.react.modules.network.CustomClientBuilder

  override fun initialize() {
    cookieJarContainer?.setCookieJar(JavaNetCookieJar(cookieHandler))
  }

  override fun invalidate() {
    shuttingDown = true
    cancelAllRequests()

    cookieHandler.destroy()
    cookieJarContainer?.removeCookieJar()

    requestBodyHandlers.clear()
    responseHandlers.clear()
    uriHandlers.clear()
  }

  internal fun addUriHandler(handler: UriHandler) {
    uriHandlers.add(handler)
  }

  internal fun addRequestBodyHandler(handler: RequestBodyHandler) {
    requestBodyHandlers.add(handler)
  }

  internal fun addResponseHandler(handler: ResponseHandler) {
    responseHandlers.add(handler)
  }

  internal fun removeUriHandler(handler: UriHandler) {
    uriHandlers.remove(handler)
  }

  internal fun removeRequestBodyHandler(handler: RequestBodyHandler) {
    requestBodyHandlers.remove(handler)
  }

  internal fun removeResponseHandler(handler: ResponseHandler) {
    responseHandlers.remove(handler)
  }

  private fun extractOrGenerateDevToolsRequestId(
      data: ReadableMap?,
  ): String =
      (if (
          data != null &&
              data.hasKey(REQUEST_DATA_KEY_DEVTOOLS_REQUEST_ID) &&
              data.getType(REQUEST_DATA_KEY_DEVTOOLS_REQUEST_ID) == ReadableType.String
      )
          data.getString(REQUEST_DATA_KEY_DEVTOOLS_REQUEST_ID)
      else null) ?: UUID.randomUUID().toString()

  override fun sendRequest(
      method: String,
      url: String,
      requestIdAsDouble: Double,
      headers: ReadableArray?,
      data: ReadableMap?,
      responseType: String,
      useIncrementalUpdates: Boolean,
      timeoutAsDouble: Double,
      withCredentials: Boolean,
  ) {
    val requestId = requestIdAsDouble.toInt()
    val timeout = timeoutAsDouble.toInt()
    val devToolsRequestId = extractOrGenerateDevToolsRequestId(data)
    try {
      sendRequestInternalReal(
          method,
          url,
          requestId,
          headers,
          data,
          responseType,
          useIncrementalUpdates,
          timeout,
          withCredentials,
          devToolsRequestId,
      )
    } catch (th: Throwable) {
      FLog.e(TAG, "Failed to send url request: $url", th)

      NetworkEventUtil.onRequestError(
          getReactApplicationContextIfActiveOrWarn(),
          requestId,
          devToolsRequestId,
          th.message,
          th,
      )
    }
  }

  @Deprecated("""sendRequestInternal is internal and will be made private in a future release.""")
  /** @param timeout value of 0 results in no timeout */
  public fun sendRequestInternal(
      method: String,
      url: String?,
      requestId: Int,
      headers: ReadableArray?,
      data: ReadableMap?,
      responseType: String,
      useIncrementalUpdates: Boolean,
      timeout: Int,
      withCredentials: Boolean,
  ) {
    sendRequestInternalReal(
        method,
        url,
        requestId,
        headers,
        data,
        responseType,
        useIncrementalUpdates,
        timeout,
        withCredentials,
        extractOrGenerateDevToolsRequestId(data),
    )
  }

  /** @param timeout value of 0 results in no timeout */
  private fun sendRequestInternalReal(
      method: String,
      url: String?,
      requestId: Int,
      headers: ReadableArray?,
      data: ReadableMap?,
      responseType: String,
      useIncrementalUpdates: Boolean,
      timeout: Int,
      withCredentials: Boolean,
      devToolsRequestId: String,
  ) {
    val reactApplicationContext = getReactApplicationContextIfActiveOrWarn()
    try {
      val uri = Uri.parse(url)

      // Check if a handler is registered
      for (handler in uriHandlers) {
        if (handler.supports(uri, responseType)) {
          val (res, rawBody) = handler.fetch(uri)
          val encodedDataLength = res.toString().toByteArray().size
          NetworkEventUtil.onResponseReceived(
              reactApplicationContext,
              requestId,
              devToolsRequestId,
              url,
              200,
              emptyMap(),
              encodedDataLength.toLong(),
          )
          NetworkEventUtil.onDataReceived(
              reactApplicationContext,
              requestId,
              devToolsRequestId,
              res,
              rawBody,
          )
          NetworkEventUtil.onRequestSuccess(
              reactApplicationContext,
              requestId,
              devToolsRequestId,
              encodedDataLength.toLong(),
          )
          return
        }
      }
    } catch (e: IOException) {
      NetworkEventUtil.onRequestError(
          reactApplicationContext,
          requestId,
          devToolsRequestId,
          e.message,
          e,
      )
      return
    }

    val requestBuilder: Request.Builder
    try {
      requestBuilder = Request.Builder().url(url.orEmpty())
    } catch (e: Exception) {
      NetworkEventUtil.onRequestError(
          reactApplicationContext,
          requestId,
          devToolsRequestId,
          e.message,
          e,
      )
      return
    }

    if (requestId != 0) {
      requestBuilder.tag(requestId)
    }

    val clientBuilder = client.newBuilder()

    applyCustomBuilder(clientBuilder)

    if (!withCredentials) {
      clientBuilder.cookieJar(CookieJar.NO_COOKIES)
    }

    // If JS is listening for progress updates, install a ProgressResponseBody that intercepts the
    // response and counts bytes received.
    if (useIncrementalUpdates) {
      clientBuilder.addNetworkInterceptor { chain ->
        val originalResponse = chain.proceed(chain.request())
        val originalResponseBody = checkNotNull(originalResponse.body())
        val responseBody =
            ProgressResponseBody(
                originalResponseBody,
                object : ProgressListener {
                  var last: Long = System.nanoTime()

                  override fun onProgress(bytesWritten: Long, contentLength: Long, done: Boolean) {
                    val now = System.nanoTime()
                    if (!done && !shouldDispatch(now, last)) {
                      return
                    }
                    if (responseType == "text") {
                      // For 'text' responses we continuously send response data with progress
                      // info to
                      // JS below, so no need to do anything here.
                      return
                    }
                    NetworkEventUtil.onDataReceivedProgress(
                        reactApplicationContext,
                        requestId,
                        bytesWritten,
                        contentLength,
                    )
                    last = now
                  }
                },
            )
        originalResponse.newBuilder().body(responseBody).build()
      }
    }

    // If the current timeout does not equal the passed in timeout, we need to clone the existing
    // client and set the timeout explicitly on the clone.  This is cheap as everything else is
    // shared under the hood.
    // See https://github.com/square/okhttp/wiki/Recipes#per-call-configuration for more information
    if (timeout != client.callTimeoutMillis()) {
      clientBuilder.callTimeout(timeout.toLong(), TimeUnit.MILLISECONDS)
    }
    val client = clientBuilder.build()

    val requestHeaders = extractHeaders(headers, data)
    if (requestHeaders == null) {
      NetworkEventUtil.onRequestError(
          reactApplicationContext,
          requestId,
          devToolsRequestId,
          "Unrecognized headers format",
          null,
      )
      return
    }
    var contentType = requestHeaders[CONTENT_TYPE_HEADER_NAME]
    val contentEncoding = requestHeaders[CONTENT_ENCODING_HEADER_NAME]
    requestBuilder.headers(requestHeaders)

    // Check if a handler is registered
    var handler: RequestBodyHandler? = null
    if (data != null) {
      for (curHandler in requestBodyHandlers) {
        if (curHandler.supports(data)) {
          handler = curHandler
          break
        }
      }
    }

    var requestBody: RequestBody?
    when {
      data == null || method.lowercase() == "get" || method.lowercase() == "head" ->
          requestBody = RequestBodyUtil.getEmptyBody(method)
      handler != null -> requestBody = handler.toRequestBody(data, contentType)
      data.hasKey(REQUEST_BODY_KEY_STRING) -> {
        if (contentType == null) {
          NetworkEventUtil.onRequestError(
              reactApplicationContext,
              requestId,
              devToolsRequestId,
              "Payload is set but no content-type header specified",
              null,
          )
          return
        }
        val body = data.getString(REQUEST_BODY_KEY_STRING)
        val contentMediaType = MediaType.parse(contentType)
        if (RequestBodyUtil.isGzipEncoding(contentEncoding)) {
          requestBody = null
          if (contentMediaType != null && body != null) {
            requestBody = RequestBodyUtil.createGzip(contentMediaType, body)
          }
          if (requestBody == null) {
            NetworkEventUtil.onRequestError(
                reactApplicationContext,
                requestId,
                devToolsRequestId,
                "Failed to gzip request body",
                null,
            )
            return
          }
        } else {
          // Use getBytes() to convert the body into a byte[], preventing okhttp from
          // appending the character set to the Content-Type header when otherwise unspecified
          // https://github.com/facebook/react-native/issues/8237
          val charset =
              if (contentMediaType == null) {
                StandardCharsets.UTF_8
              } else {
                checkNotNull(contentMediaType.charset(StandardCharsets.UTF_8))
              }
          if (body == null) {
            NetworkEventUtil.onRequestError(
                reactApplicationContext,
                requestId,
                devToolsRequestId,
                "Received request but body was empty",
                null,
            )
            return
          }
          @Suppress("DEPRECATION")
          requestBody = RequestBody.create(contentMediaType, body.toByteArray(charset))
        }
      }
      data.hasKey(REQUEST_BODY_KEY_BASE64) -> {
        if (contentType == null) {
          NetworkEventUtil.onRequestError(
              reactApplicationContext,
              requestId,
              devToolsRequestId,
              "Payload is set but no content-type header specified",
              null,
          )
          return
        }
        val base64String = data.getString(REQUEST_BODY_KEY_BASE64)
        checkNotNull(base64String)

        val contentMediaType = MediaType.parse(contentType)
        if (contentMediaType == null) {
          NetworkEventUtil.onRequestError(
              reactApplicationContext,
              requestId,
              devToolsRequestId,
              "Invalid content type specified: $contentType",
              null,
          )
          return
        }
        val base64DecodedString = ByteString.decodeBase64(base64String)
        if (base64DecodedString == null) {
          NetworkEventUtil.onRequestError(
              reactApplicationContext,
              requestId,
              devToolsRequestId,
              "Request body base64 string was invalid",
              null,
          )
          return
        }
        @Suppress("DEPRECATION")
        requestBody = RequestBody.create(contentMediaType, base64DecodedString)
      }
      data.hasKey(REQUEST_BODY_KEY_URI) -> {
        if (contentType == null) {
          NetworkEventUtil.onRequestError(
              reactApplicationContext,
              requestId,
              devToolsRequestId,
              "Payload is set but no content-type header specified",
              null,
          )
          return
        }
        val uri = data.getString(REQUEST_BODY_KEY_URI)
        if (uri == null) {
          NetworkEventUtil.onRequestError(
              reactApplicationContext,
              requestId,
              devToolsRequestId,
              "Request body URI field was set but null",
              null,
          )
          return
        }
        val fileInputStream = RequestBodyUtil.getFileInputStream(getReactApplicationContext(), uri)
        if (fileInputStream == null) {
          NetworkEventUtil.onRequestError(
              reactApplicationContext,
              requestId,
              devToolsRequestId,
              "Could not retrieve file for uri $uri",
              null,
          )
          return
        }
        requestBody = RequestBodyUtil.create(MediaType.parse(contentType), fileInputStream)
      }
      data.hasKey(REQUEST_BODY_KEY_FORMDATA) -> {
        if (contentType == null) {
          contentType = "multipart/form-data"
        }
        val parts = data.getArray(REQUEST_BODY_KEY_FORMDATA)
        if (parts == null) {
          NetworkEventUtil.onRequestError(
              reactApplicationContext,
              requestId,
              devToolsRequestId,
              "Received request but form data was empty",
              null,
          )
          return
        }
        val multipartBuilder =
            constructMultipartBody(parts, contentType, requestId, devToolsRequestId) ?: return
        requestBody = multipartBuilder.build()
      }
      else -> {
        // Nothing in data payload, at least nothing we could understand anyway.
        requestBody = RequestBodyUtil.getEmptyBody(method)
      }
    }

    requestBuilder.method(method, wrapRequestBodyWithProgressEmitter(requestBody, requestId))

    addRequest(requestId)
    val request = requestBuilder.build()

    NetworkEventUtil.onCreateRequest(
        devToolsRequestId,
        request.url().toString(),
        request.method(),
        NetworkEventUtil.okHttpHeadersToMap(request.headers()),
        if (ReactBuildConfig.DEBUG) NetworkEventUtil.getRequestBodyPreview(request.body())
        else null,
        request.body()?.contentLength() ?: 0,
    )

    client
        .newCall(request)
        .enqueue(
            object : Callback {
              override fun onFailure(call: Call, e: IOException) {
                if (shuttingDown) {
                  return
                }
                removeRequest(requestId)
                val errorMessage =
                    e.message ?: ("Error while executing request: ${e.javaClass.simpleName}")
                NetworkEventUtil.onRequestError(
                    reactApplicationContext,
                    requestId,
                    devToolsRequestId,
                    errorMessage,
                    e,
                )
              }

              @Throws(IOException::class)
              override fun onResponse(call: Call, response: Response) {
                if (shuttingDown) {
                  return
                }
                removeRequest(requestId)
                // Before we touch the body send headers to JS
                NetworkEventUtil.onResponseReceived(
                    reactApplicationContext,
                    requestId,
                    devToolsRequestId,
                    response.request().url().toString(),
                    response.code(),
                    NetworkEventUtil.okHttpHeadersToMap(response.headers()),
                    response.body()?.contentLength() ?: 0L,
                )

                try {
                  // OkHttp implements something called transparent gzip, which mean that it will
                  // automatically add the Accept-Encoding gzip header and handle decoding
                  // internally.
                  // The issue is that it won't handle decoding if the user provides a
                  // Accept-Encoding
                  // header. This is also undesirable considering that iOS does handle the decoding
                  // even
                  // when the header is provided. To make sure this works in all cases, handle gzip
                  // body
                  // here also. This works fine since OKHttp will remove the Content-Encoding header
                  // if
                  // it used transparent gzip.
                  // See
                  // https://github.com/square/okhttp/blob/5b37cda9e00626f43acf354df145fd452c3031f1/okhttp/src/main/java/okhttp3/internal/http/BridgeInterceptor.java#L76-L111
                  var responseBody: ResponseBody? = response.body()
                  if (responseBody == null) {
                    NetworkEventUtil.onRequestError(
                        reactApplicationContext,
                        requestId,
                        devToolsRequestId,
                        "Response body is null",
                        null,
                    )
                    return
                  }
                  if ("gzip".equals(response.header("Content-Encoding"), ignoreCase = true)) {
                    val gzipSource = GzipSource(responseBody.source())
                    val parsedContentType = response.header("Content-Type")?.let(MediaType::parse)
                    responseBody =
                        @Suppress("DEPRECATION")
                        ResponseBody.create(
                            parsedContentType,
                            -1L,
                            Okio.buffer(gzipSource),
                        )
                  }
                  // To satisfy the compiler, this is already checked above
                  checkNotNull(responseBody)
                  // Check if a handler is registered
                  for (responseHandler in responseHandlers) {
                    if (responseHandler.supports(responseType)) {
                      val responseData = responseBody.bytes()
                      val res = responseHandler.toResponseData(responseData)
                      NetworkEventUtil.onDataReceived(
                          reactApplicationContext,
                          requestId,
                          devToolsRequestId,
                          res,
                          responseData,
                      )
                      NetworkEventUtil.onRequestSuccess(
                          reactApplicationContext,
                          requestId,
                          devToolsRequestId,
                          responseBody.contentLength(),
                      )
                      return
                    }
                  }

                  // If JS wants progress updates during the download, and it requested a text
                  // response,
                  // periodically send response data updates to JS.
                  if (useIncrementalUpdates && responseType == "text") {
                    readWithProgress(requestId, devToolsRequestId, responseBody)
                    NetworkEventUtil.onRequestSuccess(
                        reactApplicationContext,
                        requestId,
                        devToolsRequestId,
                        responseBody.contentLength(),
                    )
                    return
                  }

                  // Otherwise send the data in one big chunk, in the format that JS requested.
                  var responseString: String? = ""
                  if (responseType == "text") {
                    try {
                      responseString = responseBody.string()
                    } catch (e: IOException) {
                      if (response.request().method().equals("HEAD", ignoreCase = true)) {
                        // The request is an `HEAD` and the body is empty,
                        // the OkHttp will produce an exception.
                        // Ignore the exception to not invalidate the request in the
                        // Javascript layer.
                        // Introduced to fix issue #7463.
                      } else {
                        NetworkEventUtil.onRequestError(
                            reactApplicationContext,
                            requestId,
                            devToolsRequestId,
                            e.message,
                            e,
                        )
                      }
                    }
                  } else if (responseType == "base64") {
                    responseString = Base64.encodeToString(responseBody.bytes(), Base64.NO_WRAP)
                  }
                  NetworkEventUtil.onDataReceived(
                      reactApplicationContext,
                      requestId,
                      devToolsRequestId,
                      responseString,
                      responseType,
                  )
                  NetworkEventUtil.onRequestSuccess(
                      reactApplicationContext,
                      requestId,
                      devToolsRequestId,
                      responseBody.contentLength(),
                  )
                } catch (e: IOException) {
                  NetworkEventUtil.onRequestError(
                      reactApplicationContext,
                      requestId,
                      devToolsRequestId,
                      e.message,
                      e,
                  )
                } catch (e: OutOfMemoryError) {
                  NetworkEventUtil.onRequestError(
                      reactApplicationContext,
                      requestId,
                      devToolsRequestId,
                      "Out of memory while processing network response",
                      null,
                  )
                }
              }
            }
        )
  }

  private fun wrapRequestBodyWithProgressEmitter(
      requestBody: RequestBody?,
      requestId: Int,
  ): RequestBody? {
    if (requestBody == null) {
      return null
    }
    val reactApplicationContext = getReactApplicationContextIfActiveOrWarn()
    return RequestBodyUtil.createProgressRequest(
        requestBody,
        object : ProgressListener {
          var last: Long = System.nanoTime()

          override fun onProgress(bytesWritten: Long, contentLength: Long, done: Boolean) {
            val now = System.nanoTime()
            if (done || shouldDispatch(now, last)) {
              NetworkEventUtil.onDataSend(
                  reactApplicationContext,
                  requestId,
                  bytesWritten,
                  contentLength,
              )
              last = now
            }
          }
        },
    )
  }

  @Throws(IOException::class)
  private fun readWithProgress(
      requestId: Int,
      devToolsRequestId: String,
      responseBody: ResponseBody,
  ) {
    var totalBytesRead: Long = -1
    var contentLength: Long = -1
    try {
      val progressResponseBody = responseBody as ProgressResponseBody
      totalBytesRead = progressResponseBody.totalBytesRead()
      contentLength = progressResponseBody.contentLength()
    } catch (e: ClassCastException) {
      // Ignore
    }

    val charset =
        if (responseBody.contentType() == null) {
          StandardCharsets.UTF_8
        } else {
          checkNotNull(responseBody.contentType()?.charset(StandardCharsets.UTF_8)) {
            "Null character set for Content-Type: ${responseBody.contentType()}"
          }
        }
    val streamDecoder = ProgressiveStringDecoder(charset)
    val inputStream = responseBody.byteStream()
    try {
      val buffer = ByteArray(MAX_CHUNK_SIZE_BETWEEN_FLUSHES)
      var read: Int
      val reactApplicationContext = getReactApplicationContextIfActiveOrWarn()
      while ((inputStream.read(buffer).also { read = it }) != -1) {
        NetworkEventUtil.onIncrementalDataReceived(
            reactApplicationContext,
            requestId,
            devToolsRequestId,
            streamDecoder.decodeNext(buffer, read),
            totalBytesRead,
            contentLength,
        )
      }
    } finally {
      inputStream.close()
    }
  }

  @Synchronized
  private fun addRequest(requestId: Int) {
    requestIds.add(requestId)
  }

  @Synchronized
  private fun removeRequest(requestId: Int) {
    requestIds.remove(requestId)
  }

  @Synchronized
  private fun cancelAllRequests() {
    for (requestId in requestIds) {
      cancelRequest(requestId)
    }
    requestIds.clear()
  }

  override fun abortRequest(requestIdAsDouble: Double) {
    val requestId = requestIdAsDouble.toInt()
    cancelRequest(requestId)
    removeRequest(requestId)
  }

  private fun cancelRequest(requestId: Int) {
    OkHttpCallUtil.cancelTag(client, requestId)
  }

  @ReactMethod
  public override fun clearCookies(callback: com.facebook.react.bridge.Callback) {
    cookieHandler.clearCookies(callback)
  }

  public override fun addListener(eventName: String?): Unit = Unit

  public override fun removeListeners(count: Double): Unit = Unit

  private fun constructMultipartBody(
      body: ReadableArray,
      contentType: String,
      requestId: Int,
      devToolsRequestId: String,
  ): MultipartBody.Builder? {
    val reactApplicationContext = getReactApplicationContextIfActiveOrWarn()
    val multipartBuilder = MultipartBody.Builder()
    val mediaType = MediaType.parse(contentType)
    if (mediaType == null) {
      NetworkEventUtil.onRequestError(
          reactApplicationContext,
          requestId,
          devToolsRequestId,
          "Invalid media type.",
          null,
      )
      return null
    }
    multipartBuilder.setType(mediaType)

    for (i in 0 until body.size()) {
      val bodyPart = body.getMap(i)
      if (bodyPart == null) {
        NetworkEventUtil.onRequestError(
            reactApplicationContext,
            requestId,
            devToolsRequestId,
            "Unrecognized FormData part.",
            null,
        )
        return null
      }

      // Determine part's content type.
      val headersArray = bodyPart.getArray("headers")
      var headers = extractHeaders(headersArray, null)
      if (headers == null) {
        NetworkEventUtil.onRequestError(
            reactApplicationContext,
            requestId,
            devToolsRequestId,
            "Missing or invalid header format for FormData part.",
            null,
        )
        return null
      }
      var partContentType: MediaType? = null
      val partContentTypeStr = headers[CONTENT_TYPE_HEADER_NAME]
      if (partContentTypeStr != null) {
        partContentType = MediaType.parse(partContentTypeStr)
        // Remove the content-type header because MultipartBuilder gets it explicitly as an
        // argument and doesn't expect it in the headers array.
        headers = headers.newBuilder().removeAll(CONTENT_TYPE_HEADER_NAME).build()
      }

      if (
          bodyPart.hasKey(REQUEST_BODY_KEY_STRING) &&
              bodyPart.getString(REQUEST_BODY_KEY_STRING) != null
      ) {
        val bodyValue = bodyPart.getString(REQUEST_BODY_KEY_STRING).orEmpty()
        @Suppress("DEPRECATION")
        multipartBuilder.addPart(headers, RequestBody.create(partContentType, bodyValue))
      } else if (
          bodyPart.hasKey(REQUEST_BODY_KEY_URI) && bodyPart.getString(REQUEST_BODY_KEY_URI) != null
      ) {
        if (partContentType == null) {
          NetworkEventUtil.onRequestError(
              reactApplicationContext,
              requestId,
              devToolsRequestId,
              "Binary FormData part needs a content-type header.",
              null,
          )
          return null
        }
        val fileContentUriStr = bodyPart.getString(REQUEST_BODY_KEY_URI)
        if (fileContentUriStr == null) {
          NetworkEventUtil.onRequestError(
              reactApplicationContext,
              requestId,
              devToolsRequestId,
              "Body must have a valid file uri",
              null,
          )
          return null
        }
        val fileInputStream =
            RequestBodyUtil.getFileInputStream(getReactApplicationContext(), fileContentUriStr)
        if (fileInputStream == null) {
          NetworkEventUtil.onRequestError(
              reactApplicationContext,
              requestId,
              devToolsRequestId,
              "Could not retrieve file for uri $fileContentUriStr",
              null,
          )
          return null
        }
        multipartBuilder.addPart(headers, RequestBodyUtil.create(partContentType, fileInputStream))
      } else {
        NetworkEventUtil.onRequestError(
            reactApplicationContext,
            requestId,
            devToolsRequestId,
            "Unrecognized FormData part.",
            null,
        )
      }
    }
    return multipartBuilder
  }

  /**
   * Extracts the headers from the Array. If the format is invalid, this method will return null.
   */
  private fun extractHeaders(headersArray: ReadableArray?, requestData: ReadableMap?): Headers? {
    if (headersArray == null) {
      return null
    }
    val headersBuilder = Headers.Builder()
    for (headersIdx in 0 until headersArray.size()) {
      val header = headersArray.getArray(headersIdx)
      if (header == null || header.size() != 2) {
        return null
      }
      var headerName: String? = header.getString(0)
      if (headerName != null) {
        headerName = HeaderUtil.stripHeaderName(headerName)
      }
      val headerValue = header.getString(1)
      if (headerName == null || headerValue == null) {
        return null
      }
      headersBuilder.addUnsafeNonAscii(headerName, headerValue)
    }
    if (headersBuilder[USER_AGENT_HEADER_NAME] == null && defaultUserAgent != null) {
      headersBuilder.add(USER_AGENT_HEADER_NAME, defaultUserAgent)
    }

    // Sanitize content encoding header, supported only when request specify payload as string
    val isGzipSupported = requestData?.hasKey(REQUEST_BODY_KEY_STRING) == true
    if (!isGzipSupported) {
      headersBuilder.removeAll(CONTENT_ENCODING_HEADER_NAME)
    }

    return headersBuilder.build()
  }

  public companion object {
    public const val NAME: String = NativeNetworkingAndroidSpec.NAME
    private const val TAG: String = NativeNetworkingAndroidSpec.NAME
    private const val CONTENT_ENCODING_HEADER_NAME = "content-encoding"
    private const val CONTENT_TYPE_HEADER_NAME = "content-type"
    private const val REQUEST_BODY_KEY_STRING = "string"
    private const val REQUEST_BODY_KEY_URI = "uri"
    private const val REQUEST_BODY_KEY_FORMDATA = "formData"
    private const val REQUEST_BODY_KEY_BASE64 = "base64"
    private const val REQUEST_DATA_KEY_DEVTOOLS_REQUEST_ID = "devToolsRequestId"
    private const val USER_AGENT_HEADER_NAME = "user-agent"
    private const val CHUNK_TIMEOUT_NS = 100 * 1_000_000 // 100ms
    private const val MAX_CHUNK_SIZE_BETWEEN_FLUSHES = 8 * 1_024 // 8K

    private var customClientBuilder: com.facebook.react.modules.network.CustomClientBuilder? = null

    @JvmStatic
    public fun setCustomClientBuilder(
        ccb: com.facebook.react.modules.network.CustomClientBuilder?
    ) {
      customClientBuilder = ccb
    }

    private fun applyCustomBuilder(builder: OkHttpClient.Builder) {
      customClientBuilder?.apply(builder)
    }

    private fun shouldDispatch(now: Long, last: Long): Boolean = last + CHUNK_TIMEOUT_NS < now
  }
}
