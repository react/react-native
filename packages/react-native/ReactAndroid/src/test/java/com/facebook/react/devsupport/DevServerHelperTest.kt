/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.net.Uri
import com.facebook.react.devsupport.DevServerHelper.PackagerCommandListener
import com.facebook.react.packagerconnection.PackagerConnectionSettings
import com.facebook.react.packagerconnection.ReconnectingWebSocket
import java.util.ArrayDeque
import java.util.concurrent.Executor
import java.util.concurrent.FutureTask
import java.util.concurrent.ThreadPoolExecutor
import java.util.concurrent.TimeUnit
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedConstruction
import org.mockito.Mockito.mockConstruction
import org.mockito.kotlin.doAnswer
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class DevServerHelperTest {
  private lateinit var helper: DevServerHelper
  private lateinit var sockets: MockedConstruction<ReconnectingWebSocket>
  private val settings: PackagerConnectionSettings = mock()
  private val peers = mutableListOf<Peer>()
  private val listener: PackagerCommandListener = mock()
  private val pending = ArrayDeque<Runnable>()
  private var onConnect: () -> Unit = {}

  @Before
  fun setUp() {
    whenever(settings.debugServerHost).thenReturn("127.0.0.1:8083")
    whenever(settings.packageName).thenReturn("com.example.test")
    sockets = mockSockets()
    helper = DevServerHelper(mock(), RuntimeEnvironment.getApplication(), settings)
    helper.packagerConnectionExecutor = Executor { pending.add(it) }
  }

  @After
  fun tearDown() {
    helper.closePackagerConnection()
    runPending()
    sockets.close()
  }

  @Test
  fun openAndCloseAreQueued() {
    helper.openPackagerConnection("test", listener)
    helper.closePackagerConnection()

    assertThat(peers).isEmpty()
    assertThat(pending).hasSize(2)
  }

  @Test
  fun defaultExecutorRunsTasksOnOneNamedThread() {
    val executor =
        DevServerHelper(mock(), RuntimeEnvironment.getApplication(), settings)
            .packagerConnectionExecutor as ThreadPoolExecutor
    assertThat(executor.maximumPoolSize).isEqualTo(1)

    val threadName = FutureTask { Thread.currentThread().name }
    executor.execute(threadName)
    assertThat(threadName.get(10, TimeUnit.SECONDS)).isEqualTo("ReactPackagerConnection")
  }

  @Test
  fun repeatedOpenCreatesOnlyOneConnection() {
    helper.openPackagerConnection("test", listener)
    helper.openPackagerConnection("test", listener)
    runPending()

    assertThat(peers).hasSize(1)
    assertThat(connectedPeers()).hasSize(1)
  }

  @Test
  fun closeQueuedAfterOpenRetiresTheClient() {
    helper.openPackagerConnection("test", listener)
    helper.closePackagerConnection()
    runPending()

    assertThat(peers).hasSize(1)
    assertThat(connectedPeers()).isEmpty()
  }

  @Test
  fun failedStartupThrowsAndAllowsRetry() {
    val failure = IllegalStateException("WebSocket startup failed")
    onConnect = { throw failure }
    helper.openPackagerConnection("test", listener)
    assertThatThrownBy { runPending() }.isSameAs(failure)
    assertThat(peers).hasSize(1)
    assertThat(connectedPeers()).isEmpty()

    onConnect = {}
    helper.openPackagerConnection("test", listener)
    runPending()
    assertThat(peers).hasSize(2)
    assertThat(connectedPeers()).containsExactly(peers.last())
  }

  @Test
  fun openAfterHostChangeWithoutCloseUsesOnlyTheNewServer() {
    helper.openPackagerConnection("test", listener)
    runPending()
    whenever(settings.debugServerHost).thenReturn("127.0.0.1:8082")
    helper.openPackagerConnection("test", listener)
    runPending()

    assertThat(peers).hasSize(2)
    assertThat(connectedPeers().map { it.port }).containsExactly(8082)
    connectedPeers().single().receiveReload()
    verify(listener).onPackagerReloadCommand()
  }

  private fun runPending() {
    while (true) {
      val task = pending.poll() ?: return
      task.run()
    }
  }

  private fun mockSockets(): MockedConstruction<ReconnectingWebSocket> =
      mockConstruction(ReconnectingWebSocket::class.java) { socket, construction ->
        val peer =
            Peer(
                construction.arguments()[0] as String,
                construction.arguments()[1] as ReconnectingWebSocket.MessageCallback,
            )
        val connectionCallback =
            construction.arguments()[2] as ReconnectingWebSocket.ConnectionCallback
        peers.add(peer)
        doAnswer {
              onConnect()
              peer.connected = true
            }
            .whenever(socket)
            .connect()
        doAnswer {
              peer.connected = false
              connectionCallback.onDisconnected()
            }
            .whenever(socket)
            .closeQuietly()
      }

  private fun connectedPeers(): List<Peer> = peers.filter { it.connected }

  private class Peer(val url: String, val callback: ReconnectingWebSocket.MessageCallback) {
    @Volatile var connected = false
    val port: Int
      get() = Uri.parse(url).port

    fun receiveReload() {
      callback.onMessage("""{"version":2,"method":"reload"}""")
    }

    override fun toString(): String = url
  }
}
