/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.devsupport.inspector

import com.facebook.react.modules.network.OkHttpClientProvider
import java.util.concurrent.TimeUnit
import okhttp3.OkHttpClient

/**
 * Shared [OkHttpClient] instances for devsupport networking. Uses a single connection pool and
 * dispatcher across all dev support HTTP and WebSocket usage.
 */
internal object DevSupportHttpClient {
  /** Client for HTTP requests: connect=5s, write=disabled, read=disabled. */
  internal val httpClient: OkHttpClient =
      OkHttpClientProvider.getOkHttpClient()
          .newBuilder()
          .connectTimeout(5, TimeUnit.SECONDS)
          .writeTimeout(0, TimeUnit.MILLISECONDS)
          .readTimeout(0, TimeUnit.MINUTES)
          .build()

  /** Client for WebSocket connections: connect=10s, write=10s, read=disabled. */
  internal val websocketClient: OkHttpClient =
      httpClient
          .newBuilder()
          .connectTimeout(10, TimeUnit.SECONDS)
          .writeTimeout(10, TimeUnit.SECONDS)
          .build()

  /**
   * Returns the appropriate HTTP scheme ("http" or "https") for the given host. Uses "https" when
   * the host specifies port 443 explicitly (e.g. "example.com:443").
   */
  internal fun httpScheme(host: String): String = if (host.endsWith(":443")) "https" else "http"

  /**
   * Returns the appropriate WebSocket scheme ("ws" or "wss") for the given host. Uses "wss" when
   * the host specifies port 443 explicitly (e.g. "example.com:443").
   */
  internal fun wsScheme(host: String): String = if (host.endsWith(":443")) "wss" else "ws"
}
