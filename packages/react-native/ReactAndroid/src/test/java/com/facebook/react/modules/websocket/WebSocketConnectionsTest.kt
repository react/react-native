/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.websocket

import java.util.concurrent.CountDownLatch
import java.util.concurrent.atomic.AtomicInteger
import okhttp3.Request
import okhttp3.WebSocket
import okio.ByteString
import org.junit.Assert.*
import org.junit.Test

class WebSocketConnectionsTest {
  private class Socket(private val rejectClose: Boolean = false) : WebSocket {
    var cancellations = 0
    var closes = 0
    var closeFrame: Pair<Int, String?>? = null

    override fun request() = Request.Builder().url("https://localhost/").build()

    override fun queueSize() = 0L

    override fun send(text: String) = true

    override fun send(bytes: ByteString) = true

    override fun close(code: Int, reason: String?): Boolean {
      if (rejectClose) throw IllegalArgumentException("Invalid close frame")
      closes++
      closeFrame = Pair(code, reason)
      return true
    }

    override fun cancel() {
      cancellations++
    }
  }

  @Test
  fun closeBeforeAttachCancelsReturnedHandle() {
    val registry = WebSocketConnections()
    val connection = registry.create(1)
    val socket = Socket()
    registry.close(1, 1000, "")
    registry.attach(connection, socket)
    assertEquals(1, socket.cancellations)
    assertEquals(0, socket.closes)
    assertFalse(registry.opened(connection, socket))
    assertNull(registry.socketForSend(1) { fail("Unexpected missing socket") })
    assertTrue(registry.finish(connection, socket))
    assertFalse(registry.finish(connection, socket))
  }

  @Test
  fun attachedConnectingHandleIsCancelledWithoutWaitingForUpgrade() {
    val registry = WebSocketConnections()
    val connection = registry.create(1)
    val socket = Socket()
    registry.attach(connection, socket)
    registry.close(1, 1000, "")
    registry.close(1, 1000, "")
    assertEquals(1, socket.cancellations)
    assertEquals(0, socket.closes)
  }

  @Test
  fun openBeforeAttachUsesNormalCloseAndCannotBeReattached() {
    val registry = WebSocketConnections()
    val connection = registry.create(1)
    val socket = Socket()
    assertTrue(registry.opened(connection, socket))
    registry.attach(connection, socket)
    assertSame(socket, registry.socketForSend(1) { fail("Unexpected missing socket") })
    registry.close(1, 1000, "done")
    assertEquals(1, socket.closes)
    assertNull(registry.socketForSend(1) { fail("Unexpected missing socket") })
    assertFalse(registry.readable(connection, socket))
  }

  @Test
  fun closeAfterOpenBeforeAttachKeepsTheGracefulClose() {
    val registry = WebSocketConnections()
    val connection = registry.create(1)
    val socket = Socket()
    assertTrue(registry.opened(connection, socket))
    registry.close(1, 1000, "done")
    assertEquals(1, socket.closes)
    registry.attach(connection, socket)
    assertEquals(0, socket.cancellations)
    assertEquals(1, socket.closes)
    assertNull(registry.socketForSend(1) { fail("Unexpected missing socket") })
    assertTrue(registry.finish(connection, socket))
    assertFalse(registry.finish(connection, socket))
  }

  @Test
  fun failureBeforeHandleReturnCannotReinsertOldConnection() {
    val registry = WebSocketConnections()
    val old = registry.create(1)
    assertTrue(registry.finish(old, null))
    val current = registry.create(1)
    val oldSocket = Socket()
    registry.attach(old, oldSocket)
    assertEquals(1, oldSocket.cancellations)
    assertFalse(registry.opened(old, oldSocket))
    assertFalse(registry.finish(old, oldSocket))
    val socket = Socket()
    registry.attach(current, socket)
    assertTrue(registry.opened(current, socket))
    assertSame(socket, registry.socketForSend(1) { fail("Unexpected missing socket") })
  }

  @Test
  fun invalidationCancelsPendingAndClosesOpenHandles() {
    val registry = WebSocketConnections()
    val pending = registry.create(3)
    val open = registry.create(4)
    val late = registry.create(5)
    val pendingSocket = Socket()
    val openSocket = Socket()
    registry.attach(pending, pendingSocket)
    registry.opened(open, openSocket)
    registry.invalidate()
    assertEquals(1, pendingSocket.cancellations)
    assertEquals(0, openSocket.cancellations)
    assertEquals(1, openSocket.closes)
    val lateSocket = Socket()
    registry.attach(late, lateSocket)
    assertEquals(1, lateSocket.cancellations)
    assertFalse(registry.opened(late, lateSocket))
    assertFalse(registry.opened(pending, pendingSocket))
    assertFalse(registry.finish(open, openSocket))
    try {
      registry.create(6)
      fail("Retired registry reopened")
    } catch (_: IllegalStateException) {}
  }

