/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection

import com.facebook.react.packagerconnection.ReconnectingWebSocket.ConnectionCallback
import com.facebook.react.packagerconnection.ReconnectingWebSocket.MessageCallback
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.doAnswer
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReconnectingWebSocketTest {
  private val messageCallback: MessageCallback = mock()
  private val connectionCallback: ConnectionCallback = mock()
  private val socket = ReconnectingWebSocket(URL, messageCallback, connectionCallback)

  @Test
  fun closeClosesAnOpenSocket() {
    val webSocket: WebSocket = mock()
    socket.onOpen(webSocket, response())

    socket.closeQuietly()

    verify(webSocket).close(eq(1_000), any())
  }

  @Test
  fun socketThatOpensAfterCloseIsClosedAndNotReported() {
    val webSocket: WebSocket = mock()
    socket.closeQuietly()

    socket.onOpen(webSocket, response())

    verify(webSocket).close(eq(1_000), any())
    verify(connectionCallback, never()).onConnected()
  }

  @Test
  fun messagesAfterCloseAreDropped() {
    val webSocket: WebSocket = mock()
    socket.onOpen(webSocket, response())
    socket.closeQuietly()

    socket.onMessage(webSocket, """{"version":2,"method":"reload"}""")

    verify(messageCallback, never()).onMessage(any<String>())
  }

  @Test
  fun closeWaitsForARunningMessageHandler() {
    val events = CopyOnWriteArrayList<String>()
    val handlerStarted = CountDownLatch(1)
    val releaseHandler = CountDownLatch(1)
    doAnswer {
          handlerStarted.countDown()
          check(releaseHandler.await(10, TimeUnit.SECONDS)) { "Handler was not released" }
          events.add("handler returned")
        }
        .whenever(messageCallback)
        .onMessage(any<String>())

    val receive = Thread { socket.onMessage(mock(), """{"version":2,"method":"reload"}""") }
    val close = Thread {
      socket.closeQuietly()
      events.add("close returned")
    }
    receive.start()
    try {
      assertThat(handlerStarted.await(10, TimeUnit.SECONDS)).isTrue()
      close.start()
      val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10)
      while (close.state != Thread.State.BLOCKED) {
        check(close.isAlive) { "Close returned while a handler was running" }
        check(System.nanoTime() < deadline) { "Close never waited for the handler" }
        Thread.yield()
      }
    } finally {
      releaseHandler.countDown()
      receive.join(10_000)
      close.join(10_000)
    }

    assertThat(events).containsExactly("handler returned", "close returned")
  }

  private fun response(): Response =
      Response.Builder()
          .request(Request.Builder().url(URL).build())
          .protocol(Protocol.HTTP_1_1)
          .code(101)
          .message("Switching Protocols")
          .build()

  private companion object {
    private const val URL = "ws://127.0.0.1:8081/message"
  }
}
