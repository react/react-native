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
  private class Socket : WebSocket {
    var cancellations = 0
    var closes = 0

    override fun request() = Request.Builder().url("https://localhost/").build()

    override fun queueSize() = 0L

    override fun send(text: String) = true

    override fun send(bytes: ByteString) = true

    override fun close(code: Int, reason: String?): Boolean {
      closes++
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
    assertNull(registry.openSocket(1))
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
    assertSame(socket, registry.openSocket(1))
    registry.close(1, 1000, "done")
    assertEquals(1, socket.closes)
    assertNull(registry.openSocket(1))
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
    assertNull(registry.openSocket(1))
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
    assertSame(socket, registry.openSocket(1))
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
    assertNull(registry.openSocket(1))
    registry.retire(1)
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
    registry.retire(1)
    val socket = Socket()
    registry.attach(pending, socket)
    assertEquals(1, socket.cancellations)
    assertFalse(registry.finish(pending, socket))
    assertFalse(registry.opened(pending, socket))
  }
}