  @Test
  fun competingTerminalCallbacksPublishOnce() {
    val registry = WebSocketConnections()
    val connection = registry.create(1)
    val socket = Socket()
    registry.attach(connection, socket)
    val start = CountDownLatch(1)
    val published = AtomicInteger()
    val callbacks =
        List(2) {
          Thread {
            start.await()
            if (registry.finish(connection, socket)) published.incrementAndGet()
          }
        }
    callbacks.forEach { it.start() }
    start.countDown()
    callbacks.forEach { it.join() }
    assertEquals(1, published.get())
  }

  @Test
  fun callerReportedFailureRetiresPendingConnectionBeforeCancellation() {
    val registry = WebSocketConnections()
    val pending = registry.create(1)
    val socket = Socket()
    registry.attach(pending, socket)
    val missing = mutableListOf<Int>()
    assertNull(registry.socketForSend(1) { missing.add(it) })
    assertEquals(listOf(1), missing)
    assertEquals(1, socket.cancellations)
    assertFalse(registry.finish(pending, socket))
    assertFalse(registry.opened(pending, socket))
    val current = registry.create(1)
    assertFalse(registry.finish(pending, socket))
    assertTrue(registry.finish(current, null))
  }

  @Test
  fun callerReportedFailureBeforeAttachCancelsLateHandleWithoutAnotherTerminal() {
    val registry = WebSocketConnections()
    val pending = registry.create(1)
    val missing = mutableListOf<Int>()
    assertNull(registry.socketForSend(1) { missing.add(it) })
    assertEquals(listOf(1), missing)
    val socket = Socket()
    registry.attach(pending, socket)
    assertEquals(1, socket.cancellations)
    assertFalse(registry.finish(pending, socket))
    assertFalse(registry.opened(pending, socket))
  }

  @Test
  fun sendDuringGracefulClosePreservesTransportAndTerminalCallback() {
    val registry = WebSocketConnections()
    val connection = registry.create(1)
    val socket = Socket()
    assertTrue(registry.opened(connection, socket))
    registry.close(1, 1000, "done")
    assertNull(registry.socketForSend(1) { fail("Unexpected missing socket") })
    assertEquals(0, socket.cancellations)
    assertEquals(1, socket.closes)
    assertTrue(registry.finish(connection, socket))
    assertFalse(registry.finish(connection, socket))
  }

  @Test
  fun rejectedCloseCancelsTransportAndPreservesTerminalCallback() {
    val registry = WebSocketConnections()
    val connection = registry.create(1)
    val socket = Socket(rejectClose = true)
    assertTrue(registry.opened(connection, socket))
    assertThrows(IllegalArgumentException::class.java) { registry.close(1, 1005, "") }
    assertEquals(1, socket.cancellations)
    assertNull(registry.socketForSend(1) { fail("Unexpected missing socket") })
    assertTrue(registry.finish(connection, socket))
    assertFalse(registry.finish(connection, socket))
  }

  @Test
  fun sendToUnknownSocketReportsMissingId() {
    val registry = WebSocketConnections()
    val missing = mutableListOf<Int>()
    assertNull(registry.socketForSend(42) { missing.add(it) })
    assertEquals(listOf(42), missing)
  }

  @Test
  fun emptyPeerCloseReceivesNormalCloseReply() {
    val registry = WebSocketConnections()
    val connection = registry.create(1)
    val socket = Socket()
    assertTrue(registry.opened(connection, socket))
    registry.peerClosing(connection, socket, 1005, "")
    assertNull(registry.socketForSend(1) { fail("Unexpected missing socket") })
    registry.peerClosing(connection, socket, 1005, "")
    registry.close(1, 1000, "local close")
    assertEquals(1, socket.closes)
    assertEquals(Pair(1000, ""), socket.closeFrame)
    assertTrue(registry.finish(connection, socket))
  }

  @Test
  fun peerCloseWithStatusEchoesCodeAndReason() {
    val registry = WebSocketConnections()
    val connection = registry.create(1)
    val socket = Socket()
    assertTrue(registry.opened(connection, socket))
    registry.peerClosing(connection, socket, 1001, "going away")
    assertEquals(Pair(1001, "going away"), socket.closeFrame)
  }
}
