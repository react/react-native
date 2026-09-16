/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection

import com.facebook.react.packagerconnection.ReconnectingWebSocket.ConnectionCallback
import java.io.IOException
import okio.ByteString
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class JSPackagerClientTest {

  private lateinit var settings: PackagerConnectionSettings

  @Before
  fun setup() {
    settings = mock<PackagerConnectionSettings>()
    whenever(settings.debugServerHost).thenReturn("ws://not_needed")
    whenever(settings.packageName).thenReturn("my_test_package")
  }

  @Test
  @Throws(IOException::class)
  fun test_onMessage_ShouldTriggerNotification() {
    val handler = mock<RequestHandler>()
    val client = getClient(createRequestHandler("methodValue", handler))

    client.onMessage("""{"version": 2, "method": "methodValue", "params": "paramsValue"}""")
    verify(handler).onNotification(eq("paramsValue"))
    verify(handler, never()).onRequest(any(), any())
  }

  @Test
  @Throws(IOException::class)
  fun test_onMessage_ShouldTriggerRequest() {
    val handler = mock<RequestHandler>()
    val client = getClient(createRequestHandler("methodValue", handler))

    client.onMessage(
        """{"version": 2, "id": "idValue", "method": "methodValue", "params": "paramsValue"}""",
    )
    verify(handler, never()).onNotification(any())
    verify(handler).onRequest(eq("paramsValue"), any())
  }

  @Test
  @Throws(IOException::class)
  fun test_onMessage_WithoutParams_ShouldTriggerNotification() {
    val handler = mock<RequestHandler>()
    val client = getClient(createRequestHandler("methodValue", handler))

    client.onMessage("""{"version": 2, "method": "methodValue"}""")
    verify(handler).onNotification(eq(null))
    verify(handler, never()).onRequest(any(), any())
  }

  @Test
  @Throws(IOException::class)
  fun test_onMessage_WithInvalidContentType_ShouldNotTriggerCallback() {
    val handler = mock<RequestHandler>()
    val client = getClient(createRequestHandler("methodValue", handler))

    client.onMessage(encodeUtf8("""{"version": 2, "method": "methodValue"}"""))
    verify(handler, never()).onNotification(any())
    verify(handler, never()).onRequest(any(), any())
  }

  @Test
  @Throws(IOException::class)
  fun test_onMessage_WithoutMethod_ShouldNotTriggerCallback() {
    val handler = mock<RequestHandler>()
    val client = getClient(createRequestHandler("methodValue", handler))

    client.onMessage("""{"version": 2}""")
    verify(handler, never()).onNotification(any())
    verify(handler, never()).onRequest(any(), any())
  }

  @Test
  @Throws(IOException::class)
  fun test_onMessage_With_Null_Action_ShouldNotTriggerCallback() {
    val handler = mock<RequestHandler>()
    val client = getClient(createRequestHandler("methodValue", handler))

    client.onMessage("""{"version": 2, "method": null}""")
    verify(handler, never()).onNotification(any())
    verify(handler, never()).onRequest(any(), any())
  }

  @Test
  @Throws(IOException::class)
  fun test_onMessage_WithInvalidMethod_ShouldNotTriggerCallback() {
    val handler = mock<RequestHandler>()
    val client = getClient(createRequestHandler("methodValue", handler))

    client.onMessage(ByteString.EMPTY)
    verify(handler, never()).onNotification(any())
    verify(handler, never()).onRequest(any(), any())
  }

  @Test
  @Throws(IOException::class)
  fun test_onMessage_WrongVersion_ShouldNotTriggerCallback() {
    val handler = mock<RequestHandler>()
    val client = getClient(createRequestHandler("methodValue", handler))

    client.onMessage("""{"version": 1, "method": "methodValue"}""")
    verify(handler, never()).onNotification(any())
    verify(handler, never()).onRequest(any(), any())
  }

  @Test
  @Throws(IOException::class)
  fun test_onDisconnection_ShouldTriggerDisconnectionCallback() {
    val connectionHandler = mock<ConnectionCallback>()
    val handler = mock<RequestHandler>()
    val client = getClient(requestHandlers = emptyMap(), connectionCallback = connectionHandler)

    client.close()

    verify(connectionHandler, never()).onConnected()
    verify(connectionHandler, times(1)).onDisconnected()

    verify(handler, never()).onNotification(any())
    verify(handler, never()).onRequest(any(), any())
  }

  private fun getClient(
      requestHandlers: Map<String, RequestHandler>,
      clientId: String = "test_client",
      settings: PackagerConnectionSettings = this.settings,
      connectionCallback: ConnectionCallback? = null,
  ): JSPackagerClient = JSPackagerClient(clientId, settings, requestHandlers, connectionCallback)

  private fun createRequestHandler(
      action: String,
      handler: RequestHandler,
  ): Map<String, RequestHandler> = mapOf(action to handler)

  private fun encodeUtf8(input: String): ByteString =
      ByteString.of(*input.toByteArray(Charsets.UTF_8))
}
