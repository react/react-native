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
import okhttp3.ConnectionPool
import okhttp3.Dispatcher
import okhttp3.OkHttpClient

/**
 * Shared [OkHttpClient] instances for devsupport networking. Configured from the app's client, so a
 * [com.facebook.react.modules.network.OkHttpClientFactory] override still applies, but with a
 * connection pool and dispatcher of their own, shared across all dev support HTTP and WebSocket
 * usage and nothing else.
 *
 * The dispatcher must not be the app's. A WebSocket occupies a running-call slot on it for its
 * whole lifetime — `RealWebSocket.loopReader` runs inside `RealCall.AsyncCall.execute` — and dev
 * support keeps several open to one host: the packager connection, the inspector, and whatever else
 * the app connects. OkHttp's default [Dispatcher.maxRequestsPerHost] is 5, so on the app's
 * dispatcher those sockets throttle, and eventually stall, every other request to the dev server —
 * including [com.facebook.react.devsupport.BundleDownloader] fetching the bundle itself.
 */
internal object DevSupportHttpClient {
  // Enough that the long-lived WebSockets cannot crowd out bundle and asset traffic: the dev
  // server is the only host this client talks to, so the per-host limit is the effective one.
  private const val MAX_CONCURRENT_REQUESTS = 32

  /** Client for HTTP requests: connect=5s, write=disabled, read=disabled. */
  internal val httpClient: OkHttpClient =
      OkHttpClientProvider.getOkHttpClient()
          .newBuilder()
          .dispatcher(
              Dispatcher().apply {
                maxRequests = MAX_CONCURRENT_REQUESTS
                maxRequestsPerHost = MAX_CONCURRENT_REQUESTS
              },
          )
          .connectionPool(ConnectionPool())
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
