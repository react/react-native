/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection

import android.os.Handler
import android.os.Looper
import com.facebook.common.logging.FLog
import com.facebook.react.devsupport.inspector.DevSupportHttpClient
import java.io.IOException
import java.nio.channels.ClosedChannelException
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString

/** A wrapper around WebSocketClient that reconnects automatically */
public class ReconnectingWebSocket(
    private val url: String,
    private var messageCallback: MessageCallback?,
    private val connectionCallback: ConnectionCallback?,
) : WebSocketListener() {

  public interface MessageCallback {
    public fun onMessage(text: String)

    public fun onMessage(bytes: ByteString)
  }

  public interface ConnectionCallback {
    public fun onConnected()

    public fun onDisconnected()
  }

  private val handler = Handler(Looper.getMainLooper())
  private val okHttpClient = DevSupportHttpClient.websocketClient
  private var closed = false
  private var suppressConnectionErrors = false
  private var webSocket: WebSocket? = null

  public fun connect() {
    check(!closed) { "Can't connect closed client" }

    val request = Request.Builder().url(url).build()
    okHttpClient.newWebSocket(request, this)
  }

  @Synchronized
  private fun delayedReconnect() {
    // check that we haven't been closed in the meantime
    if (!closed) {
      connect()
    }
  }

  private fun reconnect() {
    check(!closed) { "Can't reconnect closed client" }

    if (!suppressConnectionErrors) {
      FLog.w(TAG, "Couldn't connect to \"$url\", will silently retry")
      suppressConnectionErrors = true
    }

    handler.postDelayed({ delayedReconnect() }, RECONNECT_DELAY_MS)
  }

  public fun closeQuietly() {
    closed = true
    closeWebSocketQuietly()
    messageCallback = null

    connectionCallback?.onDisconnected()
  }

  private fun closeWebSocketQuietly() {
    try {
      webSocket?.close(1_000, "End of session")
    } catch (e: Exception) {
      // swallow, no need to handle it here
    }
    webSocket = null
  }

  private fun abort(message: String, cause: Throwable) {
    FLog.e(TAG, "Error occurred, shutting down websocket connection: $message", cause)
    closeWebSocketQuietly()
  }

  @Synchronized
  override fun onOpen(webSocket: WebSocket, response: Response) {
    this.webSocket = webSocket
    suppressConnectionErrors = false

    connectionCallback?.onConnected()
  }

  @Synchronized
  override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
    if (this.webSocket != null) {
      abort("Websocket exception", t)
    }
    if (!closed) {
      connectionCallback?.onDisconnected()
      reconnect()
    }
  }

  @Synchronized
  override fun onMessage(webSocket: WebSocket, text: String) {
    messageCallback?.onMessage(text)
  }

  @Synchronized
  override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
    messageCallback?.onMessage(bytes)
  }

  @Synchronized
  override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
    this.webSocket = null
    if (!closed) {
      connectionCallback?.onDisconnected()
      reconnect()
    }
  }

  @Synchronized
  @Throws(IOException::class)
  public fun sendMessage(message: String) {
    webSocket?.send(message) ?: throw ClosedChannelException()
  }

  @Synchronized
  @Throws(IOException::class)
  public fun sendMessage(message: ByteString) {
    webSocket?.send(message) ?: throw ClosedChannelException()
  }

  private companion object {
    private val TAG: String = ReconnectingWebSocket::class.java.simpleName

    private const val RECONNECT_DELAY_MS = 2_000L
  }
}
