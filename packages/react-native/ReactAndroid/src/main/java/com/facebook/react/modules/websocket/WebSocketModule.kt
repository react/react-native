/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.modules.websocket

import com.facebook.common.logging.FLog
import com.facebook.fbreact.specs.NativeWebSocketModuleSpec
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.buildReadableMap
import com.facebook.react.common.ReactConstants
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.network.CustomClientBuilder
import com.facebook.react.modules.network.ForwardingCookieHandler
import com.facebook.react.modules.network.OkHttpClientProvider
import java.io.IOException
import java.net.URI
import java.net.URISyntaxException
import java.util.HashMap
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import okhttp3.CookieJar
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString

@ReactModule(name = WebSocketModule.NAME)
public class WebSocketModule(context: ReactApplicationContext) :
    NativeWebSocketModuleSpec(context) {

  public interface ContentHandler {
    public fun onMessage(text: String, params: WritableMap)

    public fun onMessage(byteString: ByteString, params: WritableMap)
  }

  private val webSocketConnections: MutableMap<Int, WebSocket> = ConcurrentHashMap()
  private val contentHandlers: MutableMap<Int, ContentHandler> = ConcurrentHashMap()
  private val cookieHandler: ForwardingCookieHandler = ForwardingCookieHandler()

  override fun invalidate() {
    for (socket in webSocketConnections.values) {
      socket.close(1_001 /* endpoint is going away */, null)
    }
    webSocketConnections.clear()
    contentHandlers.clear()
  }

  private fun sendEvent(eventName: String, params: ReadableMap) {
    val reactAppContext = reactApplicationContext
    if (reactAppContext.hasActiveReactInstance()) {
      reactAppContext.emitDeviceEvent(eventName, params)
    }
  }

  public fun setContentHandler(id: Int, contentHandler: ContentHandler?) {
    if (contentHandler != null) {
      contentHandlers[id] = contentHandler
    } else {
      contentHandlers.remove(id)
    }
  }

  override fun connect(
      url: String,
      protocols: ReadableArray?,
      options: ReadableMap?,
      socketID: Double,
  ) {
    val id = socketID.toInt()
    val okHttpBuilder =
        OkHttpClientProvider.getOkHttpClient()
            .newBuilder()
            // Don't let BridgeInterceptor overwrite a caller-supplied Cookie header.
            .cookieJar(CookieJar.NO_COOKIES)
            .connectTimeout(10, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.SECONDS)
            .readTimeout(0, TimeUnit.MINUTES) // Disable timeouts for read

    applyCustomBuilder(okHttpBuilder)

    val client = okHttpBuilder.build()

    val builder = Request.Builder().tag(id).url(url)

    val cookie = this.getCookie(url)
    if (cookie != null) {
      builder.addHeader("Cookie", cookie)
    }

    var hasOriginHeader = false

    if (options?.hasKey("headers") == true && options.getType("headers") == ReadableType.Map) {
      val headers = checkNotNull(options.getMap("headers"))
      val iterator = headers.keySetIterator()

      while (iterator.hasNextKey()) {
        val key = iterator.nextKey()
        if (ReadableType.String == headers.getType(key)) {
          if (key.equals("origin", ignoreCase = true)) {
            hasOriginHeader = true
          }
          builder.addHeader(
              key,
              checkNotNull(headers.getString(key)) { "value for name $key == null" },
          )
        } else {
          FLog.w(ReactConstants.TAG, "Ignoring: requested $key, value not a string")
        }
      }
    }

    if (!hasOriginHeader) {
      builder.addHeader("origin", getDefaultOrigin(url))
    }

    if (protocols != null && protocols.size() > 0) {
      val protocolsValue = StringBuilder("")
      for (i in 0..<protocols.size()) {
        val v = protocols.getString(i)?.trim()
        if (!v.isNullOrEmpty() && !v.contains(",")) {
          protocolsValue.append(v)
          protocolsValue.append(",")
        }
      }
      if (protocolsValue.isNotEmpty()) {
        protocolsValue.replace(protocolsValue.length - 1, protocolsValue.length, "")
        builder.addHeader("Sec-WebSocket-Protocol", protocolsValue.toString())
      }
    }

    client.newWebSocket(
        builder.build(),
        object : WebSocketListener() {
          override fun onOpen(webSocket: WebSocket, response: Response) {
            webSocketConnections[id] = webSocket
            val params = buildReadableMap {
              put("id", id)
              put("protocol", response.header("Sec-WebSocket-Protocol", ""))
            }
            sendEvent("websocketOpen", params)
          }

          override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
            webSocket.close(code, reason)
          }

          override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
            val params = buildReadableMap {
              put("id", id)
              put("code", code)
              put("reason", reason)
            }
            sendEvent("websocketClosed", params)
          }

          override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            notifyWebSocketFailed(id, t.message)
          }

          override fun onMessage(webSocket: WebSocket, text: String) {
            val params = Arguments.createMap()
            params.putInt("id", id)
            params.putString("type", "text")

            val contentHandler = contentHandlers[id]
            if (contentHandler != null) {
              contentHandler.onMessage(text, params)
            } else {
              params.putString("data", text)
            }
            sendEvent("websocketMessage", params)
          }

          override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
            val params = Arguments.createMap()
            params.putInt("id", id)
            params.putString("type", "binary")

            val contentHandler = contentHandlers[id]
            if (contentHandler != null) {
              contentHandler.onMessage(bytes, params)
            } else {
              val text = bytes.base64()

              params.putString("data", text)
            }

            sendEvent("websocketMessage", params)
          }
        },
    )
  }

  override fun close(code: Double, reason: String?, socketID: Double) {
    val id = socketID.toInt()
    val client = webSocketConnections[id]
    if (client == null) {
      // WebSocket is already closed
      // Don't do anything, mirror the behavior on web
      return
    }
    try {
      client.close(code.toInt(), reason)
      webSocketConnections.remove(id)
      contentHandlers.remove(id)
    } catch (e: Exception) {
      FLog.e(ReactConstants.TAG, "Could not close WebSocket connection for id $id", e)
    }
  }

  override fun send(message: String, socketID: Double) {
    val id = socketID.toInt()
    val client = webSocketConnections[id]
    if (client == null) {
      // This is a programmer error -- display development warning
      var params = buildReadableMap {
        put("id", id)
        put("message", "client is null")
      }
      sendEvent("websocketFailed", params)
      params = buildReadableMap {
        put("id", id)
        put("code", 0)
        put("reason", "client is null")
      }
      sendEvent("websocketClosed", params)
      webSocketConnections.remove(id)
      contentHandlers.remove(id)
      return
    }
    try {
      client.send(message)
    } catch (e: Exception) {
      notifyWebSocketFailed(id, e.message)
    }
  }

  override fun sendBinary(base64String: String, socketID: Double) {
    val id = socketID.toInt()
    val client = webSocketConnections[id]
    if (client == null) {
      // This is a programmer error -- display development warning
      var params = buildReadableMap {
        put("id", id)
        put("message", "client is null")
      }
      sendEvent("websocketFailed", params)
      params = buildReadableMap {
        put("id", id)
        put("code", 0)
        put("reason", "client is null")
      }
      sendEvent("websocketClosed", params)
      webSocketConnections.remove(id)
      contentHandlers.remove(id)
      return
    }
    try {
      val decodedString = checkNotNull(ByteString.decodeBase64(base64String)) { "bytes == null" }
      client.send(decodedString)
    } catch (e: Exception) {
      notifyWebSocketFailed(id, e.message)
    }
  }

  public fun sendBinary(byteString: ByteString, id: Int) {
    val client = webSocketConnections[id]
    if (client == null) {
      // This is a programmer error -- display development warning
      var params = buildReadableMap {
        put("id", id)
        put("message", "client is null")
      }
      sendEvent("websocketFailed", params)
      params = buildReadableMap {
        put("id", id)
        put("code", 0)
        put("reason", "client is null")
      }
      sendEvent("websocketClosed", params)
      webSocketConnections.remove(id)
      contentHandlers.remove(id)
      return
    }
    try {
      client.send(byteString)
    } catch (e: Exception) {
      notifyWebSocketFailed(id, e.message)
    }
  }

  override fun ping(socketID: Double) {
    val id = socketID.toInt()
    val client = webSocketConnections[id]
    if (client == null) {
      // This is a programmer error -- display development warning
      var params = buildReadableMap {
        put("id", id)
        put("message", "client is null")
      }
      sendEvent("websocketFailed", params)
      params = buildReadableMap {
        put("id", id)
        put("code", 0)
        put("reason", "client is null")
      }
      sendEvent("websocketClosed", params)
      webSocketConnections.remove(id)
      contentHandlers.remove(id)
      return
    }
    try {
      client.send(ByteString.EMPTY)
    } catch (e: Exception) {
      notifyWebSocketFailed(id, e.message)
    }
  }

  private fun notifyWebSocketFailed(id: Int, message: String?) {
    val params = buildReadableMap {
      put("id", id)
      put("message", message)
    }
    sendEvent("websocketFailed", params)
  }

  /**
   * Get the cookie for a specific domain
   *
   * @param uri
   * @return The cookie header or null if none is set
   */
  private fun getCookie(uri: String): String? {
    try {
      val origin = URI(getDefaultOrigin(uri))
      val cookieMap = cookieHandler.get(origin, HashMap<String, List<String>>())
      val cookieList = cookieMap["Cookie"]
      if (cookieList.isNullOrEmpty()) {
        return null
      }
      return cookieList[0]
    } catch (e: URISyntaxException) {
      throw IllegalArgumentException("Unable to get cookie from $uri")
    } catch (e: IOException) {
      throw IllegalArgumentException("Unable to get cookie from $uri")
    }
  }

  override fun addListener(eventName: String): Unit = Unit

  override fun removeListeners(count: Double): Unit = Unit

  public companion object {
    public const val NAME: String = NativeWebSocketModuleSpec.NAME

    private var customClientBuilder: CustomClientBuilder? = null

    @JvmStatic
    public fun setCustomClientBuilder(ccb: CustomClientBuilder?) {
      customClientBuilder = ccb
    }

    private fun applyCustomBuilder(builder: OkHttpClient.Builder) {
      customClientBuilder?.apply(builder)
    }

    /**
     * Get the default HTTP(S) origin for a specific WebSocket URI
     *
     * @param uri
     * @return A string of the endpoint converted to HTTP protocol (http[s]://host[:port])
     */
    private fun getDefaultOrigin(uri: String): String {
      try {
        val requestURI = URI(uri)
        val scheme =
            when (requestURI.scheme) {
              "wss" -> "https"
              "ws" -> "http"
              "http",
              "https" -> requestURI.scheme
              else -> ""
            }

        val defaultOrigin =
            if (requestURI.port != -1) {
              "$scheme://${requestURI.host}:${requestURI.port}"
            } else {
              "$scheme://${requestURI.host}"
            }

        return defaultOrigin
      } catch (e: URISyntaxException) {
        throw IllegalArgumentException("Unable to set $uri as default origin header")
      }
    }
  }
}
