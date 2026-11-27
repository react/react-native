/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.modules.websocket

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.modules.network.ForwardingCookieHandler
import com.facebook.react.modules.network.OkHttpClientProvider
import com.facebook.testutils.shadows.ShadowArguments
import com.facebook.testutils.shadows.ShadowSoLoader
import java.io.IOException
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Answers
import org.mockito.MockedConstruction
import org.mockito.Mockito.clearInvocations
import org.mockito.Mockito.mockConstruction
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.doAnswer
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowArguments::class, ShadowSoLoader::class])
class WebSocketModuleLifecycleTest {
  private lateinit var context: ReactApplicationContext
  private lateinit var client: OkHttpClient
  private lateinit var socket: WebSocket
  private lateinit var module: WebSocketModule
  private lateinit var listener: WebSocketListener
  private lateinit var cookieHandlers: MockedConstruction<ForwardingCookieHandler>
  private var previousClient: OkHttpClient? = null
  private var createSocket: (WebSocketListener) -> WebSocket = { socket }

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = mock()
    // A reloaded host can already have a new active instance when old callbacks arrive.
    whenever(context.hasActiveReactInstance()).thenReturn(true)
    client = mock()
    socket = mock()
    val builder = mock<OkHttpClient.Builder>(defaultAnswer = Answers.RETURNS_SELF)
    whenever(client.newBuilder()).thenReturn(builder)
    whenever(builder.build()).thenReturn(client)
    whenever(client.newWebSocket(any(), any())).thenAnswer {
      listener = it.getArgument(1)
      createSocket(listener)
    }
    previousClient = OkHttpClientProvider.client
    OkHttpClientProvider.client = client
    cookieHandlers = mockConstruction(ForwardingCookieHandler::class.java)
    module = WebSocketModule(context)
  }

  @After
  fun tearDown() {
    module.invalidate()
    cookieHandlers.close()
    OkHttpClientProvider.client = previousClient
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  private fun connect(target: WebSocketModule = module) {
    target.connect("ws://localhost/socket", null, null, 0.0)
  }

  private fun response(): Response =
      Response.Builder()
          .request(Request.Builder().url("http://localhost/socket").build())
          .protocol(Protocol.HTTP_1_1)
          .code(101)
          .message("Switching Protocols")
          .build()

  @Test
  fun invalidateCancelsConnectingSocket() {
    connect()

    module.invalidate()

    verify(socket).cancel()
    verify(socket, never()).close(any(), any())
  }

  @Test
  fun cancellationFailureDoesNotEmitIntoAnActiveHost() {
    connect()
    doAnswer {
          listener.onFailure(socket, IOException("Canceled"), null)
          null
        }
        .whenever(socket)
        .cancel()

    module.invalidate()

    verify(socket).cancel()
    verifyNoInteractions(context)
  }

  @Test
  fun invalidateClosesOpenSocketAndIsIdempotent() {
    connect()
    listener.onOpen(socket, response())
    clearInvocations(context)

    module.invalidate()
    module.invalidate()

    verify(socket, times(1)).close(1001, null)
    verify(socket, never()).cancel()
    verifyNoInteractions(context)
  }

  @Test
  fun invalidateBeforeSocketFactoryReturnsCancelsReturnedSocket() {
    createSocket = {
      module.invalidate()
      socket
    }

    connect()

    verify(socket).cancel()
    listener.onOpen(socket, response())
    verifyNoInteractions(context)
  }

  @Test
  fun concurrentInvalidateBeforeRegistrationDoesNotLeakSocket() {
    val factoryEntered = CountDownLatch(1)
    val releaseFactory = CountDownLatch(1)
    val executor = Executors.newSingleThreadExecutor()
    createSocket = {
      factoryEntered.countDown()
      check(releaseFactory.await(5, TimeUnit.SECONDS))
      socket
    }
    try {
      val connecting = executor.submit { connect() }
      assertThat(factoryEntered.await(5, TimeUnit.SECONDS)).isTrue()

      module.invalidate()
      releaseFactory.countDown()
      connecting.get(5, TimeUnit.SECONDS)

      verify(socket).cancel()
    } finally {
      releaseFactory.countDown()
      executor.shutdownNow()
    }
  }

  @Test
  fun callbacksAfterInvalidationDoNotEmitOrInvokeContentHandler() {
    connect()
    val contentHandler = mock<WebSocketModule.ContentHandler>()
    module.setContentHandler(0, contentHandler)
    module.invalidate()

    listener.onOpen(socket, response())
    listener.onMessage(socket, "old message")
    listener.onMessage(socket, ByteString.encodeUtf8("old binary message"))
    listener.onClosing(socket, 1000, "old closing")
    listener.onClosed(socket, 1000, "old close")
    listener.onFailure(socket, IOException("old failure"), null)

    verifyNoInteractions(context, contentHandler)
    verify(socket, never()).close(any(), any())
  }

  @Test
  fun callbacksFromOldModuleCannotReachNewSocketWithSameId() {
    connect()
    val oldListener = listener
    val oldSocket = socket
    module.invalidate()
    val newModule = WebSocketModule(context)
    val newSocket = mock<WebSocket>()
    createSocket = { newSocket }
    try {
      connect(newModule)
      listener.onOpen(newSocket, response())
      clearInvocations(context)

      oldListener.onOpen(oldSocket, response())
      oldListener.onMessage(oldSocket, "old message")
      oldListener.onClosed(oldSocket, 1000, "old close")
      oldListener.onFailure(oldSocket, IOException("old failure"), null)

      verifyNoInteractions(context)
      listener.onMessage(newSocket, "new message")
      val params = argumentCaptor<ReadableMap>()
      verify(context).emitDeviceEvent(eq("websocketMessage"), params.capture())
      assertThat(params.firstValue.getString("data")).isEqualTo("new message")
    } finally {
      newModule.invalidate()
    }
  }

  @Test
  fun invalidationWaitsForAnInFlightCallback() {
    connect()
    listener.onOpen(socket, response())
    val handlerEntered = CountDownLatch(1)
    val releaseHandler = CountDownLatch(1)
    val invalidationStarted = CountDownLatch(1)
    val contentHandler = mock<WebSocketModule.ContentHandler>()
    doAnswer {
          handlerEntered.countDown()
          check(releaseHandler.await(5, TimeUnit.SECONDS))
          null
        }
        .whenever(contentHandler)
        .onMessage(any<String>(), any())
    module.setContentHandler(0, contentHandler)
    clearInvocations(context)
    val executor = Executors.newFixedThreadPool(2)
    try {
      val callback = executor.submit { listener.onMessage(socket, "in flight") }
      assertThat(handlerEntered.await(5, TimeUnit.SECONDS)).isTrue()
      val invalidation =
          executor.submit {
            invalidationStarted.countDown()
            module.invalidate()
          }
      assertThat(invalidationStarted.await(5, TimeUnit.SECONDS)).isTrue()
      assertThat(invalidation.isDone).isFalse()

      releaseHandler.countDown()
      callback.get(5, TimeUnit.SECONDS)
      invalidation.get(5, TimeUnit.SECONDS)
      clearInvocations(context, contentHandler)
      listener.onMessage(socket, "after invalidation")

      verifyNoInteractions(context, contentHandler)
    } finally {
      releaseHandler.countDown()
      executor.shutdownNow()
    }
  }

  @Test
  fun synchronousOpenIsNotRegisteredAsPending() {
    createSocket = {
      it.onOpen(socket, response())
      socket
    }
    connect()

    module.invalidate()

    verify(socket).close(1001, null)
    verify(socket, never()).cancel()
  }

  @Test
  fun synchronousFailureIsNotRegisteredAsPending() {
    createSocket = {
      it.onFailure(socket, IOException("handshake failed"), null)
      socket
    }
    connect()

    module.invalidate()

    verify(socket, never()).cancel()
    verify(socket, never()).close(any(), any())
    verify(context).emitDeviceEvent(eq("websocketFailed"), any())
  }

  @Test
  fun failedHandshakeDoesNotLeavePendingSocket() {
    connect()
    listener.onFailure(socket, IOException("handshake failed"), null)

    module.invalidate()

    verify(socket, never()).cancel()
    verify(context).emitDeviceEvent(eq("websocketFailed"), any())
  }

  @Test
  fun openSocketStillSendsTextBinaryAndCloseEvents() {
    connect()
    listener.onOpen(socket, response())
    listener.onMessage(socket, "message")
    listener.onMessage(socket, ByteString.encodeUtf8("binary"))
    module.send("outgoing", 0.0)
    listener.onClosing(socket, 1000, "done")
    listener.onClosed(socket, 1000, "done")

    verify(context).emitDeviceEvent(eq("websocketOpen"), any())
    verify(context, times(2)).emitDeviceEvent(eq("websocketMessage"), any())
    verify(context).emitDeviceEvent(eq("websocketClosed"), any())
    verify(socket).send("outgoing")
    verify(socket).close(1000, "done")
  }

  @Test
  fun invalidatedModuleDoesNotCreateAnotherConnection() {
    module.invalidate()

    connect()

    verify(client, never()).newWebSocket(any(), any())
  }
}
