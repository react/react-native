/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions
@file:OptIn(UnstableReactNativeAPI::class)

package com.facebook.react.modules.websocket

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.modules.network.ForwardingCookieHandler
import com.facebook.react.modules.network.InspectorNetworkReporter
import com.facebook.react.modules.network.OkHttpClientProvider
import com.facebook.testutils.shadows.ShadowArguments
import com.facebook.testutils.shadows.ShadowSoLoader
import java.net.URI
import okhttp3.OkHttpClient
import okhttp3.Request
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Answers
import org.mockito.MockedConstruction
import org.mockito.Mockito.mockConstruction
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

@RunWith(RobolectricTestRunner::class)
@Config(
    shadows =
        [ShadowArguments::class, ShadowSoLoader::class, WebSocketConnectionInspectorShadow::class]
)
class WebSocketModuleConnectionTest {
  private lateinit var context: ReactApplicationContext
  private lateinit var client: OkHttpClient
  private lateinit var builder: OkHttpClient.Builder
  private lateinit var module: WebSocketModule
  private lateinit var cookieHandlers: MockedConstruction<ForwardingCookieHandler>
  private var previousClient: OkHttpClient? = null

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun fuseboxWebSocketEventsEnabled(): Boolean = true
        }
    )
    context = mock()
    whenever(context.hasActiveReactInstance()).thenReturn(true)
    client = mock()
    builder = mock(defaultAnswer = Answers.RETURNS_SELF)
    whenever(client.newBuilder()).thenReturn(builder)
    whenever(builder.build()).thenReturn(client)
    whenever(client.newWebSocket(any(), any())).thenReturn(mock())
    previousClient = OkHttpClientProvider.client
    OkHttpClientProvider.client = client
    cookieHandlers = mockConstruction(ForwardingCookieHandler::class.java)
    WebSocketConnectionInspectorShadow.events.clear()
    module = WebSocketModule(context)
  }

  @After
  fun tearDown() {
    module.invalidate()
    WebSocketModule.setCustomClientBuilder(null)
    cookieHandlers.close()
    OkHttpClientProvider.client = previousClient
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun connectRejectsInvalidPort() {
    module.connect("ws://localhost:0/", null, null, 7.0)

    assertConnectionFailed()
  }

  @Test
  fun connectRejectsInvalidUriPath() {
    module.connect("ws://localhost:4000/a|b", null, null, 7.0)

    assertConnectionFailed()
  }

  @Test
  fun connectRejectsInvalidUriPathWithExplicitOrigin() {
    module.connect(
        "ws://localhost:4000/a|b",
        null,
        JavaOnlyMap.of("headers", JavaOnlyMap.of("origin", "https://example.com")),
        7.0,
    )

    assertConnectionFailed()
  }

  private fun assertConnectionFailed() {
    val params = argumentCaptor<ReadableMap>()
    verify(context).emitDeviceEvent(eq("websocketFailed"), params.capture())
    verify(context).emitDeviceEvent(any(), any())
    assertThat(params.firstValue.getInt("id")).isEqualTo(7)
    assertThat(params.firstValue.getString("message")).isNotBlank()
    verifyNoInteractions(client, builder)
    assertThat(WebSocketConnectionInspectorShadow.events).isEmpty()
  }

  @Test
  fun connectPreservesDefaultOriginAndPathScopedCookies() {
    val cookieHandler = cookieHandlers.constructed().single()
    whenever(cookieHandler.get(any(), any())).thenReturn(mapOf("Cookie" to listOf("session=abc")))

    module.connect("wss://example.com:8443/chat/room?token=abc", null, null, 7.0)

    val request = argumentCaptor<Request>()
    verify(client).newWebSocket(request.capture(), any())
    assertThat(request.firstValue.url().toString())
        .isEqualTo("https://example.com:8443/chat/room?token=abc")
    assertThat(request.firstValue.tag()).isEqualTo(7)
    assertThat(request.firstValue.header("origin")).isEqualTo("https://example.com:8443")
    assertThat(request.firstValue.header("Cookie")).isEqualTo("session=abc")
    verify(cookieHandler).get(eq(URI("https://example.com:8443/chat/room")), any())
    verifyNoInteractions(context)
  }

  @Test
  fun connectPreservesExplicitHeadersAndProtocols() {
    module.connect(
        "ws://example.com/chat",
        JavaOnlyArray.of(" chat ", "", "invalid,protocol", "superchat"),
        JavaOnlyMap.of(
            "headers",
            JavaOnlyMap.of("Origin", "https://caller.example", "Cookie", "caller=abc"),
        ),
        7.0,
    )

    val request = argumentCaptor<Request>()
    verify(client).newWebSocket(request.capture(), any())
    assertThat(request.firstValue.url().toString()).isEqualTo("http://example.com/chat")
    assertThat(request.firstValue.headers().values("origin"))
        .containsExactly("https://caller.example")
    assertThat(request.firstValue.header("Cookie")).isEqualTo("caller=abc")
    assertThat(request.firstValue.header("Sec-WebSocket-Protocol")).isEqualTo("chat,superchat")
    verify(builder).cookieJar(okhttp3.CookieJar.NO_COOKIES)
    verifyNoInteractions(context)
  }

  @Test
  fun connectAppliesCustomClientBuilder() {
    var customBuilder: OkHttpClient.Builder? = null
    WebSocketModule.setCustomClientBuilder { customBuilder = it }

    module.connect("ws://example.com/chat", null, null, 7.0)

    assertThat(customBuilder).isSameAs(builder)
    verify(client).newWebSocket(any(), any())
  }

  @Test
  fun connectDoesNotSwallowInvalidHeader() {
    assertThatThrownBy {
          module.connect(
              "ws://example.com/chat",
              null,
              JavaOnlyMap.of("headers", JavaOnlyMap.of("bad\nname", "value")),
              7.0,
          )
        }
        .isInstanceOf(IllegalArgumentException::class.java)

    verifyNoInteractions(context)
    assertThat(WebSocketConnectionInspectorShadow.events).isEmpty()
  }

  @Test
  fun connectDoesNotSwallowCustomBuilderFailure() {
    val failure = IllegalArgumentException("custom client configuration failed")
    WebSocketModule.setCustomClientBuilder { throw failure }

    assertThatThrownBy { module.connect("ws://example.com/chat", null, null, 7.0) }
        .isSameAs(failure)

    verifyNoInteractions(context)
    assertThat(WebSocketConnectionInspectorShadow.events).isEmpty()
  }
}

@Implements(InspectorNetworkReporter::class)
class WebSocketConnectionInspectorShadow {
  companion object {
    val events = mutableListOf<String>()

    @JvmStatic
    @Implementation
    fun reportWebSocketCreated(requestId: String, url: String) {
      events.add("created:$requestId:$url")
    }

    @JvmStatic
    @Implementation
    fun reportWebSocketWillSendHandshakeRequest(requestId: String, headers: Map<String, String>) {
      events.add("handshake:$requestId:$headers")
    }
  }
}
