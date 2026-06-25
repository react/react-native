/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection

import android.net.Uri
import com.facebook.common.logging.FLog
import com.facebook.react.devsupport.inspector.DevSupportHttpClient
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers.getFriendlyDeviceName
import com.facebook.react.packagerconnection.ReconnectingWebSocket.MessageCallback
import okio.ByteString
import org.json.JSONObject

/** A client for packager that uses WebSocket connection. */
public class JSPackagerClient
@JvmOverloads
public constructor(
    clientId: String,
    settings: PackagerConnectionSettings,
    private val requestHandlers: Map<String, RequestHandler>,
    connectionCallback: ReconnectingWebSocket.ConnectionCallback? = null,
) : MessageCallback {
  private val webSocket: ReconnectingWebSocket

  init {
    val url =
        Uri.Builder()
            .scheme(DevSupportHttpClient.wsScheme(settings.debugServerHost))
            .encodedAuthority(settings.debugServerHost)
            .appendPath("message")
            .appendQueryParameter("device", getFriendlyDeviceName())
            .appendQueryParameter("app", settings.packageName)
            .appendQueryParameter("clientid", clientId)
            .build()
            .toString()

    webSocket = ReconnectingWebSocket(url, this, connectionCallback)
  }

  public fun init() {
    webSocket.connect()
  }

  public fun close() {
    webSocket.closeQuietly()
  }

  override fun onMessage(text: String) {
    try {
      val message = JSONObject(text)

      val version = message.optInt("version")
      val method = message.optString("method")
      val id = message.opt("id")
      val params = message.opt("params")

      if (version != PROTOCOL_VERSION) {
        FLog.e(TAG, "Message with incompatible or missing version of protocol received: $version")
        return
      }

      if (method == null) {
        abortOnMessage(id, "No method provided")
        return
      }

      val handler = requestHandlers[method]
      if (handler == null) {
        abortOnMessage(id, "No request handler for method: $method")
        return
      }

      if (id == null) {
        handler.onNotification(params)
      } else {
        handler.onRequest(params, ResponderImpl(id))
      }
    } catch (e: Exception) {
      FLog.e(TAG, "Handling the message failed", e)
    }
  }

  override fun onMessage(bytes: ByteString) {
    FLog.w(TAG, "Websocket received message with payload of unexpected type binary")
  }

  private fun abortOnMessage(id: Any?, reason: String) {
    id?.let { ResponderImpl(it).error(reason) }

    FLog.e(TAG, "Handling the message failed with reason: $reason")
  }

  private inner class ResponderImpl(private val id: Any) : Responder {
    override fun respond(result: Any) {
      try {
        val message =
            JSONObject().apply {
              put("version", PROTOCOL_VERSION)
              put("id", id)
              put("result", result)
            }
        webSocket.sendMessage(message.toString())
      } catch (e: Exception) {
        FLog.e(TAG, "Responding failed", e)
      }
    }

    override fun error(error: Any) {
      try {
        val message =
            JSONObject().apply {
              put("version", PROTOCOL_VERSION)
              put("id", id)
              put("error", error)
            }
        webSocket.sendMessage(message.toString())
      } catch (e: Exception) {
        FLog.e(TAG, "Responding with error failed", e)
      }
    }
  }

  private companion object {
    private val TAG: String = JSPackagerClient::class.java.simpleName
    private const val PROTOCOL_VERSION = 2
  }
}
