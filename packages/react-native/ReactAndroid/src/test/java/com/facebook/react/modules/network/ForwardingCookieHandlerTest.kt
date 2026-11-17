/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import android.content.Context
import android.webkit.CookieManager
import java.io.File
import java.net.URI
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ForwardingCookieHandlerTest {
  private val context: Context = RuntimeEnvironment.getApplication()
  private val url = "https://example.com/"
  private val uri = URI(url)

  private val webViewDir: File
    get() = File(context.applicationInfo.dataDir, "app_webview")

  @Before
  fun setUp() {
    ForwardingCookieHandler.resetWebViewStorageStateForTesting()
    File(context.applicationInfo.dataDir).mkdirs()
    webViewDir.deleteRecursively()
    CookieManager.getInstance().removeAllCookies(null)
  }

  @Test
  fun `does not consult the WebView while it has never stored anything`() {
    // A cookie the (shadow) CookieManager would return if asked.
    CookieManager.getInstance().setCookie(url, "a=b")

    val handler = ForwardingCookieHandler(context)

    assertThat(handler.get(uri, emptyMap())).isEmpty()
  }

  @Test
  fun `reads cookies from the WebView once its data directory exists`() {
    webViewDir.mkdirs()
    CookieManager.getInstance().setCookie(url, "a=b")

    val handler = ForwardingCookieHandler(context)

    assertThat(handler.get(uri, emptyMap())["Cookie"]).containsExactly("a=b")
  }

  @Test
  fun `a stored cookie is returned by later requests`() {
    val handler = ForwardingCookieHandler(context)
    assertThat(handler.get(uri, emptyMap())).isEmpty()

    handler.put(uri, mapOf("Set-Cookie" to listOf("a=b")))

    assertThat(handler.get(uri, emptyMap())["Cookie"]).containsExactly("a=b")
  }

  @Test
  fun `a cookie stored through one handler is visible to another`() {
    ForwardingCookieHandler(context).put(uri, mapOf("Set-Cookie" to listOf("a=b")))

    assertThat(ForwardingCookieHandler(context).get(uri, emptyMap())["Cookie"])
        .containsExactly("a=b")
  }

  @Test
  fun `without a context the WebView is always consulted`() {
    CookieManager.getInstance().setCookie(url, "a=b")

    assertThat(ForwardingCookieHandler().get(uri, emptyMap())["Cookie"]).containsExactly("a=b")
  }
}
