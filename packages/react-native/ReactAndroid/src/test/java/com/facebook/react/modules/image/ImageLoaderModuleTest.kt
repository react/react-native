/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.image

import android.content.res.Resources
import android.graphics.drawable.Drawable
import androidx.core.net.toUri
import com.facebook.common.references.CloseableReference
import com.facebook.datasource.DataSource
import com.facebook.datasource.DataSubscriber
import com.facebook.imagepipeline.cache.DefaultCacheKeyFactory
import com.facebook.imagepipeline.common.RotationOptions
import com.facebook.imagepipeline.core.DownsampleMode
import com.facebook.imagepipeline.core.ImagePipeline
import com.facebook.imagepipeline.image.CloseableImage
import com.facebook.imagepipeline.request.ImageRequest
import com.facebook.imagepipeline.request.ImageRequestBuilder
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.views.image.ReactCallerContextFactory
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
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** The payload is never decoded — every test here mocks the image pipeline. */
private const val DATA_URI = "data:image/jpg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA=="

@Config(shadows = [ShadowArguments::class, ShadowSoLoader::class])
@RunWith(RobolectricTestRunner::class)
class ImageLoaderModuleTest {

  private lateinit var imageLoaderModule: ImageLoaderModule
  private lateinit var mockedHelper: MockedStatic<ResourceDrawableIdHelper>
  private lateinit var reactContext: ReactApplicationContext

