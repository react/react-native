/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.blob

import android.net.Uri
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.soloader.SoLoader
import com.facebook.testutils.shadows.ShadowArguments
import java.io.ByteArrayInputStream
import java.nio.ByteBuffer
import java.util.UUID
import kotlin.random.Random
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, shadows = [ShadowArguments::class])
class BlobModuleTest {
  private lateinit var bytes: ByteArray
  private lateinit var blobId: String
  private lateinit var context: ReactApplicationContext
  private lateinit var blobModule: BlobModule
  private lateinit var mockedStaticSoLoader: MockedStatic<SoLoader>

  @Before
  fun prepareModules() {
    mockedStaticSoLoader = mockStatic(SoLoader::class.java)
    mockedStaticSoLoader
        .`when`<Boolean> { SoLoader.loadLibrary("reactnativeblob") }
        .thenReturn(true)

    bytes = ByteArray(120)
    Random.Default.nextBytes(bytes)

    context = ReactTestHelper.createCatalystContextForTest()
    blobModule = BlobModule(context)
    blobId = blobModule.store(bytes)
  }

  @After
  fun cleanUp() {
    blobModule.remove(blobId)
    mockedStaticSoLoader.close()
  }

  @Test
  fun testResolve() {
    assertThat(blobModule.resolve(blobId, 0, bytes.size)).isEqualTo(bytes)
    val expectedRange = bytes.copyOfRange(30, bytes.size)
    assertThat(blobModule.resolve(blobId, 30, bytes.size - 30)).isEqualTo(expectedRange)
  }

  @Test
  fun testResolveUri() {
    val uri =
        Uri.Builder()
            .appendPath(blobId)
            .appendQueryParameter("offset", "0")
            .appendQueryParameter("size", bytes.size.toString())
            .build()

    assertThat(blobModule.resolve(uri)).isEqualTo(bytes)
  }

  @Test
  fun testResolveMap() {
    val blob =
        JavaOnlyMap().apply {
          putString("blobId", blobId)
          putInt("offset", 0)
          putInt("size", bytes.size)
        }

    assertThat(blobModule.resolve(blob)).isEqualTo(bytes)
  }

  @Test
  fun testRemove() {
    assertThat(blobModule.resolve(blobId, 0, bytes.size)).isNotNull()

    blobModule.remove(blobId)

    assertThat(blobModule.resolve(blobId, 0, bytes.size)).isNull()
  }

  @Test
  fun testCreateFromParts() {
    val id = UUID.randomUUID().toString()

    val blobData =
        JavaOnlyMap().apply {
          putString("blobId", blobId)
          putInt("offset", 0)
          putInt("size", bytes.size)
        }
    val blob =
        JavaOnlyMap().apply {
          putMap("data", blobData)
          putString("type", "blob")
        }

    val stringData = "i \u2665 dogs"
    val stringBytes = stringData.encodeToByteArray()
    val string =
        JavaOnlyMap().apply {
          putString("data", stringData)
          putString("type", "string")
        }

    val parts =
        JavaOnlyArray().apply {
          pushMap(blob)
          pushMap(string)
        }

    blobModule.createFromParts(parts, id)

    val resultSize = bytes.size + stringBytes.size

    val result = blobModule.resolve(id, 0, resultSize)

    val buffer =
        ByteBuffer.allocate(resultSize).apply {
          put(bytes)
          put(stringBytes)
        }

    assertThat(result).isEqualTo(buffer.array())
  }

  @Test
  fun testRelease() {
    assertThat(blobModule.resolve(blobId, 0, bytes.size)).isNotNull()

    blobModule.release(blobId)

    assertThat(blobModule.resolve(blobId, 0, bytes.size)).isNull()
  }

  @Test
  fun testUriHandlerSupportsContentUri() {
    val handler = blobModule.networkingUriHandler
    val uri = Uri.parse("content://com.example.provider/blob/123")
    assertThat(handler.supports(uri, "blob")).isTrue()
  }

  @Test
  fun testUriHandlerDoesNotSupportContentUriWithNonBlobResponseType() {
    val handler = blobModule.networkingUriHandler
    val uri = Uri.parse("content://com.example.provider/blob/123")
    assertThat(handler.supports(uri, "text")).isFalse()
  }

  @Test
  fun testUriHandlerDoesNotSupportHttpUri() {
    val handler = blobModule.networkingUriHandler
    val uri = Uri.parse("http://example.com/blob/123")
    assertThat(handler.supports(uri, "blob")).isFalse()
  }

  @Test
  fun testUriHandlerDoesNotSupportHttpsUri() {
    val handler = blobModule.networkingUriHandler
    val uri = Uri.parse("https://example.com/blob/123")
    assertThat(handler.supports(uri, "blob")).isFalse()
  }

  @Test
  fun testUriHandlerSupportsFileUriWithBlobResponseType() {
    val handler = blobModule.networkingUriHandler
    val uri = Uri.parse("file:///storage/emulated/0/Download/test.pdf")
    assertThat(handler.supports(uri, "blob")).isTrue()
  }

  @Test
  fun testUriHandlerFetchesContentUri() {
    val testData = "Hello from content provider!".toByteArray()
    val contentUri = Uri.parse("content://com.example.provider/files/test.txt")

    val shadowResolver = shadowOf(context.contentResolver)
    shadowResolver.registerInputStream(contentUri, ByteArrayInputStream(testData))

    val handler = blobModule.networkingUriHandler
    assertThat(handler.supports(contentUri, "blob")).isTrue()

    val (blob, data) = handler.fetch(contentUri)
    assertThat(data).isEqualTo(testData)
    assertThat(blob.getInt("offset")).isEqualTo(0)
    assertThat(blob.getInt("size")).isEqualTo(testData.size)
    assertThat(blob.getString("blobId")).isNotEmpty()
  }

  @Test
  fun testUriHandlerFetchesFileUri() {
    val testData = "Hello from a local file!".toByteArray()
    val fileUri = Uri.parse("file:///storage/emulated/0/Download/test.txt")

    val shadowResolver = shadowOf(context.contentResolver)
    shadowResolver.registerInputStream(fileUri, ByteArrayInputStream(testData))

    val handler = blobModule.networkingUriHandler

    assertThat(handler.supports(fileUri, "blob")).isTrue()

    val (blob, data) = handler.fetch(fileUri)
    assertThat(data).isEqualTo(testData)
    assertThat(blob.getInt("offset")).isEqualTo(0)
    assertThat(blob.getInt("size")).isEqualTo(testData.size)
    assertThat(blob.getString("blobId")).isNotEmpty()
  }
}
