/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection

import com.facebook.react.packagerconnection.ReconnectingWebSocket.ConnectionCallback
import java.io.IOException
import okhttp3.Response
import okhttp3.WebSocket
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReconnectingWebSocketTest {

  @Test
  fun testConnectionFailureBeforeOpenDoesNotNotifyDisconnected() {
    val connectionCallback = mock<ConnectionCallback>()
    val reconnectingWebSocket = createWebSocket(connectionCallback)

    reconnectingWebSocket.onFailure(mock<WebSocket>(), IOException("failed"), null)

    verify(connectionCallback, never()).onConnected()
    verify(connectionCallback, never()).onDisconnected()
  }

  @Test
  fun testConnectionFailureAfterOpenNotifiesDisconnectedOnceUntilReconnect() {
    val connectionCallback = mock<ConnectionCallback>()
    val reconnectingWebSocket = createWebSocket(connectionCallback)
    val webSocket = mock<WebSocket>()

    reconnectingWebSocket.onOpen(webSocket, mock<Response>())
    reconnectingWebSocket.onFailure(webSocket, IOException("failed"), null)
    reconnectingWebSocket.onFailure(mock<WebSocket>(), IOException("retry failed"), null)
    reconnectingWebSocket.onOpen(mock<WebSocket>(), mock<Response>())

    verify(connectionCallback, times(2)).onConnected()
    verify(connectionCallback, times(1)).onDisconnected()
  }

  private fun createWebSocket(connectionCallback: ConnectionCallback): ReconnectingWebSocket =
      ReconnectingWebSocket(
          "ws://localhost:8081/message?role=android",
          messageCallback = null,
          connectionCallback = connectionCallback,
      )
}