  @Before
  fun setUp() {
    reactContext = ReactTestHelper.createCatalystContextForTest()
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

  @Test
  fun testGetSizeWithDataUriUsesDecodedPipeline() {
    val pipeline = mock<ImagePipeline>()
    val dataSource = finishedDataSource(decodedRef(1408, 1408))
    whenever(pipeline.fetchDecodedImage(anyOrNull(), anyOrNull())).thenReturn(dataSource)

    val promise = SimplePromise()
    moduleWithPipeline(pipeline).getSize(DATA_URI, promise)
    captureSubscriber(dataSource).onNewResult(dataSource)

    // The encoded pipeline has no producer sequence for data: URIs and throws for them, so routing
    // there at all is the regression this guards.
    verify(pipeline, never()).fetchEncodedImage(any(), anyOrNull())
    assertThat(promise.rejected).isEqualTo(0)
    assertThat(promise.resolved).isEqualTo(1)
    val result = promise.value as ReadableMap
    assertThat(result.getInt("width")).isEqualTo(1408)
    assertThat(result.getInt("height")).isEqualTo(1408)
  }

  @Test
  fun testGetSizeWithHeadersWithDataUriUsesDecodedPipeline() {
    val pipeline = mock<ImagePipeline>()
    val dataSource = finishedDataSource(decodedRef(640, 480))
    whenever(pipeline.fetchDecodedImage(anyOrNull(), anyOrNull())).thenReturn(dataSource)

    val promise = SimplePromise()
    moduleWithPipeline(pipeline).getSizeWithHeaders(DATA_URI, null, promise)
    captureSubscriber(dataSource).onNewResult(dataSource)

    verify(pipeline, never()).fetchEncodedImage(any(), anyOrNull())
    assertThat(promise.rejected).isEqualTo(0)
    val result = promise.value as ReadableMap
    assertThat(result.getInt("width")).isEqualTo(640)
    assertThat(result.getInt("height")).isEqualTo(480)
  }

  /**
   * The decode is only worth doing if it lands under the key `ReactImageView` later reads. Rotation
   * options are part of the bitmap cache key, so `disableRotation` here would warm a key nothing
   * looks up and every rendered frame would decode a second time.
   */
  @Test
  fun testGetSizeWithDataUriSharesBitmapCacheKeyWithReactImageView() {
    val pipeline = mock<ImagePipeline>()
    val dataSource = finishedDataSource(decodedRef(1408, 1408))
    whenever(pipeline.fetchDecodedImage(anyOrNull(), anyOrNull())).thenReturn(dataSource)

    val promise = SimplePromise()
    moduleWithPipeline(pipeline).getSize(DATA_URI, promise)

    val requestCaptor = argumentCaptor<ImageRequest>()
    verify(pipeline).fetchDecodedImage(requestCaptor.capture(), anyOrNull())

    // Mirrors ReactImageView.maybeUpdateViewFromRequest for a data: URI: shouldResize() is false
    // for a non-file, non-content URI under the default resize method, so resize options are null.
    // ReactImageView spells the rotation as the deprecated setAutoRotateEnabled(true), which
    // delegates to exactly this, so the request it builds — and its cache key — is unchanged.
    val reactImageViewRequest =
        ImageRequestBuilder.newBuilderWithSource(DATA_URI.toUri())
            .setRotationOptions(RotationOptions.autoRotate())
            .setProgressiveRenderingEnabled(false)
            .build()

    val cacheKeyFactory = DefaultCacheKeyFactory.getInstance()
    assertThat(cacheKeyFactory.getBitmapCacheKey(requestCaptor.firstValue, null))
        .isEqualTo(cacheKeyFactory.getBitmapCacheKey(reactImageViewRequest, null))
  }

  /**
   * Guards the intent of the change that moved getSize off the decoded pipeline in the first place:
   * the reported dimensions must be intrinsic, not post-downsample.
   */
  @Test
  fun testGetSizeWithDataUriRequestsAnUndownsampledDecode() {
    val pipeline = mock<ImagePipeline>()
    val dataSource = finishedDataSource(decodedRef(1408, 1408))
    whenever(pipeline.fetchDecodedImage(anyOrNull(), anyOrNull())).thenReturn(dataSource)

    moduleWithPipeline(pipeline).getSize(DATA_URI, SimplePromise())

    val requestCaptor = argumentCaptor<ImageRequest>()
    verify(pipeline).fetchDecodedImage(requestCaptor.capture(), anyOrNull())
    val request = requestCaptor.firstValue
    assertThat(request.downsampleOverride).isEqualTo(DownsampleMode.NEVER)
    assertThat(request.resizeOptions).isNull()
    assertThat(request.rotationOptions).isEqualTo(RotationOptions.autoRotate())
  }

  @Test
  fun testGetSizeWithDataUriRejectsWhenDecodeFails() {
    val pipeline = mock<ImagePipeline>()
    val dataSource = mock<DataSource<CloseableReference<CloseableImage>>>()
    whenever(dataSource.failureCause).thenReturn(RuntimeException("decode failed"))
    whenever(pipeline.fetchDecodedImage(anyOrNull(), anyOrNull())).thenReturn(dataSource)

    val promise = SimplePromise()
    moduleWithPipeline(pipeline).getSize(DATA_URI, promise)
    captureSubscriber(dataSource).onFailure(dataSource)

    assertThat(promise.resolved).isEqualTo(0)
    assertThat(promise.rejected).isEqualTo(1)
    assertThat(promise.errorCode).isEqualTo("E_GET_SIZE_FAILURE")
    assertThat(promise.errorMessage).contains("decode failed")
  }

  @Test
  fun testGetSizeWithDataUriRejectsWhenDecodeYieldsNoResult() {
    val pipeline = mock<ImagePipeline>()
    val dataSource = finishedDataSource(null)
    whenever(pipeline.fetchDecodedImage(anyOrNull(), anyOrNull())).thenReturn(dataSource)

    val promise = SimplePromise()
    moduleWithPipeline(pipeline).getSize(DATA_URI, promise)
    captureSubscriber(dataSource).onNewResult(dataSource)

    assertThat(promise.resolved).isEqualTo(0)
    assertThat(promise.rejected).isEqualTo(1)
    assertThat(promise.errorCode).isEqualTo("E_GET_SIZE_FAILURE")
  }

  private fun moduleWithPipeline(pipeline: ImagePipeline): ImageLoaderModule =
      ImageLoaderModule(reactContext, pipeline, mock<ReactCallerContextFactory>())

  private fun decodedRef(width: Int, height: Int): CloseableReference<CloseableImage> {
    val image = mock<CloseableImage>()
    whenever(image.width).thenReturn(width)
    whenever(image.height).thenReturn(height)
    return CloseableReference.of(image)
  }

  private fun finishedDataSource(
      result: CloseableReference<CloseableImage>?,
  ): DataSource<CloseableReference<CloseableImage>> {
    val dataSource = mock<DataSource<CloseableReference<CloseableImage>>>()
    whenever(dataSource.isFinished).thenReturn(true)
    whenever(dataSource.result).thenReturn(result)
    return dataSource
  }

  private fun captureSubscriber(
      dataSource: DataSource<CloseableReference<CloseableImage>>,
  ): DataSubscriber<CloseableReference<CloseableImage>> {
    val captor = argumentCaptor<DataSubscriber<CloseableReference<CloseableImage>>>()
    verify(dataSource).subscribe(captor.capture(), any())
    return captor.firstValue
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
