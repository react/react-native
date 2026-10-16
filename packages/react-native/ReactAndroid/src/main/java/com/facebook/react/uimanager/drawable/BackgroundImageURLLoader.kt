/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.content.Context
import android.graphics.Bitmap
import com.facebook.common.executors.CallerThreadExecutor
import com.facebook.common.logging.FLog
import com.facebook.common.references.CloseableReference
import com.facebook.datasource.DataSource
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.imagepipeline.datasource.BaseBitmapDataSubscriber
import com.facebook.imagepipeline.image.CloseableImage
import com.facebook.imagepipeline.request.ImageRequestBuilder
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.views.imagehelper.ImageSource
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

internal class BackgroundImageURLLoader(private val context: Context) {

  private val pendingRequests =
      ConcurrentHashMap<String, DataSource<CloseableReference<CloseableImage>>>()
  private val loadedBitmaps = ConcurrentHashMap<String, Bitmap>()
  private val outstandingRequests = AtomicInteger(0)
  private var onComplete: (() -> Unit)? = null
  private var requestedUris: List<String> = emptyList()

  fun loadImages(
    uris: List<String>,
    onComplete: () -> Unit
  ) {
    val distinctUris = uris.distinct()
    if (distinctUris == requestedUris) {
      return
    }

    cancelAllRequests()

    if (distinctUris.isEmpty()) {
      onComplete()
      return
    }

    requestedUris = distinctUris
    this.onComplete = onComplete
    outstandingRequests.set(distinctUris.size)
    for (uri in distinctUris) {
      val imageRequest =
          ImageRequestBuilder.newBuilderWithSource(ImageSource(context, uri).uri).build()
      val imagePipeline = Fresco.getImagePipeline()
      val dataSource = imagePipeline.fetchDecodedImage(imageRequest, null)

      pendingRequests[uri] = dataSource

      dataSource.subscribe(
        object : BaseBitmapDataSubscriber() {
          override fun onNewResultImpl(bitmap: Bitmap?) {
            if (bitmap != null) {
              val copiedBitmap = bitmap.copy(bitmap.config ?: Bitmap.Config.ARGB_8888, false)
              if (copiedBitmap != null) {
                loadedBitmaps[uri] = copiedBitmap
              } else {
                FLog.w(ReactConstants.TAG, "Could not copy bitmap for background image: %s", uri)
              }
            }
            onRequestComplete(uri)
          }

          override fun onFailureImpl(dataSource: DataSource<CloseableReference<CloseableImage>>) {
            FLog.w(
                ReactConstants.TAG,
                dataSource.failureCause,
                "Failed to load background image: %s",
                uri)
            onRequestComplete(uri)
          }
        },
        CallerThreadExecutor.getInstance()
      )
    }
  }

  fun loadedBitmapForUri(uri: String): Bitmap? = loadedBitmaps[uri]

  private fun onRequestComplete(uri: String) {
    pendingRequests.remove(uri)
    if (outstandingRequests.decrementAndGet() == 0) {
      UiThreadUtil.runOnUiThread { onComplete?.invoke() }
    }
  }

  fun cancelAllRequests() {
    for (dataSource in pendingRequests.values) {
      dataSource.close()
    }
    pendingRequests.clear()
    loadedBitmaps.clear()
    outstandingRequests.set(0)
    onComplete = null
    requestedUris = emptyList()
  }
}
