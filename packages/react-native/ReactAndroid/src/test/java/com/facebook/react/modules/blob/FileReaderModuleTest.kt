/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.blob

import com.facebook.react.bridge.ArrayBuffer
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.bridge.WritableMap
import com.facebook.soloader.SoLoader
import com.facebook.testutils.shadows.ShadowArguments
import com.facebook.testutils.shadows.ShadowArrayBuffer
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowSoLoader
import kotlin.random.Random
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(
    manifest = Config.NONE,
    shadows =
        [
            ShadowArguments::class,
            ShadowArrayBuffer::class,
            ShadowSoLoader::class,
            ShadowNativeLoader::class,
        ],
)
class FileReaderModuleTest {
  private lateinit var bytes: ByteArray
  private lateinit var blobId: String
  private lateinit var context: ReactApplicationContext
  private lateinit var blobModule: BlobModule
  private lateinit var fileReaderModule: FileReaderModule
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
    @Suppress("DEPRECATION")
    whenever(context.catalystInstance.getNativeModule(BlobModule::class.java))
        .thenReturn(blobModule)
    fileReaderModule = FileReaderModule(context)
    blobId = blobModule.store(bytes)
  }

  @After
  fun cleanUp() {
    blobModule.remove(blobId)
    mockedStaticSoLoader.close()
  }

  @Test
  fun testReadAsArrayBuffer() {
    val promise = SimplePromise()
    fileReaderModule.readAsArrayBuffer(blobDescriptor(blobId, 0, bytes.size), promise)

    assertThat(promise.resolved).isEqualTo(1)
    assertThat(promise.rejected).isEqualTo(0)

    val buffer = promise.value as ArrayBuffer
    assertThat(buffer.bytes.position()).isEqualTo(0)
    assertThat(buffer.bytes.limit()).isEqualTo(buffer.bytes.capacity())

    val copy = ByteArray(buffer.size)
    buffer.bytes.get(copy)
    assertThat(copy).isEqualTo(bytes)
  }

  @Test
  fun testReadAsArrayBufferWithOffsetAndSize() {
    val offset = 10
    val size = 20
    val promise = SimplePromise()
    fileReaderModule.readAsArrayBuffer(blobDescriptor(blobId, offset, size), promise)

    assertThat(promise.resolved).isEqualTo(1)
    val buffer = promise.value as ArrayBuffer
    assertThat(buffer.size).isEqualTo(size)

    val copy = ByteArray(size)
    buffer.bytes.get(copy)
    assertThat(copy).isEqualTo(bytes.copyOfRange(offset, offset + size))
  }

  @Test
  fun testReadAsArrayBufferUnknownBlobId() {
    val promise = SimplePromise()
    fileReaderModule.readAsArrayBuffer(blobDescriptor("no-such-id", 0, 4), promise)

    assertThat(promise.rejected).isEqualTo(1)
    assertThat(promise.resolved).isEqualTo(0)
    assertThat(promise.errorCode).isEqualTo("ERROR_INVALID_BLOB")
    assertThat(promise.errorMessage).isEqualTo("The specified blob is invalid")
  }

  @Test
  fun testReadAsArrayBufferMissingBlobId() {
    val blob =
        JavaOnlyMap().apply {
          putInt("offset", 0)
          putInt("size", bytes.size)
        }
    val promise = SimplePromise()
    fileReaderModule.readAsArrayBuffer(blob, promise)

    assertThat(promise.rejected).isEqualTo(1)
    assertThat(promise.resolved).isEqualTo(0)
    assertThat(promise.errorCode).isEqualTo("ERROR_INVALID_BLOB")
    assertThat(promise.errorMessage).isEqualTo("The specified blob does not contain a blobId")
  }

  @Test
  fun testReadAsArrayBufferResolvedBufferDoesNotAliasStorage() {
    val promise = SimplePromise()
    fileReaderModule.readAsArrayBuffer(blobDescriptor(blobId, 0, bytes.size), promise)

    val buffer = promise.value as ArrayBuffer
    buffer.bytes.put(0, (bytes[0] + 1).toByte())
    assertThat(blobModule.resolve(blobId, 0, bytes.size)).isEqualTo(bytes)
  }

  private fun blobDescriptor(id: String, offset: Int, size: Int): JavaOnlyMap =
      JavaOnlyMap().apply {
        putString("blobId", id)
        putInt("offset", offset)
        putInt("size", size)
      }

  internal class SimplePromise : Promise {
    companion object {
      private const val ERROR_DEFAULT_CODE = "EUNSPECIFIED"
      private const val ERROR_DEFAULT_MESSAGE = "Error not specified."
    }

    var resolved = 0
      private set

    var rejected = 0
      private set

    var value: Any? = null
      private set

    var errorCode: String? = null
      private set

    var errorMessage: String? = null
      private set

    override fun resolve(value: Any?) {
      resolved++
      this.value = value
    }

    override fun reject(code: String?, message: String?) {
      reject(code, message, null, null)
    }

    override fun reject(code: String?, throwable: Throwable?) {
      reject(code, null, throwable, null)
    }

    override fun reject(code: String?, message: String?, throwable: Throwable?) {
      reject(code, message, throwable, null)
    }

    override fun reject(throwable: Throwable) {
      reject(null, null, throwable, null)
    }

    override fun reject(throwable: Throwable, userInfo: WritableMap) {
      reject(null, null, throwable, userInfo)
    }

    override fun reject(code: String?, userInfo: WritableMap) {
      reject(code, null, null, userInfo)
    }

    override fun reject(code: String?, throwable: Throwable?, userInfo: WritableMap) {
      reject(code, null, throwable, userInfo)
    }

    override fun reject(code: String?, message: String?, userInfo: WritableMap) {
      reject(code, message, null, userInfo)
    }

    override fun reject(
        code: String?,
        message: String?,
        throwable: Throwable?,
        userInfo: WritableMap?,
    ) {
      rejected++
      errorCode = code ?: ERROR_DEFAULT_CODE
      errorMessage = message ?: throwable?.message ?: ERROR_DEFAULT_MESSAGE
    }

    @Deprecated("Method deprecated", ReplaceWith("reject(code, message)"))
    override fun reject(message: String) {
      reject(null, message, null, null)
    }
  }
}
