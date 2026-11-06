/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import android.graphics.RectF
import com.facebook.common.executors.UiThreadImmediateExecutorService
import com.facebook.common.logging.FLog
import com.facebook.common.references.CloseableReference
import com.facebook.datasource.BaseDataSubscriber
import com.facebook.datasource.DataSource
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.drawee.components.DeferredReleaser
import com.facebook.imagepipeline.common.ImageDecodeOptions
import com.facebook.imagepipeline.image.CloseableImage
import com.facebook.imagepipeline.image.CloseableStaticBitmap
import com.facebook.imagepipeline.request.ImageRequestBuilder
import com.facebook.react.common.ReactConstants
import com.facebook.react.uimanager.style.BackgroundImageLayer
import com.facebook.react.views.imagehelper.ImageSource

/**
 * Loads the `url()` layers of a view's background image. Keeps one request for each unique uri and
 * calls [onLoad] on the UI thread each time an image finishes loading. Use it only on the UI
 * thread.
 */
internal class BackgroundImageURLLoader(
    private val context: Context,
    private val onLoad: () -> Unit,
) {

  private var entries: List<Entry> = emptyList()

  /**
   * Requests every `url()` layer in [backgroundImageLayers]. Does nothing if the uris did not
   * change since the last call. Cancels all requests when there are no `url()` layers.
   */
  fun loadBackgroundImages(backgroundImageLayers: List<BackgroundImageLayer>) {
    val distinctUris =
        backgroundImageLayers.mapNotNull { it.uri }.filter { it.isNotEmpty() }.distinct()
    if (distinctUris == entries.map { it.uri }) {
      return
    }

    // Keep the entries for uris that are still used, so their images do not disappear while the
    // new ones load.
    val newEntries = mutableListOf<Entry>()
    val nextEntries =
        distinctUris.map { uri ->
          entries.find { it.uri == uri } ?: Entry(uri).also { newEntries.add(it) }
        }
    entries.filter { it !in nextEntries }.forEach { it.cancel() }
    entries = nextEntries
    newEntries.forEach { it.start() }
  }

  fun cancelRequests() {
    entries.forEach { it.cancel() }
    entries = emptyList()
  }

  /** Returns null until the image for [uri] has loaded. */
  fun imageForUri(uri: String): OrientedBitmap? = entries.find { it.uri == uri }?.image

  /**
   * A decoded image from the pipeline's cache. Fresco's drawee also draws the shared bitmap and
   * applies the EXIF orientation when it draws, in the same way as [drawMatrix].
   */
  class OrientedBitmap(val bitmap: Bitmap, exifOrientation: Int, rotationAngle: Int) {
    private val orientation =
        Matrix().apply {
          when (exifOrientation) {
            2 -> setScale(-1f, 1f)
            4 -> setScale(1f, -1f)
            5 -> {
              setRotate(270f)
              postScale(1f, -1f)
            }
            7 -> {
              setRotate(270f)
              postScale(-1f, 1f)
            }
            else -> if (rotationAngle > 0) setRotate(rotationAngle.toFloat())
          }
        }
    private val orientedBounds =
        RectF(0f, 0f, bitmap.width.toFloat(), bitmap.height.toFloat()).also {
          orientation.mapRect(it)
        }

    /** Width in pixels, after the EXIF orientation. */
    val width: Float
      get() = orientedBounds.width()

    /** Height in pixels, after the EXIF orientation. */
    val height: Float
      get() = orientedBounds.height()

    /** Returns a matrix that draws [bitmap] upright and scaled to [width] x [height]. */
    fun drawMatrix(width: Float, height: Float): Matrix =
        Matrix(orientation).apply {
          postTranslate(-orientedBounds.left, -orientedBounds.top)
          postScale(width / orientedBounds.width(), height / orientedBounds.height())
        }
  }

  private inner class Entry(val uri: String) {
    var image: OrientedBitmap? = null
      private set

    private var dataSource: DataSource<CloseableReference<CloseableImage>>? = null
    // Keeps the bitmap in the pipeline's cache while this entry draws it.
    private var imageReference: CloseableReference<CloseableImage>? = null
    private var cancelled = false

    fun start() {
      val imageRequest =
          ImageRequestBuilder.newBuilderWithSource(ImageSource(context, uri).uri)
              // Like iOS, animated images show their first frame.
              .setImageDecodeOptions(
                  ImageDecodeOptions.newBuilder().setForceStaticImage(true).build()
              )
              .build()
      val dataSource = Fresco.getImagePipeline().fetchDecodedImage(imageRequest, null)
      this.dataSource = dataSource
      dataSource.subscribe(
          object : BaseDataSubscriber<CloseableReference<CloseableImage>>() {
            override fun onNewResultImpl(
                dataSource: DataSource<CloseableReference<CloseableImage>>
            ) {
              if (!dataSource.isFinished) {
                return
              }
              val imageReference = dataSource.result ?: return
              // This is the final image. Closing the data source makes any later callback get
              // no result, so only this reference is kept.
              dataSource.close()
              val staticBitmap = imageReference.get() as? CloseableStaticBitmap
              val bitmap = staticBitmap?.underlyingBitmap
              if (cancelled || staticBitmap == null || bitmap == null) {
                CloseableReference.closeSafely(imageReference)
                return
              }
              this@Entry.imageReference = imageReference
              image =
                  OrientedBitmap(bitmap, staticBitmap.exifOrientation, staticBitmap.rotationAngle)
              onLoad()
            }

            override fun onFailureImpl(dataSource: DataSource<CloseableReference<CloseableImage>>) {
              FLog.w(
                  ReactConstants.TAG,
                  dataSource.failureCause,
                  "Failed to load background image: %s",
                  uri,
              )
            }
          },
          // Like Fresco's drawee. A cached image calls back at once.
          UiThreadImmediateExecutorService.getInstance(),
      )
    }

    fun cancel() {
      cancelled = true
      dataSource?.close()
      image = null
      val imageReference = imageReference ?: return
      this.imageReference = null
      // The last frame drawn can still use the bitmap, so release it after that frame, like
      // Fresco's drawee.
      DeferredReleaser.getInstance().scheduleDeferredRelease {
        CloseableReference.closeSafely(imageReference)
      }
    }
  }
}
