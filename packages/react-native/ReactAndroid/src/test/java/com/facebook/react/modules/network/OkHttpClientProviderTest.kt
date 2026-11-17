/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.modules.network

import android.content.Context
import java.io.File
import okhttp3.OkHttpClient
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

class OkHttpClientProviderTest {

  @Before
  fun setUp() {
    resetClientProvider()
  }

  @After
  fun tearDown() {
    resetClientProvider()
  }

  @Test
  fun testSetOkHttpClientFactory() {
    val mockFactory = mock<OkHttpClientFactory>()

    OkHttpClientProvider.setOkHttpClientFactory(mockFactory)

    assertThat(OkHttpClientProvider.factory).isNotNull
    assertThat(OkHttpClientProvider.factory).isSameAs(mockFactory)
  }

  @Test
  fun testGetOkHttpClientCreatesClientIfNull() {
    val client = OkHttpClientProvider.getOkHttpClient()

    assertThat(client).isNotNull
    assertThat(OkHttpClientProvider.client).isSameAs(client)
  }

  @Test
  fun testGetOkHttpClientDoesNotCreateNewClientIfAlreadyExists() {
    val existingClient = OkHttpClient()
    OkHttpClientProvider.client = existingClient

    val client = OkHttpClientProvider.getOkHttpClient()

    assertThat(client).isNotNull
    assertThat(client).isSameAs(existingClient)
  }

  @Test
  fun testCreateClientUsesCustomFactoryWhenSet() {
    val mockFactory = mock<OkHttpClientFactory>()
    val customClient = OkHttpClient()
    whenever(mockFactory.createNewNetworkModuleClient()).thenReturn(customClient)

    OkHttpClientProvider.setOkHttpClientFactory(mockFactory)

    val client = OkHttpClientProvider.createClient()

    assertThat(OkHttpClientProvider.factory).isSameAs(mockFactory)
    assertThat(client).isNotNull
    assertThat(client).isSameAs(customClient)
    verify(mockFactory).createNewNetworkModuleClient()
  }

  @Test
  fun testCreateClientBuilderDefaultConfiguration() {
    val builder = OkHttpClientProvider.createClientBuilder()
    val client = builder.build()

    assertThat(client.connectTimeoutMillis()).isEqualTo(0)
    assertThat(client.readTimeoutMillis()).isEqualTo(0)
    assertThat(client.writeTimeoutMillis()).isEqualTo(0)
    assertThat(client.cookieJar()).isInstanceOf(ReactCookieJarContainer::class.java)
  }

  @Test
  fun testCreatedClientsShareTlsSetupButNotDispatcherOrPool() {
    val first = OkHttpClientProvider.createClientBuilder().build()
    val second = OkHttpClientProvider.createClientBuilder().build()

    // The platform trust manager / SSL socket factory are resolved once and reused ...
    assertThat(second.sslSocketFactory()).isSameAs(first.sslSocketFactory())
    assertThat(second.x509TrustManager).isSameAs(first.x509TrustManager)
    // ... while each client keeps its own dispatcher, connection pool and cookie jar.
    assertThat(second.dispatcher()).isNotSameAs(first.dispatcher())
    assertThat(second.connectionPool()).isNotSameAs(first.connectionPool())
    assertThat(second.cookieJar()).isNotSameAs(first.cookieJar())
  }

  @Test
  fun testCreateClientBuilderWithContextUsesDefaultCacheSize() {
    val mockContext = mock<Context>()
    val mockCacheDir = File("mockCacheDir")
    whenever(mockContext.cacheDir).thenReturn(mockCacheDir)

    val builder = OkHttpClientProvider.createClientBuilder(mockContext)
    val client = builder.build()
    val cache = client.cache()

    assertThat(cache).isNotNull
    assertThat(checkNotNull(cache).directory()).isEqualTo(File(mockCacheDir, "http-cache"))
    assertThat(cache.maxSize()).isEqualTo(10 * 1024 * 1024) // 10 MB
  }

  @Test
  fun testCreateClientBuilderWithZeroCacheSize() {
    val mockContext = mock<Context>()
    val builder = OkHttpClientProvider.createClientBuilder(mockContext, 0)
    val client = builder.build()

    assertThat(client.cache()).isNull()
  }

  @Test
  fun testCreateClientBuilderWithCustomCacheSize() {
    val mockContext = mock<Context>()
    val mockCacheDir = File("mockCacheDir")
    whenever(mockContext.cacheDir).thenReturn(mockCacheDir)

    val customCacheSize: Long = 20 * 1024 * 1024 // 20 MB
    val builder = OkHttpClientProvider.createClientBuilder(mockContext, customCacheSize.toInt())
    val client = builder.build()
    val cache = client.cache()

    assertThat(cache).isNotNull
    assertThat(checkNotNull(cache).directory()).isEqualTo(File(mockCacheDir, "http-cache"))
    assertThat(cache.maxSize()).isEqualTo(customCacheSize)
  }

  private fun resetClientProvider() {
    OkHttpClientProvider.setOkHttpClientFactory(null)
    OkHttpClientProvider.client = null
  }
}
