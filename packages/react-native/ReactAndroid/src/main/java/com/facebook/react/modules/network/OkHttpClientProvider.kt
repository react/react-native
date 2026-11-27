/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import android.content.Context
import java.io.File
import java.util.concurrent.TimeUnit
import okhttp3.Cache
import okhttp3.ConnectionPool
import okhttp3.Dispatcher
import okhttp3.OkHttpClient

/**
 * Helper class that provides the same OkHttpClient instance that will be used for all networking
 * requests.
 */
public object OkHttpClientProvider {
  // Centralized OkHttpClient for all networking requests.
  internal var client: OkHttpClient? = null

  // User-provided OkHttpClient factory
  internal var factory: OkHttpClientFactory? = null

  // Building an OkHttpClient without an explicit SSL socket factory makes OkHttp resolve the
  // platform trust manager (loading the system trust store) and create an SSLContext, which costs
  // 10-20 ms of CPU on a mid-range phone. React Native builds at least two clients per process
  // (the networking module and Fresco), so that setup is done once here and the clients created by
  // createClientBuilder() derive from it with newBuilder(), which copies the socket factory, trust
  // manager and certificate chain cleaner. Everything else (dispatcher, connection pool, cookie
  // jar, timeouts) stays per client, exactly as with a fresh Builder.
  private val tlsConfiguredClient: OkHttpClient by lazy { OkHttpClient.Builder().build() }

  @JvmStatic
  public fun setOkHttpClientFactory(factory: OkHttpClientFactory?) {
    this.factory = factory
  }

  @JvmStatic
  public fun getOkHttpClient(): OkHttpClient {
    return client ?: createClient().also { client = it }
  }

  @JvmStatic
  public fun createClient(): OkHttpClient {
    return factory?.createNewNetworkModuleClient() ?: createClientBuilder().build()
  }

  @JvmStatic
  public fun createClient(context: Context): OkHttpClient {
    return factory?.createNewNetworkModuleClient() ?: createClientBuilder(context).build()
  }

  @JvmStatic
  public fun createClientBuilder(): OkHttpClient.Builder {
    // No timeouts by default
    val client: OkHttpClient.Builder =
        tlsConfiguredClient
            .newBuilder()
            .dispatcher(Dispatcher())
            .connectionPool(ConnectionPool())
            .connectTimeout(0, TimeUnit.MILLISECONDS)
            .readTimeout(0, TimeUnit.MILLISECONDS)
            .writeTimeout(0, TimeUnit.MILLISECONDS)
            .cookieJar(ReactCookieJarContainer())

    return client
  }

  @JvmStatic
  public fun createClientBuilder(context: Context): OkHttpClient.Builder {
    val cacheSize = 10 * 1024 * 1024 // 10 Mo
    return createClientBuilder(context, cacheSize)
  }

  @JvmStatic
  public fun createClientBuilder(context: Context, cacheSize: Int): OkHttpClient.Builder {
    val client: OkHttpClient.Builder = createClientBuilder()

    if (cacheSize == 0) {
      return client
    }

    val cacheDirectory = File(context.cacheDir, "http-cache")
    val cache = Cache(cacheDirectory, cacheSize.toLong())

    return client.cache(cache)
  }
}
