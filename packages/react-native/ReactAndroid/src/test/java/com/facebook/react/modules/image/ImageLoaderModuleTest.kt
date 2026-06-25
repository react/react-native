/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.image

import android.content.res.Resources
import android.graphics.drawable.Drawable
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import com.facebook.testutils.shadows.ShadowArguments
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@Config(shadows = [ShadowArguments::class, ShadowSoLoader::class])
@RunWith(RobolectricTestRunner::class)
class ImageLoaderModuleTest {

  private lateinit var imageLoaderModule: ImageLoaderModule
  private lateinit var mockedHelper: MockedStatic<ResourceDrawableIdHelper>

  @Before
  fun setUp() {
    val reactContext = ReactTestHelper.createCatalystContextForTest()
    imageLoaderModule = ImageLoaderModule(reactContext)

    mockedHelper = mockStatic(ResourceDrawableIdHelper::class.java)
    // By default, getResourceDrawableUri returns a res:// URI so ImageSource.isResource is true
    // when the source string has no scheme. We need getResourceDrawableId to return a valid ID
    // for the source to be treated as a resource.
    mockedHelper
        .`when`<Int> { ResourceDrawableIdHelper.getResourceDrawableId(any(), any()) }
        .thenReturn(0)
  }

  @After
  fun tearDown() {
    mockedHelper.close()
  }

  @Test
  fun testGetSizeWithVectorDrawableResource() {
    val drawableName = "res_ic_home_filled_20"
    val expectedWidth = 20
    val expectedHeight = 20

    val mockDrawable = mock<Drawable>()
    whenever(mockDrawable.intrinsicWidth).thenReturn(expectedWidth)
    whenever(mockDrawable.intrinsicHeight).thenReturn(expectedHeight)

    mockedHelper
        .`when`<Int> { ResourceDrawableIdHelper.getResourceDrawableId(any(), eq(drawableName)) }
        .thenReturn(12345)
    mockedHelper
        .`when`<Drawable?> { ResourceDrawableIdHelper.getResourceDrawable(any(), eq(drawableName)) }
        .thenReturn(mockDrawable)

    val promise = SimplePromise()
    imageLoaderModule.getSize(drawableName, promise)

    assertThat(promise.resolved).isEqualTo(1)
    assertThat(promise.rejected).isEqualTo(0)

    val result = promise.value as ReadableMap
    assertThat(result.getInt("width")).isEqualTo(expectedWidth)
    assertThat(result.getInt("height")).isEqualTo(expectedHeight)
  }

  @Test
  fun testGetSizeWithHeadersWithVectorDrawableResource() {
    val drawableName = "res_ic_home_filled_20"
    val expectedWidth = 48
    val expectedHeight = 48

    val mockDrawable = mock<Drawable>()
    whenever(mockDrawable.intrinsicWidth).thenReturn(expectedWidth)
    whenever(mockDrawable.intrinsicHeight).thenReturn(expectedHeight)

    mockedHelper
        .`when`<Int> { ResourceDrawableIdHelper.getResourceDrawableId(any(), eq(drawableName)) }
        .thenReturn(12345)
    mockedHelper
        .`when`<Drawable?> { ResourceDrawableIdHelper.getResourceDrawable(any(), eq(drawableName)) }
        .thenReturn(mockDrawable)

    val promise = SimplePromise()
    imageLoaderModule.getSizeWithHeaders(drawableName, null, promise)

    assertThat(promise.resolved).isEqualTo(1)
    assertThat(promise.rejected).isEqualTo(0)

    val result = promise.value as ReadableMap
    assertThat(result.getInt("width")).isEqualTo(expectedWidth)
    assertThat(result.getInt("height")).isEqualTo(expectedHeight)
  }

  @Test
  fun testGetSizeWithNonExistentResource() {
    val drawableName = "res_nonexistent_icon"

    // getResourceDrawableId returns 0 for unknown resources; getResourceDrawable returns null
    mockedHelper
        .`when`<Int> { ResourceDrawableIdHelper.getResourceDrawableId(any(), eq(drawableName)) }
        .thenReturn(0)
    mockedHelper
        .`when`<Drawable?> { ResourceDrawableIdHelper.getResourceDrawable(any(), eq(drawableName)) }
        .thenReturn(null)

    val promise = SimplePromise()
    imageLoaderModule.getSize(drawableName, promise)

    assertThat(promise.rejected).isEqualTo(1)
    assertThat(promise.resolved).isEqualTo(0)
    assertThat(promise.errorCode).isEqualTo("E_GET_SIZE_FAILURE")
  }

  @Test
  fun testGetSizeRejectsWhenResourceDrawableThrows() {
    val drawableName = "res_invalid_vector"

    mockedHelper
        .`when`<Int> { ResourceDrawableIdHelper.getResourceDrawableId(any(), eq(drawableName)) }
        .thenReturn(12345)
    mockedHelper
        .`when`<Drawable?> { ResourceDrawableIdHelper.getResourceDrawable(any(), eq(drawableName)) }
        .thenThrow(Resources.NotFoundException("invalid drawable XML"))

    val promise = SimplePromise()
    imageLoaderModule.getSize(drawableName, promise)

    assertThat(promise.rejected).isEqualTo(1)
    assertThat(promise.resolved).isEqualTo(0)
    assertThat(promise.errorCode).isEqualTo("E_GET_SIZE_FAILURE")
    assertThat(promise.errorMessage).contains("invalid drawable XML")
  }

  @Test
  fun testGetSizeWithDrawableWithNoIntrinsicSize() {
    val drawableName = "res_color_drawable"

    val mockDrawable = mock<Drawable>()
    // ColorDrawable and similar return -1 for intrinsic dimensions
    whenever(mockDrawable.intrinsicWidth).thenReturn(-1)
    whenever(mockDrawable.intrinsicHeight).thenReturn(-1)

    mockedHelper
        .`when`<Int> { ResourceDrawableIdHelper.getResourceDrawableId(any(), eq(drawableName)) }
        .thenReturn(12345)
    mockedHelper
        .`when`<Drawable?> { ResourceDrawableIdHelper.getResourceDrawable(any(), eq(drawableName)) }
        .thenReturn(mockDrawable)

    val promise = SimplePromise()
    imageLoaderModule.getSize(drawableName, promise)

    assertThat(promise.rejected).isEqualTo(1)
    assertThat(promise.resolved).isEqualTo(0)
    assertThat(promise.errorCode).isEqualTo("E_GET_SIZE_FAILURE")
    assertThat(promise.errorMessage).contains("no intrinsic size")
  }

  @Test
  fun testGetSizeWithEmptyUri() {
    val promise = SimplePromise()
    imageLoaderModule.getSize("", promise)

    assertThat(promise.rejected).isEqualTo(1)
    assertThat(promise.resolved).isEqualTo(0)
    assertThat(promise.errorCode).isEqualTo("E_INVALID_URI")
  }

  @Test
  fun testGetSizeWithNullUri() {
    val promise = SimplePromise()
    imageLoaderModule.getSize(null, promise)

    assertThat(promise.rejected).isEqualTo(1)
    assertThat(promise.resolved).isEqualTo(0)
    assertThat(promise.errorCode).isEqualTo("E_INVALID_URI")
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
