/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.websocket

import java.net.URI
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class WebSocketModuleTest {

  private fun getCookieLookupUri(uri: String): URI {
    val method =
        WebSocketModule.Companion::class.java.getDeclaredMethod(
            "getCookieLookupUri", String::class.java)
    method.isAccessible = true
    return method.invoke(WebSocketModule.Companion, uri) as URI
  }

  @Test
  fun getCookieLookupUri_keepsPathForCookieMatching() {
    val uri = getCookieLookupUri("wss://my.domain/signal-r/hubs/messages")

    assertThat(uri.toString()).isEqualTo("https://my.domain/signal-r/hubs/messages")
  }

  @Test
  fun getCookieLookupUri_keepsPortAndQuery() {
    val uri = getCookieLookupUri("ws://my.domain:8080/path?token=abc")

    assertThat(uri.toString()).isEqualTo("http://my.domain:8080/path?token=abc")
  }
}
